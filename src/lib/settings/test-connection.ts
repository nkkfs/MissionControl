import type { OpenClawClientConfig } from "@/lib/websocket/client";

export type TestConnectionResult =
  | {
      ok: true;
      protocol: number;
      tickIntervalMs: number | null;
      durationMs: number;
    }
  | {
      ok: false;
      stage: "open" | "handshake" | "timeout" | "close";
      message: string;
      durationMs: number;
    };

/**
 * Opens a one-shot WebSocket connection to the given gateway, sends a
 * protocol-v3 `connect` request in response to `connect.challenge`, and
 * resolves once the gateway replies with `hello-ok` (or rejects with a
 * descriptive failure). The transient socket is always closed before
 * resolving so this does not interfere with the long-lived client that
 * backs the rest of the app.
 */
export function testConnection(
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

    ws.onmessage = (event) => {
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
        // Test Connection always behaves like a fresh first connect — no
        // deviceToken and no nonce echo — so the gateway can validate the
        // new identity without us reusing a stale token.
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
