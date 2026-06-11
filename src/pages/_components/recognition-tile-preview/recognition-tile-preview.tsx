import { Box } from '@suis-ui/kit';
import { createEffect, createSignal, onCleanup, Show } from 'solid-js';

import type { RecognitionPayload, TileIcon, TileMapping } from '@/models/level';
import type { RecognitionTilePreview as RecognitionTilePreviewData } from '@/stores/recognition';
import {
  assumptionStyle,
  previewCanvasStyle,
  previewFrameStyle,
  previewPlaceholderStyle,
} from './recognition-tile-preview.css';

type RecognitionTilePreviewProps = {
  preview: RecognitionTilePreviewData | null;
  pending: boolean;
  error: string | null;
};

type DrawPoint = {
  x: number;
  y: number;
};

const PREVIEW_MAX_WIDTH = 960;
const PREVIEW_MIN_WIDTH = 360;
const PREVIEW_FALLBACK_FILL = '#111827';
const PREVIEW_OBJECT_STROKE = 'rgba(148, 163, 184, 0.72)';
const PREVIEW_GRID_STROKE = 'rgba(248, 250, 252, 0.24)';
const PREVIEW_TILE_STROKE = 'rgba(248, 250, 252, 0.4)';
const PREVIEW_DEFAULT_TILE_BACKGROUND = '#2563eb';
const PREVIEW_DEFAULT_TILE_ICON = '#f8fafc';

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const getPreviewWidth = (preview: RecognitionTilePreviewData) =>
  clamp(preview.bounds.width * 48, PREVIEW_MIN_WIDTH, PREVIEW_MAX_WIDTH);

const getPreviewHeight = (preview: RecognitionTilePreviewData, width: number) =>
  Math.max(
    160,
    Math.round(width * (preview.bounds.height / preview.bounds.width)),
  );

const isHexColor = (value: string) => /^#[0-9a-fA-F]{6}$/u.test(value);

