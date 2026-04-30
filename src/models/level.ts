import { z } from 'zod';

const nonEmptyStringSchema = z.string().min(1);

export type TileMapping = z.infer<typeof TileMappingSchema>;
export const TileMappingSchema = z.object({
  tileId: z.number().int().nonnegative(),
  sourceTileId: nonEmptyStringSchema,
});

export type TilePlacement = z.infer<typeof TilePlacementSchema>;
export const TilePlacementSchema = z.object({
  x: z.number(),
  y: z.number(),
  tileId: z.number().int().nonnegative(),
});

export type LevelLayer = z.infer<typeof LevelLayerSchema>;
export const LevelLayerSchema = z.object({
  id: nonEmptyStringSchema,
  name: nonEmptyStringSchema,
  order: z.number().int(),
  tiles: TilePlacementSchema.array(),
});

export type LevelData = z.infer<typeof LevelDataSchema>;
export const LevelDataSchema = z
  .object({
    id: nonEmptyStringSchema,
    name: nonEmptyStringSchema,
    tileTable: TileMappingSchema.array(),
    layers: LevelLayerSchema.array(),
  })
  .superRefine((levelData, context) => {
    const tileIds = new Set<number>();
    const layerIds = new Set<string>();
    const layerOrders = new Set<number>();

    for (const [tileIndex, tileMapping] of levelData.tileTable.entries()) {
      if (tileIds.has(tileMapping.tileId)) {
        context.addIssue({
          code: 'custom',
          message: 'tileTable tileId values must be unique.',
          path: ['tileTable', tileIndex, 'tileId'],
        });
      }

      tileIds.add(tileMapping.tileId);
    }

    for (const [layerIndex, layer] of levelData.layers.entries()) {
      if (layerIds.has(layer.id)) {
        context.addIssue({
          code: 'custom',
          message: 'Layer id values must be unique.',
          path: ['layers', layerIndex, 'id'],
        });
      }

      layerIds.add(layer.id);

      if (layerOrders.has(layer.order)) {
        context.addIssue({
          code: 'custom',
          message: 'Layer order values must be unique.',
          path: ['layers', layerIndex, 'order'],
        });
      }

      layerOrders.add(layer.order);

      const coordinates = new Set<string>();

      for (const [tileIndex, tile] of layer.tiles.entries()) {
        if (!tileIds.has(tile.tileId)) {
          context.addIssue({
            code: 'custom',
            message: 'Tile placement tileId must exist in tileTable.',
            path: ['layers', layerIndex, 'tiles', tileIndex, 'tileId'],
          });
        }

        const coordinateKey = `${tile.x},${tile.y}`;

        if (coordinates.has(coordinateKey)) {
          context.addIssue({
            code: 'custom',
            message: 'Tile coordinates must be unique within a layer.',
            path: ['layers', layerIndex, 'tiles', tileIndex],
          });
        }

        coordinates.add(coordinateKey);
      }
    }
  });

/// types only

export type Cell = {
  x: number;
  y: number;
};
