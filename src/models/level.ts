import { z } from 'zod';

const nonEmptyStringSchema = z.string().min(1);
const finiteNumberSchema = z.number().finite();

export type LayerBounds = z.infer<typeof LayerBoundsSchema>;
export const LayerBoundsSchema = z.object({
  x: z.number().int(),
  y: z.number().int(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export type RecognitionTileSource = z.infer<typeof RecognitionTileSourceSchema>;
export const RecognitionTileSourceSchema = z.object({
  type: z.literal('recognition'),
  importId: nonEmptyStringSchema,
  objectId: nonEmptyStringSchema,
});

export type TileSource = z.infer<typeof TileSourceSchema>;
export const TileSourceSchema = RecognitionTileSourceSchema;

export type TileMapping = z.infer<typeof TileMappingSchema>;
export const TileMappingSchema = z.object({
  tileId: z.number().int().nonnegative(),
  sourceTileId: nonEmptyStringSchema,
});

export type TilePlacement = z.infer<typeof TilePlacementSchema>;
export const TilePlacementSchema = z.object({
  x: z.number().int(),
  y: z.number().int(),
  tileId: z.number().int().nonnegative(),
  source: TileSourceSchema.optional(),
});

export type LevelLayer = z.infer<typeof LevelLayerSchema>;
export const LevelLayerSchema = z.object({
  id: nonEmptyStringSchema,
  name: nonEmptyStringSchema,
  order: z.number().int(),
  bounds: LayerBoundsSchema.optional(),
  tiles: TilePlacementSchema.array(),
});

export type RecognitionBinaryData = z.infer<typeof RecognitionBinaryDataSchema>;
export const RecognitionBinaryDataSchema = z.object({
  encoding: z.literal('base64'),
  mimeType: nonEmptyStringSchema,
  value: nonEmptyStringSchema,
});

export type RecognitionImage = z.infer<typeof RecognitionImageSchema>;
export const RecognitionImageSchema = z.object({
  width: finiteNumberSchema.positive(),
  height: finiteNumberSchema.positive(),
  name: nonEmptyStringSchema.optional(),
});

export type RecognizedObject = z.infer<typeof RecognizedObjectSchema>;
export const RecognizedObjectSchema = z.object({
  id: nonEmptyStringSchema.optional(),
  shape: nonEmptyStringSchema,
  x: finiteNumberSchema,
  y: finiteNumberSchema,
  width: finiteNumberSchema.positive(),
  height: finiteNumberSchema.positive(),
  confidence: z.number().min(0).max(1).optional(),
  data: RecognitionBinaryDataSchema.optional(),
});

export type RecognitionPayload = z.infer<typeof RecognitionPayloadSchema>;
export const RecognitionPayloadSchema = z.object({
  id: nonEmptyStringSchema.optional(),
  name: nonEmptyStringSchema.optional(),
  image: RecognitionImageSchema,
  objects: RecognizedObjectSchema.array(),
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
    const sourceTileIds = new Set<string>();
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

      if (sourceTileIds.has(tileMapping.sourceTileId)) {
        context.addIssue({
          code: 'custom',
          message: 'tileTable sourceTileId values must be unique.',
          path: ['tileTable', tileIndex, 'sourceTileId'],
        });
      }

      sourceTileIds.add(tileMapping.sourceTileId);
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