const hexToRgba = (value: string, alpha: number, fallback: string) => {
  const hexColor = isHexColor(value) ? value : fallback;
  const red = Number.parseInt(hexColor.slice(1, 3), 16);
  const green = Number.parseInt(hexColor.slice(3, 5), 16);
  const blue = Number.parseInt(hexColor.slice(5, 7), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

const loadImage = (source: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.decoding = 'async';
    image.addEventListener('load', () => resolve(image), { once: true });
    image.addEventListener(
      'error',
      () => reject(new Error('이미지를 불러올 수 없습니다.')),
      { once: true },
    );
    image.src = source;
  });

const toImagePoint = (
  point: DrawPoint,
  payload: RecognitionPayload,
  width: number,
  height: number,
) => ({
  x: (point.x / payload.image.width) * width,
  y: (point.y / payload.image.height) * height,
});

const drawSchematicObjects = (
  context: CanvasRenderingContext2D,
  preview: RecognitionTilePreviewData,
  width: number,
  height: number,
) => {
  const payload =
    preview.layer.source?.type === 'recognition'
      ? preview.layer.source.payload
      : null;

  if (!payload) {
    return;
  }

  context.save();
  context.strokeStyle = PREVIEW_OBJECT_STROKE;
  context.lineWidth = 1;
  context.setLineDash([5, 5]);

  for (const object of payload.objects) {
    const start = toImagePoint(
      { x: object.x, y: object.y },
      payload,
      width,
      height,
    );
    const end = toImagePoint(
      {
        x: object.x + object.width,
        y: object.y + object.height,
      },
      payload,
      width,
      height,
    );

    context.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
  }

  context.restore();
};

const getCellRect = (
  preview: RecognitionTilePreviewData,
  tile: { x: number; y: number },
  cellWidth: number,
  cellHeight: number,
) => {
  const offsetX = tile.x - preview.bounds.x;
  const offsetY = tile.y - preview.bounds.y;

  return {
    x: offsetX * cellWidth,
    y: (preview.bounds.height - offsetY - 1) * cellHeight,
    width: cellWidth,
    height: cellHeight,
  };
};

const drawStarIcon = (
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
) => {
  const innerRadius = radius * 0.45;

  context.beginPath();

  for (let index = 0; index < 10; index += 1) {
    const angle = -Math.PI / 2 + (index * Math.PI) / 5;
    const pointRadius = index % 2 === 0 ? radius : innerRadius;
    const x = centerX + Math.cos(angle) * pointRadius;
    const y = centerY + Math.sin(angle) * pointRadius;

    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  }

  context.closePath();
  context.stroke();
};

const drawTriangleIcon = (
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
) => {
  context.beginPath();
  context.moveTo(centerX, centerY - radius);
  context.lineTo(centerX + radius, centerY + radius);
  context.lineTo(centerX - radius, centerY + radius);
  context.closePath();
  context.stroke();
};

const drawLineIcon = (
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
) => {
  context.beginPath();
  context.moveTo(centerX - radius, centerY);
  context.lineTo(centerX + radius, centerY);
  context.stroke();
};

const drawDoorIcon = (
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
) => {
  const width = radius * 1.05;
  const height = radius * 1.55;

  context.strokeRect(centerX - width / 2, centerY - height / 2, width, height);
  context.beginPath();
  context.arc(
    centerX + width * 0.22,
    centerY,
    Math.max(radius * 0.08, 1),
    0,
    Math.PI * 2,
  );
  context.fill();
};

const drawWindowIcon = (
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
) => {
  const size = radius * 1.5;
  const left = centerX - size / 2;
  const top = centerY - size / 2;

  context.strokeRect(left, top, size, size);
  context.beginPath();
  context.moveTo(centerX, top);
  context.lineTo(centerX, top + size);
  context.moveTo(left, centerY);
  context.lineTo(left + size, centerY);
  context.stroke();
};

const drawStairsIcon = (
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
) => {
  const step = radius / 2;
  const startX = centerX - radius;
  const startY = centerY + radius;

  context.beginPath();
  context.moveTo(startX, startY);
  context.lineTo(startX + step, startY);
  context.lineTo(startX + step, startY - step);
  context.lineTo(startX + step * 2, startY - step);
  context.lineTo(startX + step * 2, startY - step * 2);
  context.lineTo(startX + step * 3, startY - step * 2);
  context.lineTo(startX + step * 3, startY - step * 3);
  context.stroke();
};

const drawTileIcon = (
  context: CanvasRenderingContext2D,
  icon: TileIcon,
  rect: { x: number; y: number; width: number; height: number },
  tile: TileMapping,
) => {
  const size = Math.min(rect.width, rect.height);

  if (size < 8) {
    return;
  }

  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;
  const radius = size * 0.23;

  context.save();
  context.strokeStyle = hexToRgba(
    tile.iconColor,
    0.92,
    PREVIEW_DEFAULT_TILE_ICON,
  );
  context.fillStyle = context.strokeStyle;
  context.lineWidth = Math.max(size * 0.045, 1);
  context.lineCap = 'round';
  context.lineJoin = 'round';

  if (icon === 'star') {
    drawStarIcon(context, centerX, centerY, radius);
  } else if (icon === 'triangle') {
    drawTriangleIcon(context, centerX, centerY, radius);
  } else if (icon === 'line') {
    drawLineIcon(context, centerX, centerY, radius);
  } else if (icon === 'door') {
    drawDoorIcon(context, centerX, centerY, radius);
  } else if (icon === 'window') {
    drawWindowIcon(context, centerX, centerY, radius);
  } else {
    drawStairsIcon(context, centerX, centerY, radius);
  }

  context.restore();
};

const drawGrid = (
  context: CanvasRenderingContext2D,
  preview: RecognitionTilePreviewData,
  width: number,
  height: number,
) => {
  const cellWidth = width / preview.bounds.width;
  const cellHeight = height / preview.bounds.height;

  context.save();
  context.strokeStyle = PREVIEW_GRID_STROKE;
  context.lineWidth = 1;
  context.beginPath();

  for (let x = 0; x <= preview.bounds.width; x += 1) {
    const canvasX = x * cellWidth;

    context.moveTo(canvasX, 0);
    context.lineTo(canvasX, height);
  }

  for (let y = 0; y <= preview.bounds.height; y += 1) {
    const canvasY = y * cellHeight;

    context.moveTo(0, canvasY);
    context.lineTo(width, canvasY);
  }

  context.stroke();
  context.restore();
};

const drawTiles = (
  context: CanvasRenderingContext2D,
  preview: RecognitionTilePreviewData,
  width: number,
  height: number,
) => {
  const cellWidth = width / preview.bounds.width;
  const cellHeight = height / preview.bounds.height;
  const tileMap = new Map(preview.tileTable.map((tile) => [tile.tileId, tile]));

  for (const placement of preview.layer.tiles) {
    const tile = tileMap.get(placement.tileId);

    if (!tile) {
      continue;
    }

    const rect = getCellRect(preview, placement, cellWidth, cellHeight);

    context.save();
    context.strokeStyle = PREVIEW_TILE_STROKE;
    context.lineWidth = 1;

    if (tile.showBackground) {
      context.fillStyle = hexToRgba(
        tile.backgroundColor,
        0.52,
        PREVIEW_DEFAULT_TILE_BACKGROUND,
      );
      context.fillRect(rect.x, rect.y, rect.width, rect.height);
    }

    context.strokeRect(rect.x, rect.y, rect.width, rect.height);
    context.restore();

    if (tile.showIcon) {
      drawTileIcon(context, tile.icon, rect, tile);
    }
  }
};

const renderPreview = async (
  canvas: HTMLCanvasElement,
  preview: RecognitionTilePreviewData,
) => {
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Canvas context를 만들 수 없습니다.');
  }

  const width = getPreviewWidth(preview);
  const height = getPreviewHeight(preview, width);
  const scale = window.devicePixelRatio || 1;
  let image: HTMLImageElement | null = null;
  let warning: string | null = null;

  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  canvas.style.aspectRatio = `${preview.bounds.width} / ${preview.bounds.height}`;
  context.setTransform(scale, 0, 0, scale, 0, 0);
  context.clearRect(0, 0, width, height);

  if (preview.imageSource) {
    try {
      image = await loadImage(preview.imageSource);
    } catch {
      warning = '이미지를 불러오지 못해 스케매틱으로 표시합니다.';
    }
  }

  if (image) {
    context.drawImage(image, 0, 0, width, height);
  } else {
    context.fillStyle = PREVIEW_FALLBACK_FILL;
    context.fillRect(0, 0, width, height);
    drawSchematicObjects(context, preview, width, height);
  }

  drawTiles(context, preview, width, height);
  drawGrid(context, preview, width, height);

  return warning;
};

