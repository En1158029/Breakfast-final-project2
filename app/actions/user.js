"use server";

import prisma from "@/lib/prisma";

// 取得所有使用者
export const getAllUsers = async () => {
  return await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

// 更新使用者角色
export const updateUserRole = async (userId, newRole) => {
  if (!["CUSTOMER", "STAFF", "CHEF"].includes(newRole)) {
    return null;
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });
    return { success: true };
  } catch (error) {
    console.error("更新角色失敗:", error);
    return null;
  }
};
