import { TextWidget } from '../type';

interface Position {
  x: number;
  y: number;
}

//너비상수
const WIDTH = 400;
const HEIGHT = 200;

// 랜덤 위치 생성 함수
const getRandomPosition = (
  existingNodes: TextWidget[],
  containerWidth: number,
  containerHeight: number,
  scale: number,
  offset: { x: number; y: number }
): Position => {
  const padding = 20; // 노드 간 최소 간격
  const maxAttempts = 50; // 최대 시도 횟수

  // 현재 화면의 보이는 영역 계산
  const viewportX = -offset.x;
  const viewportY = -offset.y;
  const viewportWidth = containerWidth / scale;
  const viewportHeight = containerHeight / scale;

  for (let i = 0; i < maxAttempts; i++) {
    const position = {
      x:
        viewportX +
        Math.random() * (viewportWidth - WIDTH - padding * 2) +
        padding,
      y:
        viewportY +
        Math.random() * (viewportHeight - HEIGHT - padding * 2) +
        padding,
    };

    // 겹침 검사
    const hasOverlap = existingNodes.some((node) => {
      const nodeWidth = node.width ?? WIDTH; // width가 undefined인 경우 기본값 사용
      const nodeHeight = node.height ?? HEIGHT; // height가 undefined인 경우 기본값 사용

      return !(
        position.x + WIDTH + padding < node.x ||
        position.x > node.x + nodeWidth + padding ||
        position.y + HEIGHT + padding < node.y ||
        position.y > node.y + nodeHeight + padding
      );
    });

    if (!hasOverlap) {
      return position;
    }
  }

  // 겹치지 않는 위치를 찾지 못한 경우, 화면 중앙에 위치
  return {
    x: viewportX + (viewportWidth - WIDTH) / 2,
    y: viewportY + (viewportHeight - HEIGHT) / 2,
  };
};

export const createTextNode = (
  text: string,
  containerWidth: number,
  containerHeight: number,
  existingNodes: TextWidget[],
  shapeCount: number,
  scale: number,
  offset: { x: number; y: number }
): TextWidget => {
  const position = getRandomPosition(
    existingNodes,
    containerWidth,
    containerHeight,
    scale,
    offset
  );

  const initialText = JSON.stringify([
    {
      type: 'paragraph',
      content: text,
    },
  ]);

  return {
    id: `text-${shapeCount + 1}`,
    type: 'text',
    x: position.x,
    y: position.y,
    text: initialText,
    fontSize: 16,
    width: WIDTH,
    height: HEIGHT,
    draggable: true,
    editable: true,
    resizeable: true,
    headerBar: true,
    footerBar: false,
  };
};
