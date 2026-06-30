import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export async function syncUserProfile(user: { id: string; email: string; fullName: string }) {
  try {
    return await prisma.user.upsert({
      where: { id: user.id },
      update: { email: user.email, fullName: user.fullName },
      create: { id: user.id, email: user.email, fullName: user.fullName }
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      Array.isArray(error.meta?.target) &&
      error.meta.target.includes("email")
    ) {
      return prisma.user.update({
        where: { email: user.email },
        data: { fullName: user.fullName }
      });
    }

    throw error;
  }
}

export async function resolveUserProfile(user: { id: string; email: string; fullName: string }) {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ id: user.id }, { email: user.email }]
    }
  });

  if (existingUser) {
    if (existingUser.fullName !== user.fullName) {
      return prisma.user.update({
        where: { id: existingUser.id },
        data: { fullName: user.fullName }
      });
    }

    return existingUser;
  }

  return syncUserProfile(user);
}
