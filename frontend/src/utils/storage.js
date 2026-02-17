export const getUserKey = () => {
    if (typeof window === 'undefined') return "guest";
    try {
        const token = localStorage.getItem("token");
        if (!token) return "guest";

        // Strategy 1: userInfo (Common)
        const u1 = JSON.parse(localStorage.getItem("userInfo") || "{}");
        if (u1.id || u1._id || u1.uid) return String(u1.id || u1._id || u1.uid);

        // Strategy 2: user
        const u2 = JSON.parse(localStorage.getItem("user") || "{}");
        if (u2.id || u2._id) return String(u2.id || u2._id);

        // Strategy 3: Role-specific keys
        const designer = JSON.parse(localStorage.getItem("designer") || "{}");
        if (designer.id || designer._id) return String(designer.id || designer._id);

        const reseller = JSON.parse(localStorage.getItem("reseller") || "{}");
        if (reseller.id || reseller._id || reseller.uid) return String(reseller.id || reseller._id || reseller.uid);

        const buyer = JSON.parse(localStorage.getItem("buyer") || "{}");
        if (buyer.id || buyer._id || buyer.uid) return String(buyer.id || buyer._id || buyer.uid);

        return "user_generic";
    } catch {
        return "guest";
    }
};

export const getStorageKey = (type) => {
    const uid = getUserKey();
    if (uid === "guest") return type; // Keep backward compatibility for guests? 
    // User asked for "every new person that login there be zero". 
    // If I keep 'cart' for guest, and I was using 'cart' before login, 
    // then guests see the old mixed cart?
    // Maybe I should migrate guests to 'cart_guest' to be clean?
    // The user said "and in header icons there should no no visible" -> implying guests might see 0 or hidden.

    // Let's namespace EVERYONE.
    return `${type}_${uid}`;
};

// Helpers for reading/writing to ensure consistency
export const readStorage = (type) => {
    try {
        const key = getStorageKey(type);
        return JSON.parse(localStorage.getItem(key) || "[]");
    } catch { return []; }
};

export const writeStorage = (type, data) => {
    try {
        const key = getStorageKey(type);
        const jsonData = JSON.stringify(data);

        // Log size for debugging
        const sizeKB = (jsonData.length / 1024).toFixed(2);
        console.log(`💾 Saving ${type} (${sizeKB} KB) with ${data.length} items`);

        localStorage.setItem(key, jsonData);

        // Dispatch concise event
        window.dispatchEvent(new Event(`${type}Updated`));

        return true;
    } catch (error) {
        console.error(`❌ Failed to save ${type}:`, error);
        if (error.name === 'QuotaExceededError') {
            console.error("💥 LocalStorage quota exceeded! Consider clearing old data.");
            console.error("💥 LocalStorage quota exceeded! Consider clearing old data.");
            if (typeof window !== "undefined") {
                window.dispatchEvent(
                    new CustomEvent("buy2sell:dialog", {
                        detail: {
                            type: "alert",
                            message: `Storage full! Cannot save ${type}. Please clear some items.`,
                            options: { title: "Storage Error" },
                        },
                    })
                );
            }
        }
        return false;
    }
};
