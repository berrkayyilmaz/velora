import "fastify";

export type AuthenticatedUser = {
  id: string;
  email: string;
};

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}
