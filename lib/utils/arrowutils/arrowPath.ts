// utils/helpers.ts
import { AllWidgetTypes } from "../../type";

interface WidgetWithDimensions {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export const snapDistance = 10;

// 도형의 각 면의 중앙 좌표 반환
export const getShapeSideCenters = (shape: AllWidgetTypes) => {
  const shapeX = shape.x ?? 0;
  const shapeY = shape.y ?? 0;
  const shapeWidth = ("width" in shape ? shape.width : undefined) ?? 100;
  const shapeHeight = ("height" in shape ? shape.height : undefined) ?? 30;

  const centers = [
    { x: shapeX + shapeWidth / 2, y: shapeY }, // 상단 중앙
    { x: shapeX + shapeWidth / 2, y: shapeY + shapeHeight }, // 하단 중앙
    { x: shapeX, y: shapeY + shapeHeight / 2 }, // 좌측 중앙
    { x: shapeX + shapeWidth, y: shapeY + shapeHeight / 2 }, // 우측 중앙
  ];

  return centers;
};

// 특정 위치에서 가장 가까운 도형 찾기
export const findClosestShapeAtPoint = (
  x: number,
  y: number,
  shapes: AllWidgetTypes[]
): AllWidgetTypes | null => {
  let closestShape: AllWidgetTypes | null = null;
  shapes.forEach((shape) => {
    const shapeX = shape.x ?? 0;
    const shapeY = shape.y ?? 0;
    const shapeWidth = ("width" in shape ? shape.width : undefined) ?? 100;
    const shapeHeight = ("height" in shape ? shape.height : undefined) ?? 30;

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
  shape: AllWidgetTypes,
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
export function getConnectorPoints(from: AllWidgetTypes, to: AllWidgetTypes) {
  const fromCenters = getShapeSideCenters(from);
  const toCenters = getShapeSideCenters(to);

  const DEFAULT_WIDTH = 100;
  const DEFAULT_HEIGHT = 50;

  // 출발 도형의 중심 좌표 계산
  const fromCenterX =
    (from.x ?? 0) +
    (("width" in from ? from.width : undefined) ?? DEFAULT_WIDTH) / 2;
  const fromCenterY =
    (from.y ?? 0) +
    (("height" in from ? from.height : undefined) ?? DEFAULT_HEIGHT) / 2;

  // 도착 도형의 중심 좌표 계산
  const toCenterX =
    (to.x ?? 0) + (("width" in to ? to.width : undefined) ?? DEFAULT_WIDTH) / 2;
  const toCenterY =
    (to.y ?? 0) +
    (("height" in to ? to.height : undefined) ?? DEFAULT_HEIGHT) / 2;

  let fromPoint, toPoint;

  // 화살표의 방향을 결정하기 위해 x축과 y축의 차이를 계산
  const dx = toCenterX - fromCenterX;
  const dy = toCenterY - fromCenterY;

  if (Math.abs(dx) > Math.abs(dy)) {
    // 수평 방향의 차이가 더 큰 경우
    if (dx > 0) {
      fromPoint = fromCenters[3]; // 출발 도형의 오른쪽 측면 중앙
      toPoint = toCenters[2]; // 도착 도형의 왼쪽 측면 중앙
    } else {
      fromPoint = fromCenters[2]; // 출발 도형의 왼쪽 측면 중앙
      toPoint = toCenters[3]; // 도착 도형의 오른쪽 측면 중앙
    }
  } else {
    // 수직 방향의 차이가 더 큰 경우
    if (dy > 0) {
      fromPoint = fromCenters[1]; // 출발 도형의 아래 측면 중앙
      toPoint = toCenters[0]; // 도착 도형의 위 측면 중앙
    } else {
      fromPoint = fromCenters[0]; // 출발 도형의 위 측면 중앙
      toPoint = toCenters[1]; // 도착 도형의 아래 측면 중앙
    }
  }

  // 출발점과 도착점의 중간 좌표 계산
  const midX = (fromPoint.x + toPoint.x) / 2;
  const midY = (fromPoint.y + toPoint.y) / 2;

  let points: number[];

  // 꺾임 포인트를 기준으로 화살표의 꺾인 부분을 계산
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

  // 화살표 헤드 계산
  const arrowLength = 15;
  const arrowAngle = Math.atan2(
    toPoint.y - points[points.length - 3],
    toPoint.x - points[points.length - 4]
  );

  // 화살표 헤드를 객체 바깥으로 이동
  const arrowOffset = -10;
  const finalArrowTipX = toPoint.x + Math.cos(arrowAngle) * arrowOffset;
  const finalArrowTipY = toPoint.y + Math.sin(arrowAngle) * arrowOffset;

  // 화살표 선의 끝점을 화살표 헤드의 시작점으로 조정
  points[points.length - 2] = finalArrowTipX;
  points[points.length - 1] = finalArrowTipY;

  return {
    points,
    arrowTipX: finalArrowTipX,
    arrowTipY: finalArrowTipY,
  };
}
