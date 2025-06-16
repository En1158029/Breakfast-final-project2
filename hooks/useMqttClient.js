/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState, useRef } from "react";
import mqtt from "mqtt";

export function useMqttClient({
    brokerUrl = "wss://broker.emqx.io:8084/mqtt",
    subscribeTopics = [],
    publishTopic = "",
    mqttOptions = {},
}) {
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState([]);
    const clientRef = useRef(null);

    useEffect(() => {
        const clientId = `nextjs-client-${Math.random().toString(16).slice(2, 10)}`;
        const client = mqtt.connect(brokerUrl, {
            clientId,
            clean: true,
            connectTimeout: 4000,
            reconnectPeriod: 1000,
            ...mqttOptions,
        });

        clientRef.current = client;

        client.on("connect", () => {
            console.log(`✅ 已連接 MQTT Broker: ${brokerUrl}`);
            setIsConnected(true);

            subscribeTopics.forEach((topic) => {
                client.subscribe(topic, (err) => {
                    if (err) {
                        console.error(`❌ 訂閱主題 ${topic} 失敗:`, err);
                    } else {
                        console.log(`📡 已訂閱主題: ${topic}`);
                    }
                });
            });
        });

        client.on("message", (topic, payload) => {
            const message = {
                topic,
                payload: payload.toString(),
                timestamp: new Date().toISOString(),
            };
            setMessages((prevMessages) => [...prevMessages, message]);
        });

        client.on("error", (err) => {
            console.error("❌ MQTT 錯誤:", err);
        });

        client.on("close", () => {
            console.warn("⚠️ MQTT 連線關閉");
            setIsConnected(false);
        });

        return () => {
            if (client.connected) {
                subscribeTopics.forEach((topic) => client.unsubscribe(topic));
            }
            client.end(true, () => {
                console.log("🔌 MQTT 客戶端已斷線");
            });
        };
    }, [brokerUrl, subscribeTopics.join(",")]);

    const publishMessage = (topic, msg) => {
        const client = clientRef.current;
        if (!client || !client.connected) {
            console.warn("⚠️ 無法發佈訊息：MQTT 尚未連線");
            return;
        }

        if (!topic) topic = publishTopic;
        const payload = typeof msg === "string" ? msg : JSON.stringify(msg);

        if (!payload.trim()) return;

        client.publish(topic, payload, { qos: 0 }, (err) => {
            if (err) {
                console.error(`❌ 發佈到 ${topic} 失敗:`, err);
            } else {
                console.log(`📤 發佈到 ${topic}: ${payload}`);
            }
        });
    };

    return { isConnected, messages, publishMessage };
}
