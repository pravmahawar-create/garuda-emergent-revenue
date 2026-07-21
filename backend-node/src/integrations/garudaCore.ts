import { env } from '../config/env';
import { ApiError } from '../utils/errors';

interface GarudaEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface GarudaCoreStatus {
  connected: boolean;
  service: string;
  status: string;
}

async function requestCore<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: globalThis.Response;
  try {
    response = await fetch(`${env.GARUDA_CORE_URL}${path}`, {
      ...init,
      headers: { accept: 'application/json', ...(init.headers || {}) },
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    throw new ApiError(503, 'GARUDA Core is unavailable', 'GARUDA_CORE_UNAVAILABLE');
  }

  const body = (await response.json().catch(() => null)) as GarudaEnvelope<T> | null;
  if (!response.ok || !body?.success) {
    throw new ApiError(response.status >= 400 ? response.status : 502, body?.message || 'GARUDA Core request failed', 'GARUDA_CORE_ERROR');
  }
  return body.data as T;
}

export async function getCoreStatus(): Promise<GarudaCoreStatus> {
  try {
    const response = await fetch(`${env.GARUDA_CORE_URL}/api/health`, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(3000),
    });
    const body = (await response.json()) as { service?: string; status?: string };
    return { connected: response.ok, service: body.service || 'GARUDA Core', status: body.status || 'unknown' };
  } catch {
    return { connected: false, service: 'GARUDA Core', status: 'unavailable' };
  }
}

export const listCoreRevenue = () => requestCore<unknown[]>('/api/revenue');
export const listCoreSettlements = () => requestCore<unknown[]>('/api/revenue/settlements');
export const listIncomeGoals = () => requestCore<unknown[]>('/api/income-goals');
export const previewIncomeGoal = (payload: unknown) => requestCore<unknown>('/api/income-goals/preview', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(payload),
});
export const startIncomeGoal = (payload: unknown) => requestCore<unknown>('/api/income-goals', {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-garuda-founder-approved': 'true' },
  body: JSON.stringify(payload),
});
export const listDiscoveryCandidates = (status = 'ranked') => requestCore<unknown[]>(`/api/discovery/candidates?status=${encodeURIComponent(status)}`);
export const decideDiscoveryCandidate = (id: string, status: 'approved' | 'dismissed') => requestCore<unknown>(`/api/discovery/candidates/${encodeURIComponent(id)}/decision`, {
  method: 'PATCH',
  headers: { 'content-type': 'application/json', 'x-garuda-founder-approved': 'true' },
  body: JSON.stringify({ status }),
});
