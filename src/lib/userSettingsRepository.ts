import type {
  UserSettings,
  UserSettingsUpdateInput,
} from "../types/userSettings";
import type {
  AppAccentColor,
  AppTheme,
} from "../types/settings";

const defaultUserSettings: UserSettings = {
  userId: "",
  theme: "modern",
  accentColor: "velunis",
  compactMode: false,
  updatedAt: "",
};

function dispatchUserSettingsUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event("userSettingsUpdated"));
}

function normalizeTheme(value: unknown): AppTheme {
  if (value === "light") {
    return "light";
  }

  if (value === "dark") {
    return "dark";
  }

  if (value === "system") {
    return "system";
  }

  return "modern";
}

function normalizeAccentColor(value: unknown): AppAccentColor {
  if (value === "velunis") {
    return "velunis";
  }

  if (value === "blue") {
    return "blue";
  }

  if (value === "green") {
    return "green";
  }

  if (value === "red") {
    return "red";
  }

  if (value === "orange") {
    return "orange";
  }

  if (value === "purple") {
    return "purple";
  }

  if (value === "indigo") {
    return "indigo";
  }

  if (value === "emerald") {
    return "emerald";
  }

  if (value === "amber") {
    return "amber";
  }

  return "zinc";
}

function mapUserSettings(value: Partial<UserSettings>): UserSettings {
  return {
    userId: String(value.userId || ""),
    theme: normalizeTheme(value.theme),
    accentColor: normalizeAccentColor(value.accentColor),
    compactMode: Boolean(value.compactMode),
    updatedAt: String(value.updatedAt || ""),
  };
}

async function parseResponse<T>(
  response: Response,
  fallbackMessage: string,
): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof data?.message === "string"
        ? data.message
        : fallbackMessage;

    throw new Error(message);
  }

  return data as T;
}

export const userSettingsRepository = {
  getDefault() {
    return {
      ...defaultUserSettings,
    };
  },

  async get() {
    const response = await fetch("/api/user-settings", {
      method: "GET",
      cache: "no-store",
    });

    const data = await parseResponse<Partial<UserSettings>>(
      response,
      "Benutzereinstellungen konnten nicht geladen werden.",
    );

    return mapUserSettings(data);
  },

  async update(input: UserSettingsUpdateInput) {
    const response = await fetch("/api/user-settings", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    const data = await parseResponse<Partial<UserSettings>>(
      response,
      "Benutzereinstellungen konnten nicht gespeichert werden.",
    );

    const updatedSettings = mapUserSettings(data);

    dispatchUserSettingsUpdated();

    return updatedSettings;
  },

  getThemeLabel(theme: AppTheme) {
    if (theme === "light") {
      return "Hell";
    }

    if (theme === "dark") {
      return "Dunkel";
    }

    if (theme === "system") {
      return "System";
    }

    return "Modern";
  },

  getAccentColorLabel(accentColor: AppAccentColor) {
    if (accentColor === "velunis") {
      return "Velunis Blau/Lila";
    }

    if (accentColor === "blue") {
      return "Blau";
    }

    if (accentColor === "green") {
      return "Grün";
    }

    if (accentColor === "red") {
      return "Rot";
    }

    if (accentColor === "orange") {
      return "Orange";
    }

    if (accentColor === "purple") {
      return "Lila";
    }

    if (accentColor === "indigo") {
      return "Indigo";
    }

    if (accentColor === "emerald") {
      return "Emerald";
    }

    if (accentColor === "amber") {
      return "Amber";
    }

    return "Neutral";
  },
};
