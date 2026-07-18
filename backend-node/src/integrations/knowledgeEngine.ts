/** Knowledge Engine adapter — long-term memory + retrieval. */
export interface KnowledgeQuery {
  query: string;
  scope?: 'user' | 'org' | 'global';
  limit?: number;
}

export async function query(_q: KnowledgeQuery): Promise<Array<Record<string, unknown>>> {
  return [];
}

export async function remember(_doc: Record<string, unknown>): Promise<void> {
  // no-op stub
}
