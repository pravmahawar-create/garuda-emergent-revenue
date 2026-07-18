/** Autonomous AI Agents registry — invoke registered agents by capability. */
export interface AgentInvocation {
  capability: string;
  input: Record<string, unknown>;
}

export async function invoke(_i: AgentInvocation): Promise<{ status: 'unavailable' }> {
  return { status: 'unavailable' };
}
