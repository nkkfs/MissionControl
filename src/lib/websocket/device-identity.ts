/**
 * Device identity for the OpenClaw v3 handshake.
 *
 * The gateway expects the browser to prove it owns a stable cryptographic
 * identity: an Ed25519 keypair generated via WebCrypto, persisted per
 * origin, and used to sign the `nonce` returned in `connect.challenge`.
 *
 * Storage strategy:
 *   - The CryptoKey objects themselves are stored in IndexedDB via
 *     structured clone. The private key bytes never leave the browser
 *     process — pages cannot dump them out of localStorage.
 *   - The stable `device.id` is derived as a base64url SHA-256 digest of
 *     the raw public key bytes, so the same keypair always yields the
 *     same id. Calling {@link clearDeviceIdentity} produces a fresh id
 *     with no state to reconcile.
 *
 * Signing payload (v3):
 *   The canonical JSON of an object that mirrors what the gateway sees
 *   on the wire, with keys recursively sorted alphabetically and no
 *   whitespace:
 *
 *     {
 *       "client": { "id": "...", "mode": "..." },
 *       "deviceFamily": "browser",
 *       "nonce": "...",
 *       "platform": "web",
 *       "role": "operator",
 *       "scopes": ["operator.read", ...],
 *       "signedAt": 1744041234567
 *     }
 *
 *   `signedAt` is a plain integer (milliseconds since epoch) — never an
 *   ISO string, never a Date.
 */

const DB_NAME = "mc-device-identity";
const STORE = "keys";
const RECORD_KEY = "current";
const LEGACY_LS_KEY = "mc-device-identity-v1";
const SUBTLE_ALG = { name: "Ed25519" } as const;

export interface DeviceIdentity {
  /** Stable, public identifier derived from the public key. */
  id: string;
  /** Base64url-encoded raw public key (32 bytes for Ed25519). */
  publicKey: string;
  /** ISO-8601 timestamp recording when the identity was first generated. */
  createdAt: string;
  /** Live CryptoKey handle for signing. Never exported. */
  privateKey: CryptoKey;
  /** Live CryptoKey handle for the public key (extractable for export-raw). */
  publicKeyCrypto: CryptoKey;
}

export interface SignContext {
  /** Sent on the wire as `client.id`. */
  clientId: string;
  /** Sent on the wire as `client.mode`. */
  mode: string;
  /** Sent on the wire as `role`. */
  role: string;
  /** Sent on the wire as `scopes`. */
  scopes: string[];
  /** Sent on the wire as `client.platform`; defaults to `"web"`. */
  platform?: string;
  /** Sent on the wire as `device.deviceFamily` (informational). */
  deviceFamily?: string;
}

export interface SignedChallenge {
  /** Base64url Ed25519 signature over the canonical JSON payload. */
  signature: string;
  /** Integer milliseconds since epoch — MUST be a number, never a string. */
  signedAt: number;
  /** The nonce that was signed, echoed back verbatim. */
  nonce: string;
}

/* ---------------------- Environment preconditions ----------------------- */

export function isSecureContext(): boolean {
  if (typeof window === "undefined") return false;
  // window.isSecureContext is true for HTTPS and http://localhost.
  return Boolean(window.isSecureContext);
}

export function hasIndexedDb(): boolean {
  return typeof indexedDB !== "undefined";
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

/**
 * Stable JSON stringification with recursively sorted keys and no
 * whitespace. The Ed25519 signature is computed over this exact byte
 * sequence so the gateway can re-canonicalize the same payload and
 * verify with the included public key.
 */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return "[" + value.map(canonicalJson).join(",") + "]";
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return (
    "{" +
    keys
      .map((k) => JSON.stringify(k) + ":" + canonicalJson(obj[k]))
      .join(",") +
    "}"
  );
}

/* ----------------------------- IndexedDB I/O ---------------------------- */

interface StoredIdentity {
  privateKey: CryptoKey;
  publicKey: CryptoKey;
  createdAt: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!hasIndexedDb()) {
      reject(
        new DeviceIdentityError(
          "storage-unavailable",
          "This browser has no IndexedDB available — device identity cannot be persisted.",
        ),
      );
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () =>
      reject(
        new DeviceIdentityError(
          "storage-unavailable",
          `Could not open IndexedDB: ${req.error?.message ?? "unknown error"}`,
        ),
      );
  });
}

