import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL as string;
export const API_BASE = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let refreshInFlight: Promise<void> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error?.config as any;
    const status = error?.response?.status;
    const url = String(original?.url || "");
    const authEndpoint = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"].some((path) => url.includes(path));
    if (status !== 401 || !original || original.__garudaRefreshRetried || authEndpoint) throw error;

    original.__garudaRefreshRetried = true;
    if (!refreshInFlight) {
      refreshInFlight = api.post("/auth/refresh").then(() => undefined).finally(() => { refreshInFlight = null; });
    }
    await refreshInFlight;
    return api.request(original);
  },
);

export function formatApiError(err: any): string {
  const data = err?.response?.data;
  if (!data) return err?.message || "Request failed. Please try again.";
  if (typeof data === "string") return data;
  if (typeof data.error === "string") return data.error;
  if (typeof data.message === "string") return data.message;
  if (Array.isArray(data.details)) {
    return data.details.map((d: any) => `${d.path}: ${d.msg}`).join(" • ");
  }
  return "Request failed. Please try again.";
}
