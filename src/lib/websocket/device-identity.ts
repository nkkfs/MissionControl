/**
 * Device identity for the OpenClaw v3 handshake.
 *
 * The gateway expects the browser to prove it owns a stable cryptographic
 * identity: an Ed25519 keypair generated via WebCrypto, persisted per
 * origin, and used to sign the `nonce` returned in `connect.challenge`.
 *
 * Storage strategy:
 *   - Private + public keys are exported as JWK and stored in localStorage
 *     under `mc-device-identity-v1`. The keys are `extractable: true` so
 *     they can be re-imported on reload; the origin isolation of
 *     localStorage is the security boundary.
 *   - The stable `device.id` is derived as a base64url SHA-256 digest of
 *     the raw public key bytes. This means the same keypair always yields
 *     the same id, and re-generating (via "Clear Device Identity") produces
 *     a fresh id with no state to reconcile.
 *
 * The signing payload is a canonical string `${nonce}.${deviceId}.${signedAt}`.
 * This is the simplest shape that still binds the signature to the exact
 * challenge and timestamp the gateway sees. If a future gateway release
 * tightens the spec this is the one place to adjust.
 */

const STORAGE_KEY = "mc-device-identity-v1";
const SUBTLE_ALG = { name: "Ed25519" } as const;

export interface DeviceIdentity {
  /** Stable, public identifier derived from the public key. */
  id: string;
  /** Base64url-encoded raw public key (32 bytes for Ed25519). */
  publicKey: string;
  /** ISO-8601 timestamp recording when the identity was first generated. */
  createdAt: string;
  /** Live CryptoKey handle, only populated for in-memory instances. */
  privateKey: CryptoKey;
  /** Live CryptoKey handle for the corresponding public key. */
  publicKeyCrypto: CryptoKey;
}

export interface SignedChallenge {
  /** Base64url Ed25519 signature over the canonical string. */
  signature: string;
  /** ISO-8601 signing timestamp included in the signed payload. */
  signedAt: string;
  /** The nonce that was signed, echoed back verbatim. */
  nonce: string;
}

/* ---------------------- Environment preconditions ----------------------- */

export function isSecureContext(): boolean {
  if (typeof window === "undefined") return false;
  // window.isSecureContext is true for HTTPS and http://localhost.
  return Boolean(window.isSecureContext);
}

export function hasWebCryptoEd25519(): boolean {
  if (typeof crypto === "undefined" || !crypto.subtle) return false;
  // There is no official feature-detect API for individual algorithms, so
  // callers should attempt a generateKey and catch DOMException. We expose
  // this helper as a cheap gate for UI warnings only.
  return typeof crypto.subtle.generateKey === "function";
}

export class DeviceIdentityError extends Error {
  readonly code:
    | "insecure-context"
    | "webcrypto-missing"
    | "ed25519-unsupported"
    | "storage-unavailable"
    | "sign-failed"
    | "import-failed";
  constructor(code: DeviceIdentityError["code"], message: string) {
    super(message);
    this.code = code;
    this.name = "DeviceIdentityError";
  }
}

/* ------------------------------- Encoding ------------------------------- */

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const b64 = btoa(binary);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/* ----------------------------- Storage layer ---------------------------- */

interface StoredIdentity {
  publicKeyJwk: JsonWebKey;
  privateKeyJwk: JsonWebKey;
  createdAt: string;
}

function readStored(): StoredIdentity | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredIdentity;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !parsed.publicKeyJwk ||
      !parsed.privateKeyJwk
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeStored(value: StoredIdentity): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch (err) {
    throw new DeviceIdentityError(
      "storage-unavailable",
      `Could not persist device identity: ${(err as Error).message}`,
    );
  }
}

export function clearDeviceIdentity(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore — nothing we can do if localStorage is wedged
  }
}

/* ----------------------------- Key material ----------------------------- */

async function importPair(
  stored: StoredIdentity,
): Promise<{ privateKey: CryptoKey; publicKey: CryptoKey }> {
  try {
    const [privateKey, publicKey] = await Promise.all([
      crypto.subtle.importKey(
        "jwk",
        stored.privateKeyJwk,
        SUBTLE_ALG,
        true,
        ["sign"],
      ),
      crypto.subtle.importKey(
        "jwk",
        stored.publicKeyJwk,
        SUBTLE_ALG,
        true,
        ["verify"],
      ),
    ]);
    return { privateKey, publicKey };
  } catch (err) {
    throw new DeviceIdentityError(
      "import-failed",
      `Stored device identity could not be imported: ${(err as Error).message}. ` +
        `Clear the saved identity from Settings and try again.`,
    );
  }
}

