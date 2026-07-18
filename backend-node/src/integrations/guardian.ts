/** Guardian adapter — safety / policy / risk scoring. */
export interface RiskAssessment {
  score: number;
  flags: string[];
}

export async function assess(_payload: Record<string, unknown>): Promise<RiskAssessment> {
  return { score: 0, flags: [] };
}
