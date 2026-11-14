export async function createFileBitmap(file: File): Promise<{
  bitmap: ImageBitmap;
  url: string;
  width: number;
  height: number;
}> {
  const url = URL.createObjectURL(file);
  const bitmap = await createImageBitmap(file);
  return {
    bitmap,
    url,
    width: bitmap.width,
    height: bitmap.height,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0b';
  const k = 1024;
  const sizes = ['b', 'kb', 'mb', 'gb'];
  const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
  const value = bytes / Math.pow(k, i);
  return `${value >= 10 ? Math.round(value) : parseFloat(value.toFixed(1))}${sizes[i]}`;
}
