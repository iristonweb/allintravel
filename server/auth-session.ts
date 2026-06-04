export type SessionUser = {
  claims: {
    sub: string;
    email?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    profile_image_url?: string | null;
  };
};

export function toSessionUser(user: {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
}): SessionUser {
  return {
    claims: {
      sub: user.id,
      email: user.email ?? undefined,
      first_name: user.firstName ?? undefined,
      last_name: user.lastName ?? undefined,
      profile_image_url: user.profileImageUrl ?? undefined,
    },
  };
}
