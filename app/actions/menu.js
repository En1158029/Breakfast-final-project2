export const uploadMenuImage = async (file) => {
    try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/image/upload", {
            method: "POST",
            body: formData,
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || "圖片上傳失敗");
        }

        return {
            success: true,
            url: data.url,
        };
    } catch (error) {
        console.error("[uploadMenuImage] 上傳失敗：", error.message);
        return {
            success: false,
            url: "",
        };
    }
};

export const addMenuItem = async (body) => {
    try {
        const response = await fetch("/api/menu", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "新增菜單失敗");
        }

        return {
            success: true,
            data,
        };
    } catch (error) {
        console.error("[addMenuItem] 發生錯誤：", error.message);
        return {
            success: false,
            data: null,
        };
    }
};

export const getMenuItems = async () => {
    try {
        const response = await fetch("/api/menu", {
            method: "GET",
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "取得菜單失敗");
        }

        return {
            success: true,
            data,
        };
    } catch (error) {
        console.error("[getMenuItems] 取得失敗：", error.message);
        return {
            success: false,
            data: [],
        };
    }
};

export const editMenuItem = async (body, menuId) => {
    try {
        const response = await fetch(`/api/menu/${menuId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "更新菜單失敗");
        }

        return {
            success: true,
            data,
        };
    } catch (error) {
        console.error("[editMenuItem] 更新錯誤：", error.message);
        return {
            success: false,
            data: null,
        };
    }
};

export const deleteMenuItem = async (menuId) => {
    try {
        const response = await fetch(`/api/menu/${menuId}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "刪除失敗");
        }

        return { success: true };
    } catch (error) {
        console.error("[deleteMenuItem] 錯誤：", error.message);
        return { success: false };
    }
};
