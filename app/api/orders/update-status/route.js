import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req) {
    try {
        const { orderId, status } = await req.json();

        if (!orderId || typeof status !== "string") {
            return NextResponse.json(
                { message: "缺少 orderId 或 status 參數" },
                { status: 400 }
            );
        }

        const validStatuses = [
            "PENDING",
            "PREPARING",
            "READY",
            "COMPLETED",
            "CANCELLED",
        ];
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { message: "無效的訂單狀態" },
                { status: 400 }
            );
        }

        const updated = await prisma.order.update({
            where: { id: orderId },
            data: { status },
        });

        return NextResponse.json(updated);
    } catch (err) {
        console.error("更新訂單狀態失敗:", err);
        return NextResponse.json({ message: "伺服器錯誤" }, { status: 500 });
    }
}
