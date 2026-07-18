import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL as string;
export const API_BASE = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export function formatApiError(err: any): string {
  const data = err?.response?.data;
  if (!data) return err?.message || "Request failed. Please try again.";
  if (typeof data === "string") return data;
  if (typeof data.error === "string") return data.error;
  if (Array.isArray(data.details)) {
    return data.details.map((d: any) => `${d.path}: ${d.msg}`).join(" • ");
  }
  return "Request failed. Please try again.";
}
