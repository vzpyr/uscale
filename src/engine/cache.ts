const CACHE_NAME = 'uscale-models-v1';

export async function fetchModelBuffer(
  repo: string,
  fileName: string,
  onProgress?: (received: number, total: number) => void
): Promise<ArrayBuffer> {
  const url = `https://huggingface.co/${repo}/resolve/main/${fileName}`;

  if (typeof caches !== 'undefined') {
    try {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(url);
      if (cachedResponse) {
        return await cachedResponse.arrayBuffer();
      }
    } catch {}
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`failed to download model: ${response.statusText}`);
  }

  const contentLengthHeader = response.headers.get('content-length');
  const total = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;

  if (!response.body || !total || !onProgress) {
    const buffer = await response.arrayBuffer();
    if (typeof caches !== 'undefined') {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(url, new Response(buffer.slice(0)));
      } catch {}
    }
    return buffer;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      received += value.length;
      onProgress(received, total);
    }
  }

  const complete = new Uint8Array(received);
  let position = 0;
  for (const chunk of chunks) {
    complete.set(chunk, position);
    position += chunk.length;
  }

  if (typeof caches !== 'undefined') {
    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(url, new Response(complete.slice(0)));
    } catch {}
  }

  return complete.buffer;
}
