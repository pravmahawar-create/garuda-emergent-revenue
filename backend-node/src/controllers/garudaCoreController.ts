import { Request, Response } from 'express';
import { getCoreStatus, listCoreRevenue, listCoreSettlements } from '../integrations/garudaCore';

export async function status(_req: Request, res: Response) {
  res.json(await getCoreStatus());
}

export async function revenue(_req: Request, res: Response) {
  res.json(await listCoreRevenue());
}

export async function settlements(_req: Request, res: Response) {
  res.json(await listCoreSettlements());
}
