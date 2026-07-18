/**
 * Mother Brain adapter — orchestration + cross-module reasoning.
 * Wire this up when the Mother Brain module lands. Contract is stable.
 */
export interface MotherBrainDirective {
  intent: string;
  context: Record<string, unknown>;
}

export async function sendDirective(_d: MotherBrainDirective): Promise<void> {
  // no-op stub
}
