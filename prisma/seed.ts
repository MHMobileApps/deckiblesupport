import { prisma } from '../lib/prisma';
import { env } from '../lib/env';

async function main() {
  await prisma.adminUser.upsert({
    where: { email: env.ADMIN_EMAIL },
    update: { passwordHash: env.ADMIN_PASSWORD_HASH },
    create: { email: env.ADMIN_EMAIL, passwordHash: env.ADMIN_PASSWORD_HASH }
  });
}

main().finally(() => prisma.$disconnect());
