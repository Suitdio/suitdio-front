// 스냅핑 로직 함수
export const snap = (value: number) => {
  const remainder = value % 48;
  if (remainder >= 0 && remainder <= 24) {
    return value - remainder;
  } else {
    return value + (48 - remainder);
  }
};

export const snapOnDragMove = (e: any) => {
  const node = e.target;
  // 현재 좌표 가져오기
  let x = node.x();
  let y = node.y();

  // 스냅핑 로직 적용
  x = snap(x);
  y = snap(y);

  // 위치 업데이트
  node.position({ x, y });
};

export const snapOnDragEnd = (e: any, shapeProps: any, onChange: any) => {
  e.cancelBubble = true;
  const node = e.target;
  // 최종 위치 가져오기
  let x = node.x();
  let y = node.y();

  // 스냅핑 로직 적용
  x = snap(x);
  y = snap(y);

  // 위치 업데이트
  node.position({ x, y });
  console.log('start position:', x, y);

  // 상태 업데이트
  onChange({
    ...shapeProps,
    x,
    y,
  });
};

export const anchorDragBoundFunc = (oldPos: any, newPos: any, event: any) => {
  // snap 함수를 사용하여 x와 y 좌표를 스냅합니다.
  const x = snap(newPos.x);
  const y = snap(newPos.y);
  console.log('snap position:', x, y);

  return { x, y };
};

// 위젯 스냅핑을 위한 새로운 함수들
export const snapWidgetPosition = (
  x: number,
  y: number,
  scale: number,
  baseSpacing: number = 48
) => {
  return {
    x: snap(x / scale) * scale,
    y: snap(y / scale) * scale,
  };
};

export const snapWidgetResize = (
  direction: string,
  startPos: { x: number; y: number },
  newPos: { x: number; y: number },
  currentWidget: { x: number; y: number; width: number; height: number },
  scale: number,
  margin: number = 8
) => {
  const dx = (newPos.x - startPos.x) / scale;
  const dy = (newPos.y - startPos.y) / scale;

  let newWidth = currentWidget.width;
  let newHeight = currentWidget.height;
  let newX = currentWidget.x;
  let newY = currentWidget.y;

  switch (direction) {
    case 'se':
    case 'e':
    case 's':
      newWidth = snap(currentWidget.width + dx) - margin;
      newHeight = snap(currentWidget.height + dy) - margin;
      break;
    case 'sw':
      newWidth = snap(currentWidget.width - dx) - margin;
      newHeight = snap(currentWidget.height + dy) - margin;
      newX = snap(currentWidget.x + dx);
      break;
    case 'ne':
    case 'n':
      newWidth = snap(currentWidget.width + dx) - margin;
      newHeight = snap(currentWidget.height - dy) - margin;
      newY = snap(currentWidget.y + dy);
      break;
    case 'nw':
    case 'w':
      newWidth = snap(currentWidget.width - dx) - margin;
      newHeight = snap(currentWidget.height - dy) - margin;
      newX = snap(currentWidget.x + dx);
      newY = snap(currentWidget.y + dy);
      break;
  }

  return {
    x: newX,
    y: newY,
    width: Math.max(50, newWidth),
    height: Math.max(50, newHeight),
  };
};
