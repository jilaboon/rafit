import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Extended Prisma client with tenant context
export async function withTenant<T>(tenantId: string, callback: () => Promise<T>): Promise<T> {
  await prisma.$executeRaw`SELECT set_tenant_context(${tenantId}::uuid)`;
  try {
    return await callback();
  } finally {
    await prisma.$executeRaw`SELECT clear_tenant_context()`;
  }
}

export default prisma;
