import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request) {
    try {
        const body = await request.json();

        const { name, email, password } = body;

        // 驗證欄位
        if (!name || typeof name !== "string") {
            return NextResponse.json(
                { message: "name 是必填欄位" },
                { status: 400 }
            );
        }

        if (!email || typeof email !== "string") {
            return NextResponse.json(
                { message: "email 是必填欄位" },
                { status: 400 }
            );
        }

        if (!password || typeof password !== "string" || password.length < 6) {
            return NextResponse.json(
                { message: "密碼必須至少 6 字元" },
                { status: 400 }
            );
        }

        // 檢查 email 是否已存在
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { message: "此信箱已經被註冊" },
                { status: 409 }
            );
        }

        // 建立使用者
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password,
                role: "CUSTOMER",
            },
        });

        return NextResponse.json(
            { message: "註冊成功", userId: newUser.id },
            { status: 201 }
        );
    } catch (error) {
        console.error("註冊失敗:", error);
        return NextResponse.json(
            { message: "伺服器錯誤", error: String(error) },
            { status: 500 }
        );
    }
}
