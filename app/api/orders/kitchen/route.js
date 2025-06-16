import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const preparingOrders = await prisma.order.findMany({
            where: {
                status: "PREPARING",
            },
            orderBy: {
                createdAt: "asc",
            },
            include: {
                items: {
                    include: {
                        menuItem: true,
                    },
                },
            },
        });

        return NextResponse.json(preparingOrders);
    } catch (err) {
        console.error("取得 PREPARING 訂單失敗:", err);
        return NextResponse.json({ message: "伺服器錯誤" }, { status: 500 });
    }
}
