import { z } from "zod";

/** Who can see a privacy-gated field */
export const privacyAudienceSchema = z.enum(["everyone", "friends", "nobody"]);
export type PrivacyAudience = z.infer<typeof privacyAudienceSchema>;

export const DEFAULT_PRIVACY_SETTINGS = {
  isPrivateAccount: false,
  showOnlineStatus: "friends" as PrivacyAudience,
  showLastSeen: true,
  allowDmFrom: "friends" as PrivacyAudience,
  allowFriendRequestsFrom: "everyone" as PrivacyAudience,
  showProfileTo: "everyone" as PrivacyAudience,
};

export const updatePrivacySettingsSchema = z
  .object({
    isPrivateAccount: z.boolean().optional(),
    showOnlineStatus: privacyAudienceSchema.optional(),
    showLastSeen: z.boolean().optional(),
    allowDmFrom: privacyAudienceSchema.optional(),
    allowFriendRequestsFrom: privacyAudienceSchema.optional(),
    showProfileTo: privacyAudienceSchema.optional(),
  })
  .strict();

export type UserPrivacySettings = {
  userId: string;
  isPrivateAccount: boolean;
  showOnlineStatus: PrivacyAudience;
  showLastSeen: boolean;
  allowDmFrom: PrivacyAudience;
  allowFriendRequestsFrom: PrivacyAudience;
  showProfileTo: PrivacyAudience;
  createdAt: Date | null;
  updatedAt: Date | null;
};