async function generatePair(): Promise<{
  privateKey: CryptoKey;
  publicKey: CryptoKey;
  storable: StoredIdentity;
}> {
  if (!isSecureContext()) {
    throw new DeviceIdentityError(
      "insecure-context",
      "WebCrypto Ed25519 requires a secure context. Open Mission Control over " +
        "https:// or http://localhost.",
    );
  }
  if (!hasWebCryptoEd25519()) {
    throw new DeviceIdentityError(
      "webcrypto-missing",
      "This browser does not expose crypto.subtle. Use a recent version of " +
        "Chrome, Edge, Firefox, or Safari.",
    );
  }

  let pair: CryptoKeyPair;
  try {
    pair = (await crypto.subtle.generateKey(
      SUBTLE_ALG,
      true,
      ["sign", "verify"],
    )) as CryptoKeyPair;
  } catch (err) {
    throw new DeviceIdentityError(
      "ed25519-unsupported",
      "This browser does not support Ed25519 in WebCrypto yet. " +
        "Update to the latest Chrome/Edge/Firefox/Safari. Original error: " +
        (err as Error).message,
    );
  }

  const [privateKeyJwk, publicKeyJwk] = await Promise.all([
    crypto.subtle.exportKey("jwk", pair.privateKey),
    crypto.subtle.exportKey("jwk", pair.publicKey),
  ]);

  const storable: StoredIdentity = {
    publicKeyJwk,
    privateKeyJwk,
    createdAt: new Date().toISOString(),
  };
  return { privateKey: pair.privateKey, publicKey: pair.publicKey, storable };
}

async function deriveDeviceId(publicKey: CryptoKey): Promise<{
  id: string;
  publicKeyRaw: string;
}> {
  const raw = new Uint8Array(await crypto.subtle.exportKey("raw", publicKey));
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", raw));
  // 16 base64url chars is ~96 bits — plenty for collision resistance and
  // short enough to show in a settings card without wrapping.
  return {
    id: bytesToBase64Url(digest).slice(0, 22),
    publicKeyRaw: bytesToBase64Url(raw),
  };
}

/* ------------------------------- Public API ----------------------------- */

/**
 * Return the persistent device identity, generating and saving a fresh
 * keypair the first time it is called. Subsequent calls in the same or
 * future sessions return the exact same identity (same `id`, same
 * `publicKey`) until {@link clearDeviceIdentity} is invoked.
 */
export async function getOrCreateDeviceIdentity(): Promise<DeviceIdentity> {
  if (typeof window === "undefined") {
    throw new DeviceIdentityError(
      "storage-unavailable",
      "Device identity can only be accessed in the browser.",
    );
  }

  const existing = readStored();
  if (existing) {
    const { privateKey, publicKey } = await importPair(existing);
    const { id, publicKeyRaw } = await deriveDeviceId(publicKey);
    return {
      id,
      publicKey: publicKeyRaw,
      createdAt: existing.createdAt,
      privateKey,
      publicKeyCrypto: publicKey,
    };
  }

  const { privateKey, publicKey, storable } = await generatePair();
  writeStored(storable);
  const { id, publicKeyRaw } = await deriveDeviceId(publicKey);
  return {
    id,
    publicKey: publicKeyRaw,
    createdAt: storable.createdAt,
    privateKey,
    publicKeyCrypto: publicKey,
  };
}

/**
 * Sign the gateway-issued challenge nonce with the device private key.
 * The canonical payload is `${nonce}.${deviceId}.${signedAt}` — the gateway
 * is expected to reconstruct the same string and verify against the
 * public key we send alongside in `device.publicKey`.
 */
export async function signChallenge(
  identity: DeviceIdentity,
  nonce: string,
): Promise<SignedChallenge> {
  const signedAt = new Date().toISOString();
  const canonical = `${nonce}.${identity.id}.${signedAt}`;
  const data = new TextEncoder().encode(canonical);
  let signatureBytes: ArrayBuffer;
  try {
    signatureBytes = await crypto.subtle.sign(
      SUBTLE_ALG,
      identity.privateKey,
      data,
    );
  } catch (err) {
    throw new DeviceIdentityError(
      "sign-failed",
      `Failed to sign the gateway challenge: ${(err as Error).message}`,
    );
  }
  return {
    signature: bytesToBase64Url(new Uint8Array(signatureBytes)),
    signedAt,
    nonce,
  };
}

/**
 * Read-only summary safe to expose to the UI. Never includes the private
 * key. Returns `null` when no identity has been generated yet, so the
 * Settings page can show a "no identity — will be created on first
 * connect" hint instead of forcing generation during a page render.
 */
export interface DeviceIdentitySummary {
  id: string;
  publicKey: string;
  createdAt: string;
}

export async function getDeviceIdentitySummary(): Promise<DeviceIdentitySummary | null> {
  const stored = readStored();
  if (!stored) return null;
  try {
    const { publicKey } = await importPair(stored);
    const { id, publicKeyRaw } = await deriveDeviceId(publicKey);
    return {
      id,
      publicKey: publicKeyRaw,
      createdAt: stored.createdAt,
    };
  } catch {
    // Corrupt entry — surface as "none" so the UI can offer a reset.
    return null;
  }
}
