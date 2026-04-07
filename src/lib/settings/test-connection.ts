import type { OpenClawClientConfig } from "@/lib/websocket/client";
import {
  DeviceIdentityError,
  getOrCreateDeviceIdentity,
  isSecureContext,
  signChallenge,
} from "@/lib/websocket/device-identity";

export type TestConnectionResult =
  | {
      ok: true;
      protocol: number;
      tickIntervalMs: number | null;
      durationMs: number;
      deviceId: string;
    }
  | {
      ok: false;
      stage: "insecure" | "identity" | "open" | "handshake" | "timeout" | "close";
      message: string;
      hint?: string;
      durationMs: number;
    };

/**
 * Opens a one-shot WebSocket connection to the given gateway, performs
 * the full protocol-v3 handshake (including device identity + signed
 * challenge), and resolves once the gateway replies with `hello-ok` (or
 * rejects with a descriptive failure).
 *
 * The transient socket is always closed before resolving so this does
 * not interfere with the long-lived client that backs the rest of the
 * app. Any gateway-issued deviceToken returned in the handshake is
 * discarded here — the Test Connection panel's job is to verify the
 * identity half of the handshake, not to persist credentials.
 */
export async function testConnection(
  config: OpenClawClientConfig,
  timeoutMs = 8000,
): Promise<TestConnectionResult> {
  const start =
    typeof performance !== "undefined" ? performance.now() : Date.now();

  const since = () =>
    Math.round(
      (typeof performance !== "undefined" ? performance.now() : Date.now()) -
        start,
    );

  // Secure-context gate — WebCrypto Ed25519 only works over https:// and
  // http://localhost, so bail early with a specific, actionable message.
  if (!isSecureContext()) {
    return {
      ok: false,
      stage: "insecure",
      message:
        "Your browser is not in a secure context, so Mission Control cannot " +
        "generate a device identity. Open this app over https:// (Tailscale " +
        "Serve or Nginx + TLS) or via http://localhost.",
      hint: "Mixed-content rules also block ws:// from https:// pages — prefer wss://.",
      durationMs: since(),
    };
  }

  // Pre-generate the device identity before opening the socket, so any
  // WebCrypto failure is reported with the right stage tag.
  let identity;
  try {
    identity = await getOrCreateDeviceIdentity();
  } catch (err) {
    const e = err as DeviceIdentityError;
    return {
      ok: false,
      stage: "identity",
      message: e.message,
      hint:
        e.code === "ed25519-unsupported"
          ? "Update to the latest Chrome, Edge, Firefox, or Safari."
          : "Try clearing the saved device identity in Settings and retrying.",
      durationMs: since(),
    };
  }

  return new Promise((resolve) => {
    let settled = false;
    let ws: WebSocket | null = null;

    const finish = (result: TestConnectionResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      try {
        ws?.close();
      } catch {
        // Nothing we can do if close throws.
      }
      resolve(result);
    };

    const timeout = setTimeout(() => {
      finish({
        ok: false,
        stage: "timeout",
        message: `No hello-ok received after ${timeoutMs} ms`,
        durationMs: since(),
      });
    }, timeoutMs);

    try {
      ws = new WebSocket(config.url);
    } catch (err) {
      finish({
        ok: false,
        stage: "open",
        message: (err as Error)?.message ?? "Failed to open WebSocket",
        durationMs: since(),
      });
      return;
    }

    ws.onerror = () => {
      finish({
        ok: false,
        stage: "open",
        message: `Failed to connect to ${config.url}`,
        durationMs: since(),
      });
    };

    ws.onclose = (event) => {
      finish({
        ok: false,
        stage: "close",
        message:
          event.reason ||
          `Socket closed before handshake (code ${event.code})`,
        durationMs: since(),
      });
    };

    ws.onmessage = async (event) => {
      if (settled) return;
      let msg: {
        type?: string;
        event?: string;
        id?: string;
        ok?: boolean;
        payload?: Record<string, unknown>;
        error?: { message?: string };
      };
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      if (msg.type === "event" && msg.event === "connect.challenge") {
        const nonce =
          typeof msg.payload?.nonce === "string"
            ? (msg.payload.nonce as string)
            : null;

        const params: Record<string, unknown> = {
          minProtocol: config.minProtocol,
          maxProtocol: config.maxProtocol,
          client: {
            id: config.clientId,
            version: config.version,
            platform: "web",
            mode: config.mode,
          },
        };

        try {
          if (nonce) {
            const signed = await signChallenge(identity, nonce);
            params.device = {
              id: identity.id,
              publicKey: identity.publicKey,
              signature: signed.signature,
              signedAt: signed.signedAt,
              nonce: signed.nonce,
            };
          } else {
            params.device = {
              id: identity.id,
              publicKey: identity.publicKey,
            };
          }
        } catch (err) {
          finish({
            ok: false,
            stage: "identity",
            message: (err as Error)?.message ?? "Failed to sign challenge",
            durationMs: since(),
          });
          return;
        }

        // Test Connection honours any token the user pasted into the
        // settings so it can verify a pre-provisioned reconnect, but
        // omits the auth block when the field is empty.
        if (config.deviceToken) {
          params.auth = { deviceToken: config.deviceToken };
        }

        const req = {
          type: "req",
          id: "test-connect",
          method: "connect",
          params,
        };
        try {
          ws!.send(JSON.stringify(req));
        } catch (err) {
          finish({
            ok: false,
            stage: "handshake",
            message:
              (err as Error)?.message ?? "Failed to send connect request",
            durationMs: since(),
          });
        }
        return;
      }

      if (msg.type === "res" && msg.id === "test-connect") {
        if (msg.ok && msg.payload && msg.payload.type === "hello-ok") {
          const protocol = Number(msg.payload.protocol ?? 0);
          const policy = msg.payload.policy as
            | { tickIntervalMs?: number }
            | undefined;
          finish({
            ok: true,
            protocol,
            tickIntervalMs: policy?.tickIntervalMs ?? null,
            durationMs: since(),
            deviceId: identity.id,
          });
        } else {
          finish({
            ok: false,
            stage: "handshake",
            message:
              msg.error?.message ??
              "Gateway rejected the handshake (no hello-ok)",
            durationMs: since(),
          });
        }
      }
    };
  });
}
