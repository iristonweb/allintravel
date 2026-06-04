import type { PrivacyAudience, UserPrivacySettings } from "@shared/privacy";
import { DEFAULT_PRIVACY_SETTINGS } from "@shared/privacy";
import type { UserPrivacySettingsRow } from "@shared/schema";

export function rowToPrivacySettings(row: UserPrivacySettingsRow): UserPrivacySettings {
  return {
    userId: row.userId,
    isPrivateAccount: row.isPrivateAccount,
    showOnlineStatus: row.showOnlineStatus as PrivacyAudience,
    showLastSeen: row.showLastSeen,
    allowDmFrom: row.allowDmFrom as PrivacyAudience,
    allowFriendRequestsFrom: row.allowFriendRequestsFrom as PrivacyAudience,
    showProfileTo: row.showProfileTo as PrivacyAudience,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function defaultPrivacyRow(userId: string): UserPrivacySettings {
  return { userId, ...DEFAULT_PRIVACY_SETTINGS, createdAt: null, updatedAt: null };
}

export async function areFriends(
  checkFriendship: (a: string, b: string) => Promise<boolean>,
  userId: string,
  otherId: string,
): Promise<boolean> {
  if (userId === otherId) return true;
  return checkFriendship(userId, otherId);
}

export function audienceAllows(
  audience: PrivacyAudience,
  opts: { isSelf: boolean; isFriend: boolean },
): boolean {
  if (opts.isSelf) return true;
  if (audience === "everyone") return true;
  if (audience === "friends") return opts.isFriend;
  return false;
}

export function canViewProfile(
  settings: UserPrivacySettings,
  viewerId: string | undefined,
  targetId: string,
  isFriend: boolean,
): boolean {
  if (!viewerId) {
    if (settings.isPrivateAccount) return false;
    return audienceAllows(settings.showProfileTo, { isSelf: false, isFriend: false });
  }
  if (viewerId === targetId) return true;
  if (settings.isPrivateAccount && !isFriend) return false;
  return audienceAllows(settings.showProfileTo, { isSelf: false, isFriend });
}

export function canSendDm(
  settings: UserPrivacySettings,
  senderId: string,
  targetId: string,
  isFriend: boolean,
): boolean {
  if (senderId === targetId) return false;
  return audienceAllows(settings.allowDmFrom, { isSelf: false, isFriend });
}

export function canSendFriendRequest(
  settings: UserPrivacySettings,
  requesterId: string,
  targetId: string,
  isFriend: boolean,
): boolean {
  if (requesterId === targetId) return false;
  return audienceAllows(settings.allowFriendRequestsFrom, { isSelf: false, isFriend });
}

export function canSeeOnlineStatus(
  settings: UserPrivacySettings,
  viewerId: string | undefined,
  targetId: string,
  isFriend: boolean,
): boolean {
  if (!viewerId) return false;
  if (viewerId === targetId) return true;
  if (!settings.showLastSeen) return false;
  return audienceAllows(settings.showOnlineStatus, { isSelf: false, isFriend });
}
