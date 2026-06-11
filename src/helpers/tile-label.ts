export const normalizeTileLabel = (value: string) => value.trim();

export const getTileLabelKey = (value: string) =>
  normalizeTileLabel(value).toLowerCase();

export const tileLabelsEqual = (first: string, second: string) =>
  getTileLabelKey(first) === getTileLabelKey(second);

export const createDefaultTileLabel = (index: number) => `Tile ${index}`;

export const createUniqueTileLabel = (
  existingLabels: readonly string[],
  baseLabel = 'Tile',
) => {
  const existingLabelKeys = new Set(existingLabels.map(getTileLabelKey));
  let index = 0;

  while (existingLabelKeys.has(getTileLabelKey(`${baseLabel} ${index}`))) {
    index += 1;
  }

  return createDefaultTileLabel(index);
};
