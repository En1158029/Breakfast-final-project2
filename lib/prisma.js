// lib/prisma.js
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

let prisma;

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = new PrismaClient();
}

prisma = globalForPrisma.prisma;

export default prisma;
