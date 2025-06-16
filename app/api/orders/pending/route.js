import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");
        if (!userId) {
            return new NextResponse(
                JSON.stringify({ error: "Missing userId query parameter" }),
                { status: 400 }
            );
        }

        // 查 userId 的角色是否是 STAFF
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });

        if (!user) {
            return new NextResponse(
                JSON.stringify({ error: "User not found" }),
                { status: 404 }
            );
        }

        if (user.role !== "STAFF") {
            return new NextResponse(
                JSON.stringify({
                    error: "Access denied: Only staff can access this API",
                }),
                { status: 403 }
            );
        }

        // 只有當角色是 STAFF 才撈所有 PENDING 訂單
        const orders = await prisma.order.findMany({
            where: { status: "PENDING" },
            orderBy: { createdAt: "desc" },
            include: {
                customer: {
                    select: { name: true },
                },
                items: {
                    include: {
                        menuItem: {
                            select: { name: true, price: true },
                        },
                    },
                },
            },
        });

        const formattedOrders = orders.map((order) => ({
            id: order.id,
            status: order.status,
            paymentStatus: order.paymentStatus,
            totalAmount: order.totalAmount,
            createdAt: order.createdAt,
            customer: {
                id: order.customer.id, // ← 加入 id
                name: order.customer.name,
            },
            items: order.items.map((item) => ({
                id: item.id,
                quantity: item.quantity,
                specialRequest: item.specialRequest,
                menuItem: {
                name: item.menuItem.name,
                price: item.menuItem.price,
                },
            })),
        }));

        return new NextResponse(JSON.stringify(formattedOrders), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Failed to get pending orders:", error);
        return new NextResponse(
            JSON.stringify({ error: "Failed to fetch pending orders" }),
            { status: 500 }
        );
    }
}
