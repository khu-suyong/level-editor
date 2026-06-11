export type PlacedTileRenderStyle = {
  borderAlpha: number;
  borderColor: number;
  fillAlpha: number;
  iconAlpha: number;
};

export const PLACED_TILE_BORDER_ALPHA = 0.55;
export const PLACED_TILE_BORDER_COLOR = 0x475569;
export const PLACED_TILE_FILL_ALPHA = 1;
export const PLACED_TILE_ICON_ALPHA = 1;

export const getPlacedTileRenderStyle = (
  _isActiveLayer: boolean,
): PlacedTileRenderStyle => ({
  borderAlpha: PLACED_TILE_BORDER_ALPHA,
  borderColor: PLACED_TILE_BORDER_COLOR,
  fillAlpha: PLACED_TILE_FILL_ALPHA,
  iconAlpha: PLACED_TILE_ICON_ALPHA,
});
