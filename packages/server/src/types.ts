export interface DiscordTokenResult {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
}

export type DiscordIdentity = DiscordIdentityResult;
export interface DiscordIdentityResult {
  id: string;
  username: string;
  avatar: string;
  discriminator: string;
  public_flags: number;
  flags: number;
  banner?: string;
  banner_color?: string;
  accent_color?: string;
  locale: string;
  mfa_enabled: boolean;
  email?: string;
  verified: boolean;
}

export type DiscordGuild = Omit<DiscordGuildsResult, 'icon' | 'features'>;
export interface DiscordGuildsResult {
  id: string;
  name: string;
  icon: string;
  owner: boolean;
  permissions: string;
  features: string[];
}
