/**
 * Fetches a book cover URL from bookcover.longitood.com.
 * Used as a fallback when Open Library has no cover image.
 */
export async function fetchLongitoodCover(
  title: string,
  author?: string | null,
  isbn?: string | null,
): Promise<string | null> {
  try {
    let url: string;
    if (isbn) {
      url = `https://bookcover.longitood.com/bookcover/${encodeURIComponent(isbn)}`;
    } else if (author) {
      url = `https://bookcover.longitood.com/bookcover?book_title=${encodeURIComponent(title)}&author_name=${encodeURIComponent(author)}`;
    } else {
      return null;
    }

    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    if (typeof data === 'object' && data !== null && 'url' in data && typeof (data as { url: unknown }).url === 'string') {
      const url = (data as { url: string }).url;
      // Reject placeholder/no-cover responses
      if (url.includes('no-cover') || url.includes('nocover') || url.includes('no_cover')) return null;
      return url;
    }
    return null;
  } catch {
    return null;
  }
}
