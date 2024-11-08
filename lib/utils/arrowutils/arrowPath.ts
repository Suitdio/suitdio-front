// utils/arrowpath.ts

import { AllWidgetTypes, ArrowWidget } from "@/lib/type"; // 필요한 타입들을 import

// Define NonArrowWidgetTypes to exclude ArrowWidget
export type NonArrowWidgetTypes = Exclude<AllWidgetTypes, ArrowWidget>;

export const snapDistance = 10;

// 도형의 각 면의 중앙 좌표 반환
export const getShapeSideCenters = (shape: NonArrowWidgetTypes) => {
  const DEFAULT_WIDTH = 100;
  const DEFAULT_HEIGHT = 50;

  const shapeX = shape.x;
  const shapeY = shape.y;
  const shapeWidth = shape.width ?? DEFAULT_WIDTH;
  const shapeHeight = shape.height ?? DEFAULT_HEIGHT;

  const centers = [
    { x: shapeX + shapeWidth / 2, y: shapeY }, // 상단 중앙
    { x: shapeX + shapeWidth / 2, y: shapeY + shapeHeight }, // 하단 중앙
    { x: shapeX, y: shapeY + shapeHeight / 2 }, // 좌측 중앙
    { x: shapeX + shapeWidth, y: shapeY + shapeHeight / 2 }, // 우측 중앙
  ];

  return centers;
};

// 특정 위치에서 가장 가까운 도형 찾기
export const findClosestWidgetAtPoint = (
  x: number,
  y: number,
  shapes: NonArrowWidgetTypes[]
): NonArrowWidgetTypes | null => {
  let closestShape: NonArrowWidgetTypes | null = null;
  shapes.forEach((shape) => {
    const DEFAULT_WIDTH = 100;
    const DEFAULT_HEIGHT = 50;

    const shapeX = shape.x;
    const shapeY = shape.y;
    const shapeWidth = shape.width ?? DEFAULT_WIDTH;
    const shapeHeight = shape.height ?? DEFAULT_HEIGHT;

    if (
      x >= shapeX - snapDistance &&
      x <= shapeX + shapeWidth + snapDistance &&
      y >= shapeY - snapDistance &&
      y <= shapeY + shapeHeight + snapDistance
    ) {
      closestShape = shape;
    }
  });
  return closestShape;
};

// 도형의 가장 가까운 면의 중앙 점 계산
export const getClosestSidePoint = (
  shape: NonArrowWidgetTypes,
  x: number,
  y: number
) => {
  const centers = getShapeSideCenters(shape);
  let closestPoint = centers[0];
  let minDistance = Math.hypot(x - centers[0].x, y - centers[0].y);

  centers.forEach((center) => {
    const distance = Math.hypot(x - center.x, y - center.y);
    if (distance < minDistance) {
      minDistance = distance;
      closestPoint = center;
    }
  });

  return closestPoint;
};

// 두 도형 사이의 화살표 좌표를 계산하는 함수
export function getConnectorPoints(
  from: NonArrowWidgetTypes,
  to: NonArrowWidgetTypes
) {
  const fromCenters = getShapeSideCenters(from);
  const toCenters = getShapeSideCenters(to);

  const fromCenterX = from.x + (from.width ?? 100) / 2;
  const fromCenterY = from.y + (from.height ?? 50) / 2;

  const toCenterX = to.x + (to.width ?? 100) / 2;
  const toCenterY = to.y + (to.height ?? 50) / 2;

  let fromPoint, toPoint;

  const dx = toCenterX - fromCenterX;
  const dy = toCenterY - fromCenterY;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0) {
      fromPoint = fromCenters[3]; // 오른쪽
      toPoint = toCenters[2]; // 왼쪽
    } else {
      fromPoint = fromCenters[2]; // 왼쪽
      toPoint = toCenters[3]; // 오른쪽
    }
  } else {
    if (dy > 0) {
      fromPoint = fromCenters[1]; // 아래
      toPoint = toCenters[0]; // 위
    } else {
      fromPoint = fromCenters[0]; // 위
      toPoint = toCenters[1]; // 아래
    }
  }

  const midX = (fromPoint.x + toPoint.x) / 2;
  const midY = (fromPoint.y + toPoint.y) / 2;

  let points: number[];

  if (Math.abs(dx) > Math.abs(dy)) {
    const bendX = midX;
    points = [
      fromPoint.x,
      fromPoint.y,
      bendX,
      fromPoint.y,
      bendX,
      toPoint.y,
      toPoint.x,
      toPoint.y,
    ];
  } else {
    const bendY = midY;
    points = [
      fromPoint.x,
      fromPoint.y,
      fromPoint.x,
      bendY,
      toPoint.x,
      bendY,
      toPoint.x,
      toPoint.y,
    ];
  }

  const arrowAngle = Math.atan2(
    toPoint.y - points[points.length - 3],
    toPoint.x - points[points.length - 4]
  );

  const arrowOffset = -10;
  const finalArrowTipX = toPoint.x + Math.cos(arrowAngle) * arrowOffset;
  const finalArrowTipY = toPoint.y + Math.sin(arrowAngle) * arrowOffset;

  points[points.length - 2] = finalArrowTipX;
  points[points.length - 1] = finalArrowTipY;

  return {
    points,
    arrowTipX: finalArrowTipX,
    arrowTipY: finalArrowTipY,
  };
}
