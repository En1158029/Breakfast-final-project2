"use server";

import prisma from "@/lib/prisma";

// 新增通知
export const addNotification = async (body, userId) => {
  const { orderId, message } = body;

  const notificationRes = await prisma.notification.create({
    data: {
      userId,
      orderId,
      message,
      isRead: false,
    },
  });

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: { select: { name: true } },
      items: {
        include: {
          menuItem: { select: { id: true, name: true } },
        },
      },
    },
  });

  return {
    id: notificationRes.id,
    userId,
    orderId,
    message,
    isRead: false,
    createdAt: notificationRes.createdAt,
    items: order.items.map((item) => ({
      menuItem: item.menuItem,
      quantity: item.quantity,
      specialRequest: item.specialRequest,
    })),
    customer: order.customer,
  };
};

// 取得使用者通知
export const getUserNotification = async (userId) => {
  const result = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return result;
};

// 刪除通知
export const deleteNotification = async (notificationId) => {
  await prisma.notification.delete({
    where: { id: notificationId },
  });
  return {};
};

// action 標記為已讀
export const markAllNotificationsRead = async (userId) => {
  await prisma.notification.updateMany({
    where: { userId },
    data: { isRead: true },
  });
  return {};
};