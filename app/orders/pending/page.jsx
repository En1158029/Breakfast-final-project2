"use client";

import { useEffect, useState } from "react";
import { useMqttClient } from "@/hooks/useMqttClient";
import {
  editOrderStatus,
  getPendingOrders,
} from "@/app/actions/order";
import { addNotification } from "@/app/actions/notification";
import {
  getOrderCheckoutTopic,
  getCustomerCancelOrderTopic,
  getAcceptCustomerOrderTopic,
  getKitchenOrderTopic,
} from "@/utils/mqttTopic";

export default function PendingOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [topics, setTopics] = useState([]);

  const { messages, publishMessage } = useMqttClient({
    subscribeTopics: topics ?? [],
  });

  useEffect(() => {
    setTopics([
      getOrderCheckoutTopic(),
      getCustomerCancelOrderTopic("#"),
    ]);

    const fetchOrders = async () => {
      try {
        let data = await getPendingOrders();

        if (!data) {
          const res = await fetch("/api/orders/pending");
          if (!res.ok) {
            alert("獲取待處理訂單失敗");
            return;
          }
          data = await res.json();
        }

        setOrders(data);
      } catch (err) {
        console.error("訂單取得錯誤:", err);
        alert("獲取待處理訂單失敗");
      }
    };

    fetchOrders();
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;

    const last = messages[messages.length - 1];
    const isCheckout = last.topic.includes("checkout");
    const isCancel = last.topic.includes("cancel");

    try {
      const payload = JSON.parse(last.payload);
      if (isCheckout) {
        setOrders((prev) => {
          const exists = prev.some((o) => o.id === payload.id);
          return exists ? prev : [payload, ...prev];
        });
      }
      if (isCancel) {
        setOrders((prev) => prev.filter((o) => o.id !== payload.orderId));
      }
    } catch (err) {
      console.error("MQTT 訊息解析失敗:", err);
    }
  }, [messages]);

  const handleAcceptOrder = async (orderId) => {
    try {
      const targetOrder = orders.find((o) => o.id === orderId);
      const customerId = targetOrder?.customer?.id;

      let result = await editOrderStatus({ status: "PREPARING" }, orderId);

      if (!result) {
        const res = await fetch(`/api/orders/${orderId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "PREPARING" }),
        });

        if (!res.ok) {
          alert("修改訂單狀態失敗");
          return;
        }

        result = await res.json();
      }

      setOrders((prev) => prev.filter((o) => o.id !== orderId));

      let notificationRes = await addNotification(
        {
          orderId,
          message: `訂單 ${orderId.slice(0, 8)} 正在製作中`,
        },
        customerId
      );

      if (!notificationRes) {
        const res = await fetch(`/api/notifications/users/${customerId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            message: `訂單 ${orderId.slice(0, 8)} 正在製作中`,
          }),
        });

        if (!res.ok) {
          alert("傳送通知失敗");
          return;
        }

        notificationRes = await res.json();
      }

      await publishMessage(getAcceptCustomerOrderTopic(customerId), {
        id: notificationRes.id,
        title: "訂單",
        type: "order",
        content: `訂單 ${orderId.slice(0, 8)} 正在製作中`,
        read: false,
        time: new Date().toLocaleString(),
        status: "PREPARING",
        orderId,
      });

      await publishMessage(getKitchenOrderTopic(), targetOrder);
    } catch (err) {
      console.error("處理訂單錯誤:", err);
      alert("處理訂單時發生錯誤");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-red-100 px-4 sm:px-6 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center sm:text-left text-gray-800">
          待處理訂單
        </h1>

        {orders.length === 0 ? (
          <p className="text-gray-500 text-center sm:text-left">
            目前沒有待處理訂單。
          </p>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      訂單 #{order.id.slice(0, 8)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mb-3 space-y-1">
                  <p className="text-gray-700">
                    <strong>總金額：</strong> ${order.totalAmount.toFixed(2)}
                  </p>
                  <p className="text-gray-700">
                    <strong>顧客：</strong> {order.customer.name}
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold mb-2 text-gray-700">
                    餐點內容：
                  </h4>
                  <ul className="space-y-2">
                    {order.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex justify-between text-sm text-gray-600"
                      >
                        <span>
                          {item.menuItem.name} × {item.quantity}
                          {item.specialRequest && (
                            <span className="block text-xs text-gray-400">
                              備註：{item.specialRequest}
                            </span>
                          )}
                        </span>
                        <span>
                          $
                          {(item.menuItem.price * item.quantity).toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 flex justify-end">
                  {order.status === "PENDING" && (
                    <button
                      onClick={() => handleAcceptOrder(order.id)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                    >
                      接受訂單
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
