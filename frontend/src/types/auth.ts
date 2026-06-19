export type UserProfile = {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuthSession = {
  user: UserProfile;
  authToken: string;
};
