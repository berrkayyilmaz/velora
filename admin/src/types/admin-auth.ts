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

export type AdminLoginInput = {
  email: string;
  password: string;
};

export type AdminSessionResponse = {
  data: AdminSession;
};

export type AdminMeResponse = {
  data: {
    adminUser: AdminUser;
  };
};
