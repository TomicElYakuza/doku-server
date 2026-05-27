import type {
  AppAccentColor,
  AppTheme,
} from "./settings";

export type UserSettings = {
  userId: string;
  theme: AppTheme;
  accentColor: AppAccentColor;
  compactMode: boolean;
  updatedAt: string;
};

export type UserSettingsUpdateInput =
  Partial<
    Pick<
      UserSettings,
      | "theme"
      | "accentColor"
      | "compactMode"
    >
  >;