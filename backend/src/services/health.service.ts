import type { PrismaClient } from "@prisma/client";

type HealthStatus = "ok" | "degraded";
type DatabaseStatus = "connected" | "disconnected";

export type HealthResponse = {
  status: HealthStatus;
  timestamp: string;
  environment: string;
  database: {
    status: DatabaseStatus;
  };
};

export async function getHealthStatus(
  prisma: PrismaClient,
  environment: string
): Promise<HealthResponse> {
  const timestamp = new Date().toISOString();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return {
      status: "ok",
      timestamp,
      environment,
      database: {
        status: "connected"
      }
    };
  } catch {
    return {
      status: "degraded",
      timestamp,
      environment,
      database: {
        status: "disconnected"
      }
    };
  }
}
