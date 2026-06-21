const getBackendUrl = () => {
    const envUrl = import.meta.env.VITE_BACKEND_URL;
    if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
        return envUrl;
    }
    if (typeof window !== "undefined") {
        return window.location.origin + "/api";
    }
    return "http://localhost:5000";
};

const backendUrl = getBackendUrl();

export const API_BASE_URL = backendUrl.replace(/\/$/, "");
