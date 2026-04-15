/**
 * Embeddings via OpenAI text-embedding-3-small (1536 dimensions).
 * Requires OPENAI_API_KEY env var. Returns null if unavailable.
 */

interface EmbeddableBook {
  title: string;
  authors?: string[] | null;
  categories?: string[] | null;
  description?: string | null;
}

/** Build the text we embed for a book — captures its semantic identity. */
export function bookEmbeddingText(book: EmbeddableBook): string {
  const parts: string[] = [book.title];
  if (book.authors?.length) parts.push(`by ${book.authors.join(', ')}`);
  if (book.categories?.length) parts.push(book.categories.join(', '));
  if (book.description) {
    const clean = book.description.replace(/<[^>]+>/g, '').trim();
    if (clean) parts.push(clean.slice(0, 600));
  }
  return parts.join('. ');
}

/** Generate an embedding vector. Returns null on any failure. */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.data?.[0]?.embedding as number[]) ?? null;
  } catch {
    return null;
  }
}
