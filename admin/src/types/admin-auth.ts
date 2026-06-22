export type AdminUser = {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminSession = {
  adminUser: AdminUser;
  authToken: string;
};