export const RecognitionTilePreview = (props: RecognitionTilePreviewProps) => {
  const [canvasElement, setCanvasElement] = createSignal<HTMLCanvasElement>();
  const [renderWarning, setRenderWarning] = createSignal<string | null>(null);
  let renderId = 0;

  const statusText = () => {
    if (props.error) {
      return props.error;
    }

    if (props.pending) {
      return 'Preview 생성 중';
    }

    return 'Preview할 인식 결과가 없습니다.';
  };
  const summaryText = () => {
    const preview = props.preview;

    if (!preview) {
      return '타일 preview 없음';
    }

    return `${preview.tileCount} tiles / ${preview.bounds.width}x${preview.bounds.height}`;
  };

  createEffect(() => {
    const canvas = canvasElement();
    const preview = props.preview;

    renderId += 1;
    setRenderWarning(null);

    if (!canvas || !preview || props.pending || props.error) {
      return;
    }

    const currentRenderId = renderId;

    void renderPreview(canvas, preview)
      .then((warning) => {
        if (currentRenderId === renderId) {
          setRenderWarning(warning);
        }
      })
      .catch((error) => {
        if (currentRenderId === renderId) {
          setRenderWarning(
            error instanceof Error
              ? error.message
              : 'Preview 렌더링에 실패했습니다.',
          );
        }
      });
  });

  onCleanup(() => {
    renderId += 1;
  });

  return (
    <Box gap={'xs'}>
      <Box class={previewFrameStyle} r={'md'} overflow={'hidden'}>
        <Show
          when={props.preview && !props.pending && !props.error}
          fallback={
            <Box
              class={previewPlaceholderStyle}
              justify={'center'}
              align={'center'}
              p={'xl'}
              text={'caption'}
              c={props.error ? 'error.main' : 'text.caption'}
            >
              {statusText()}
            </Box>
          }
        >
          <canvas
            ref={setCanvasElement}
            class={previewCanvasStyle}
            aria-label={'CV tile preview'}
          />
        </Show>
      </Box>
      <Box
        direction={'row'}
        justify={'space-between'}
        align={'center'}
        gap={'sm'}
      >
        <Box
          text={'caption'}
          c={renderWarning() ? 'warn.main' : 'text.caption'}
        >
          {renderWarning() ?? summaryText()}
        </Box>
        <Show when={props.preview?.assumedStructureTerrainTile}>
          <Box
            class={assumptionStyle}
            px={'xs'}
            py={'xxs'}
            r={'sm'}
            text={'caption'}
          >
            {'structure 지형 전환 가정'}
          </Box>
        </Show>
      </Box>
    </Box>
  );
};