async function readStored(): Promise<StoredIdentity | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(RECORD_KEY);
    req.onsuccess = () => {
      const result = req.result as StoredIdentity | undefined;
      if (
        result &&
        typeof result === "object" &&
        result.privateKey &&
        result.publicKey
      ) {
        resolve(result);
      } else {
        resolve(null);
      }
    };
    req.onerror = () =>
      reject(
        new DeviceIdentityError(
          "storage-unavailable",
          `Failed to read device identity: ${req.error?.message ?? "unknown"}`,
        ),
      );
  });
}

async function writeStored(value: StoredIdentity): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).put(value, RECORD_KEY);
    req.onsuccess = () => resolve();
    req.onerror = () =>
      reject(
        new DeviceIdentityError(
          "storage-unavailable",
          `Failed to persist device identity: ${req.error?.message ?? "unknown"}`,
        ),
      );
  });
}

async function deleteStored(): Promise<void> {
  if (!hasIndexedDb()) return;
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const req = tx.objectStore(STORE).delete(RECORD_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // best-effort
  }
}

/**
 * Drop any localStorage entry left behind by an older build that stored
 * keys as JWK in plain text. Called automatically before the first IDB
 * read so users do not have to manually clear anything.
 */
function clearLegacyLocalStorage(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LEGACY_LS_KEY);
  } catch {
    // ignore
  }
}

export async function clearDeviceIdentity(): Promise<void> {
  clearLegacyLocalStorage();
  await deleteStored();
}

/* ----------------------------- Key material ----------------------------- */

async function generatePair(): Promise<StoredIdentity> {
  if (!isSecureContext()) {
    throw new DeviceIdentityError(
      "insecure-context",
      "WebCrypto Ed25519 requires a secure context. Open Mission Control over " +
        "https:// (e.g. Tailscale Serve, Nginx + TLS) or via http://localhost.",
    );
  }
  if (typeof crypto === "undefined" || !crypto.subtle) {
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
      true, // extractable so we can export the *public* key to raw bytes
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

  return {
    privateKey: pair.privateKey,
    publicKey: pair.publicKey,
    createdAt: new Date().toISOString(),
  };
}

async function deriveDeviceId(publicKey: CryptoKey): Promise<{
  id: string;
  publicKeyRaw: string;
}> {
  const raw = new Uint8Array(await crypto.subtle.exportKey("raw", publicKey));
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", raw));
  // 22 base64url chars is ~128 bits — plenty for collision resistance and
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

  // First-run cleanup of any pre-IDB localStorage payload.
  clearLegacyLocalStorage();

  let stored: StoredIdentity | null = null;
  try {
    stored = await readStored();
  } catch (err) {
    // Storage failure — surface verbatim so the UI explains the issue.
    throw err instanceof DeviceIdentityError
      ? err
      : new DeviceIdentityError(
          "storage-unavailable",
          (err as Error)?.message ?? "Unknown IndexedDB error",
        );
  }

  if (!stored) {
    stored = await generatePair();
    await writeStored(stored);
  }

  const { id, publicKeyRaw } = await deriveDeviceId(stored.publicKey);
  return {
    id,
    publicKey: publicKeyRaw,
    createdAt: stored.createdAt,
    privateKey: stored.privateKey,
    publicKeyCrypto: stored.publicKey,
  };
}

/**
 * Sign the gateway-issued challenge nonce with the device private key.
 *
 * The signed payload is the canonical JSON of:
 *   { client: { id, mode }, deviceFamily, nonce, platform, role, scopes, signedAt }
 *
 * `signedAt` is generated here as `Date.now()` and returned alongside
 * the signature so the caller can put the *exact same integer* on the
 * wire — passing a different value to the gateway would break verification.
 */
export async function signChallenge(
  identity: DeviceIdentity,
  nonce: string,
  ctx: SignContext,
): Promise<SignedChallenge> {
  const signedAt = Date.now();
  const platform = ctx.platform ?? "web";
  const deviceFamily = ctx.deviceFamily ?? "browser";

  const payload = canonicalJson({
    client: { id: ctx.clientId, mode: ctx.mode },
    deviceFamily,
    nonce,
    platform,
    role: ctx.role,
    scopes: ctx.scopes,
    signedAt,
  });

  const data = new TextEncoder().encode(payload);
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
 * key. Returns `null` when no identity has been generated yet.
 */
export interface DeviceIdentitySummary {
  id: string;
  publicKey: string;
  createdAt: string;
}

export async function getDeviceIdentitySummary(): Promise<DeviceIdentitySummary | null> {
  if (typeof window === "undefined") return null;
  try {
    const stored = await readStored();
    if (!stored) return null;
    const { id, publicKeyRaw } = await deriveDeviceId(stored.publicKey);
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
