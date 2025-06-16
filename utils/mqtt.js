import mqtt from "mqtt";

let client = null;

// 建立 MQTT 連線
export function connectMqtt() {
  if (!client) {
    const mqttUrl = process.env.NEXT_PUBLIC_MQTT_BROKER_URL; // 例如: "ws://broker.hivemq.com:8000/mqtt"
    if (!mqttUrl) throw new Error("未設定 NEXT_PUBLIC_MQTT_BROKER_URL");

    client = mqtt.connect(mqttUrl);
  }
  return client;
}

// 發布訊息
export async function publishMessage(topic, message) {
  if (!client) connectMqtt();

  return new Promise((resolve, reject) => {
    client.publish(topic, JSON.stringify(message), {}, (err) => {
      if (err) reject(err);
      else resolve(true);
    });
  });
}
