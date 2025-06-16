"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { signIn, useSession } from "next-auth/react";

export default function LoginPage() {
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { data: session } = useSession();

    useEffect(() => {
        if (session?.user?.id) {
            sessionStorage.setItem("user", JSON.stringify(session.user));
            window.location.href = "/";
        }
    }, [session]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        const { email, password } = formData;
        if (!email || !password) {
            setError("所有欄位皆為必填");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "登入失敗");

            sessionStorage.setItem("user", JSON.stringify(data.user));
            window.location.href = "/";
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-200 via-pink-300 to-pink-400 px-4">
            <div className="w-full max-w-md bg-white/70 backdrop-blur-md p-8 rounded-xl shadow-2xl border border-white/30">
                <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-6">登入帳號</h2>

                {error && (
                    <div className="mb-4 bg-red-100 text-red-600 p-2 rounded-md text-sm text-center shadow">
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <InputField label="電子信箱" name="email" type="email" value={formData.email} onChange={handleChange} />
                    <InputField label="密碼" name="password" type="password" value={formData.password} onChange={handleChange} />

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-pink-400 to-red-400 text-white py-2 rounded-md font-semibold hover:opacity-90 transition"
                    >
                        {isSubmitting ? "登入中..." : "登入"}
                    </button>
                </form>

                <div className="mt-6 space-y-2">
                    <button
                        type="button"
                        onClick={() => signIn("google")}
                        className="w-full bg-white text-gray-800 border border-gray-300 py-2 px-4 rounded-md flex items-center justify-center gap-2 shadow hover:bg-gray-50 transition"
                    >
                        <Image src="/google.png" alt="Google" width={20} height={20} />
                        使用 Google 登入
                    </button>

                    <button
                        type="button"
                        onClick={() => signIn("github")}
                        className="w-full bg-white text-gray-800 border border-gray-300 py-2 px-4 rounded-md flex items-center justify-center gap-2 shadow hover:bg-gray-50 transition"
                    >
                        <Image src="/github.png" alt="GitHub" width={20} height={20} />
                        使用 GitHub 登入
                    </button>
                </div>

                <div className="text-sm text-center mt-6 text-gray-700">
                    還沒有帳號？{" "}
                    <Link href="/register" className="text-pink-700 font-semibold hover:underline">
                        立即註冊
                    </Link>
                </div>
            </div>
        </div>
    );
}

function InputField({ label, name, type, value, onChange }) {
    return (
        <div>
            <label htmlFor={name} className="block text-sm font-semibold text-gray-700 mb-1">
                {label}
            </label>
            <input
                type={type}
                name={name}
                id={name}
                value={value}
                onChange={onChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white/90 text-gray-800 shadow-sm focus:ring-2 focus:ring-pink-400 focus:outline-none"
                required
            />
        </div>
    );
}
