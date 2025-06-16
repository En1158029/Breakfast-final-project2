import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ✅ 檢查 .env.local 是否有正確設定這兩個值
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ✅ App Router 風格 API route
export async function POST(req) {
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}_${file.name}`;

    const { data, error } = await supabase.storage
      .from("uploads") // 👈 bucket 名稱必須存在！
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) throw error;

    const { data: publicData } = supabase.storage
      .from("uploads")
      .getPublicUrl(fileName);

    return NextResponse.json({ success: true, url: publicData.publicUrl });
  } catch (error) {
    console.error("[圖片上傳失敗]", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
