import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ✅ 修改：params 改為 await
export async function PUT(request, context) {
    try {
        const { id } = await context.params; // ✅ 正確 await 取出 id
        const body = await request.json();

        if (!body.name || typeof body.name !== "string") {
            return NextResponse.json({ message: "name 是必填欄位" }, { status: 400 });
        }

        if (typeof body.price !== "number" || isNaN(body.price)) {
            return NextResponse.json({ message: "price 必須是數字" }, { status: 400 });
        }

        const existingItem = await prisma.menuItem.findUnique({
            where: { id },
        });

        if (!existingItem) {
            return NextResponse.json({ message: "找不到菜單項目" }, { status: 404 });
        }

        const updatedMenu = await prisma.menuItem.update({
            where: { id },
            data: {
                name: body.name,
                description: body.description || null,
                price: body.price,
                imageUrl: body.imageUrl || null,
                isAvailable:
                    typeof body.isAvailable === "boolean" ? body.isAvailable : true,
            },
        });

        return NextResponse.json(updatedMenu);
    } catch (error) {
        console.error("後端錯誤:", error);
        return NextResponse.json(
            { message: "伺服器錯誤", error: String(error) },
            { status: 500 }
        );
    }
}

// ✅ 修改：params 改為 await
export async function DELETE(request, context) {
    try {
        const { id } = await context.params; // ✅ 正確 await 取出 id

        const existingItem = await prisma.menuItem.findUnique({
            where: { id },
        });

        if (!existingItem) {
            return NextResponse.json({ message: "找不到菜單項目" }, { status: 404 });
        }

        await prisma.menuItem.delete({
            where: { id },
        });

        return NextResponse.json({ success: true, message: "菜單已刪除" });
    } catch (error) {
        console.error("刪除錯誤:", error);
        return NextResponse.json(
            { success: false, message: "伺服器錯誤", error: String(error) },
            { status: 500 }
        );
    }
}
