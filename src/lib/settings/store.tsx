"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  mergeSettings,
} from "./defaults";
import type { AppSettings } from "./types";

interface SettingsContextValue {
  settings: AppSettings;
  updateConnection: (patch: Partial<AppSettings["connection"]>) => void;
  updateBehavior: (patch: Partial<AppSettings["behavior"]>) => void;
  updateUi: (patch: Partial<AppSettings["ui"]>) => void;
  resetSettings: () => void;
  /** True once localStorage has been read on the client. */
  hydrated: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

/** Legacy key that held just the device token before v4. */
const LEGACY_DEVICE_TOKEN_KEY = "mc-device-token";

function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<AppSettings>) : {};
    const merged = mergeSettings(DEFAULT_SETTINGS, parsed);

    // One-time migration: if there's no token in the settings store but
    // the legacy key is populated, pull it in and clear the legacy entry.
    if (!merged.connection.deviceToken) {
      try {
        const legacy = window.localStorage.getItem(LEGACY_DEVICE_TOKEN_KEY);
        if (legacy) {
          merged.connection = { ...merged.connection, deviceToken: legacy };
          window.localStorage.removeItem(LEGACY_DEVICE_TOKEN_KEY);
        }
      } catch {
        // migration is best-effort; ignore
      }
    }

    return merged;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount. We deliberately start with defaults
  // on the server render so SSR output is stable, then swap to the saved
  // values once we have access to window.
  useEffect(() => {
    setSettings(loadSettings());
    setHydrated(true);
  }, []);

  // Persist on change once hydrated.
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(settings),
      );
    } catch {
      // Quota exceeded or private mode — ignore silently.
    }
  }, [settings, hydrated]);

  // Keep multiple tabs in sync.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (e: StorageEvent) => {
      if (e.key !== SETTINGS_STORAGE_KEY || !e.newValue) return;
      try {
        const parsed = JSON.parse(e.newValue) as Partial<AppSettings>;
        setSettings(mergeSettings(DEFAULT_SETTINGS, parsed));
      } catch {
        // Ignore malformed cross-tab payloads.
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // Apply the theme to the document root. The server render hardcodes the
  // `dark` class so the first paint is dark; this effect keeps it in sync
  // with user selection after hydration.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (settings.ui.theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [settings.ui.theme]);

  const updateConnection = useCallback(
    (patch: Partial<AppSettings["connection"]>) => {
      setSettings((prev) => ({
        ...prev,
        connection: { ...prev.connection, ...patch },
      }));
    },
    [],
  );

  const updateBehavior = useCallback(
    (patch: Partial<AppSettings["behavior"]>) => {
      setSettings((prev) => ({
        ...prev,
        behavior: { ...prev.behavior, ...patch },
      }));
    },
    [],
  );

  const updateUi = useCallback((patch: Partial<AppSettings["ui"]>) => {
    setSettings((prev) => ({
      ...prev,
      ui: { ...prev.ui, ...patch },
    }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      updateConnection,
      updateBehavior,
      updateUi,
      resetSettings,
      hydrated,
    }),
    [
      settings,
      updateConnection,
      updateBehavior,
      updateUi,
      resetSettings,
      hydrated,
    ],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return ctx;
}
