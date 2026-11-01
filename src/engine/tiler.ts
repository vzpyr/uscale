export interface TileBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function computeAdaptiveTiles(
  imgWidth: number,
  imgHeight: number,
  tileSize = 256
): TileBounds[] {
  const targetTileSize = tileSize || 256;

  if (imgWidth <= targetTileSize && imgHeight <= targetTileSize) {
    return [{ x: 0, y: 0, width: imgWidth, height: imgHeight }];
  }

  const tiles: TileBounds[] = [];
  for (let y = 0; y < imgHeight; y += targetTileSize) {
    for (let x = 0; x < imgWidth; x += targetTileSize) {
      const tileW = Math.min(imgWidth - x, targetTileSize);
      const tileH = Math.min(imgHeight - y, targetTileSize);
      tiles.push({ x, y, width: tileW, height: tileH });
    }
  }

  return tiles;
}
