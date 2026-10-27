export interface AuthenticatorAccount {
  id: string;
  issuer: string;
  account: string;
  secret: string; // Base32
  digits?: number; // default 6
  period?: number; // default 30
  color?: string; // Brand accent color
  icon?: string; // Brand icon key or initial
  createdAt: number;
  pinned?: boolean;
}

export type ThemeMode = "system" | "dark" | "light";
export type ViewMode = "mobile" | "desktop";
