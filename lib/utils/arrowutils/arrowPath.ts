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
export const getwidgetSideCenters = (widget: AllWidgetTypes) => {
  const widgetX = widget.x ?? 0;
  const widgetY = widget.y ?? 0;
  const widgetWidth = ("width" in widget ? widget.width : undefined) ?? 100;
  const widgetHeight = ("height" in widget ? widget.height : undefined) ?? 30;

  const centers = [
    { x: widgetX + widgetWidth / 2, y: widgetY }, // 상단 중앙
    { x: widgetX + widgetWidth / 2, y: widgetY + widgetHeight }, // 하단 중앙
    { x: widgetX, y: widgetY + widgetHeight / 2 }, // 좌측 중앙
    { x: widgetX + widgetWidth, y: widgetY + widgetHeight / 2 }, // 우측 중앙
  ];

  return centers;
};

// 특정 위치에서 가장 가까운 도형 찾기
export const findClosestWidgetAtPoint = (
  x: number,
  y: number,
  widgets: AllWidgetTypes[]
): AllWidgetTypes | null => {
  let closestWidget: AllWidgetTypes | null = null;
  let minDistance = Infinity;

  widgets.forEach((widget) => {
    const widgetX = widget.x ?? 0;
    const widgetY = widget.y ?? 0;
    const widgetWidth = ("width" in widget ? widget.width : undefined) ?? 100;
    const widgetHeight = ("height" in widget ? widget.height : undefined) ?? 30;

    // 도형과의 거리 계산
    const distance = Math.min(
      Math.hypot(x - widgetX, y - widgetY),
      Math.hypot(x - (widgetX + widgetWidth), y - widgetY),
      Math.hypot(x - widgetX, y - (widgetY + widgetHeight)),
      Math.hypot(x - (widgetX + widgetWidth), y - (widgetY + widgetHeight))
    );

    if (distance < minDistance && distance <= snapDistance) {
      minDistance = distance;
      closestWidget = widget;
    }
  });

  return closestWidget;
};

// 도형의 가장 가까운 면의 중앙 점 계산
export const getClosestSidePoint = (
  widget: AllWidgetTypes,
  x: number,
  y: number
) => {
  const centers = getwidgetSideCenters(widget);
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
  const fromCenters = getwidgetSideCenters(from);
  const toCenters = getwidgetSideCenters(to);

  let bestFromPoint = fromCenters[0];
  let bestToPoint = toCenters[0];
  let minDistance = Infinity;

  fromCenters.forEach((fromPoint) => {
    toCenters.forEach((toPoint) => {
      const distance = Math.hypot(
        toPoint.x - fromPoint.x,
        toPoint.y - fromPoint.y
      );
      if (distance < minDistance) {
        minDistance = distance;
        bestFromPoint = fromPoint;
        bestToPoint = toPoint;
      }
    });
  });

  // 화살표 헤드 계산
  const angle = Math.atan2(
    bestToPoint.y - bestFromPoint.y,
    bestToPoint.x - bestFromPoint.x
  );
  const arrowLength = 15;
  const arrowOffset = -10;

  const arrowTipX = bestToPoint.x + Math.cos(angle) * arrowOffset;
  const arrowTipY = bestToPoint.y + Math.sin(angle) * arrowOffset;

  return {
    points: [bestFromPoint.x, bestFromPoint.y, bestToPoint.x, bestToPoint.y],
    arrowTipX,
    arrowTipY,
  };
}
