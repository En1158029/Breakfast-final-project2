"use server";

import prisma from "@/lib/prisma";
import { publishMessage } from "@/utils/mqtt";
import {
  getOrderCheckoutTopic,
  getKitchenOrderTopic,
  getAcceptCustomerOrderTopic,
} from "@/utils/mqttTopic";

// 顧客下單
export const addOrder = async (body) => {
  const { customerId, orderItems } = body;

  // 計算總金額
  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: { in: orderItems.map((item) => item.menuItemId) },
    },
  });

  const totalAmount = orderItems.reduce((sum, item) => {
    const menuItem = menuItems.find((m) => m.id === item.menuItemId);
    return sum + (menuItem?.price || 0) * item.quantity;
  }, 0);

  const order = await prisma.order.create({
    data: {
      customerId,
      status: "PENDING",
      totalAmount,
      items: {
        create: orderItems.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          specialRequest: item.specialRequest || null,
        })),
      },
    },
    include: {
      customer: { select: { name: true } },
      items: {
        include: {
          menuItem: { select: { name: true, price: true } },
        },
      },
    },
  });

  // 發送 MQTT 給 staff
  const topic = getOrderCheckoutTopic();
  await publishMessage(topic, order);

  return order;
};

// 顧客查詢自己的訂單
export const getCustomerOrder = async (customerId) => {
  const orders = await prisma.order.findMany({
    where: { customerId },
    include: {
      items: {
        include: {
          menuItem: {
            select: {
              name: true,
              price: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return orders;
};

// 更改訂單狀態
export const editOrderStatus = async (body, orderId) => {
  const { status } = body;

  // 更新狀態
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status },
    include: {
      customer: { select: { name: true, id: true } },
      items: {
        include: {
          menuItem: {
            select: { name: true, price: true, description: true, imageUrl: true, isAvailable: true },
          },
        },
      },
    },
  });

  // ✅ 狀態是 PREPARING → 發送通知給顧客
  if (status === "PREPARING") {
    const notification = await prisma.notification.create({
      data: {
        userId: updatedOrder.customer.id,
        orderId: updatedOrder.id,
        message: `訂單 ${orderId.slice(0, 8)} 正在製作中`,
      },
    });

    const payload = {
      id: notification.id,
      title: "訂單",
      type: "order",
      content: `訂單 ${orderId.slice(0, 8)} 正在製作中`,
      read: false,
      time: new Date().toLocaleString(),
      status: "PREPARING",
      orderId: orderId,
    };

    const topic = getAcceptCustomerOrderTopic(updatedOrder.customer.id);
    await publishMessage(topic, payload);
  }

  // ✅ 傳送訂單給廚房
  if (status === "PREPARING") {
    const kitchenTopic = getKitchenOrderTopic();
    await publishMessage(kitchenTopic, updatedOrder); // 直接傳訂單資料
  }

  return {};
};

// 取得所有待處理訂單
export const getPendingOrders = async () => {
  const orders = await prisma.order.findMany({
    where: { status: "PENDING" },
    include: {
      customer: { select: { id: true, name: true } }, // ← 加入 id
      items: {
        include: {
          menuItem: { select: { name: true, price: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  return orders;
};

// 取得廚房訂單
export const getKitchenOrders = async () => {
  const orders = await prisma.order.findMany({
    where: { status: "PREPARING" },
    include: {
      items: {
        include: {
          menuItem: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  return orders;
};

// 取得完成的訂單
export const getReadyOrders = async () => {
  const orders = await prisma.order.findMany({
    where: { status: "READY" },
    include: {
      customer: { select: { name: true } },
      items: {
        include: {
          menuItem: { select: { name: true, price: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  return orders;
};

// 取得訂單詳細資訊
export const getOrderById = async (orderId) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      items: true,
    },
  });
  return order;
};
