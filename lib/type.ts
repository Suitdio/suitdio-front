// utils/types.ts

// 모든 도형 타입을 포함하는 유니온 타입 정의
export type AllShapeTypes =
  | RectangleShape
  | ArrowShape
  | TextShape
  | ImageEmbedShape
  | PDFEmbedShape
  | IframeEmbedShape
  | MarkdownShape
  | SectionShape
  | BoardShape;

// 새로운 타입을 추가할 때 여기에 | NewShapeType 형태로 추가

export interface ShapeProps {
  id: string;

  type:
    | 'rectangle'
    | 'arrow'
    | 'text'
    | 'imageEmbed'
    | 'pdfEmbed'
    | 'iframeEmbed'
    | 'markdown'
    | 'section'
    | 'board';

  isSelected?: boolean;
}

export interface RectangleShape extends ShapeProps {
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  draggable: boolean;
}

export interface TextShape extends ShapeProps {
  type: 'text';
  x: number; // 추가
  y: number; // 추가
  text: string;
  fontSize: number;
  width?: number;
  height?: number;
  draggable: boolean;
}

export enum RelationshipType {
  Unidirectional = 'unidirectional', // 단방향 관계
  Bidirectional = 'bidirectional', // 양방향 관계
  Equal = 'equal', // 동등관계
}

export interface ArrowHeadState {
  left: boolean; // 왼쪽 화살표 머리 표시 여부
  right: boolean; // 오른쪽 화살표 머리 표시 여부
}

export interface ArrowShape extends ShapeProps {
  type: 'arrow';
  from: string;
  to: string;
  points: number[];
  arrowTipX: number;
  arrowTipY: number;
  arrowHeads: ArrowHeadState; // 화살표 머리 상태 추가
}

export interface SectionShape extends ShapeProps {
  type: 'section';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  draggable: boolean;
  memberIds: string[]; // 섹션에 포함된 객체들의 ID 배열
}

export interface ImageEmbedShape extends ShapeProps {
  type: 'imageEmbed';
  src: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  draggable: boolean;
}
export interface PDFEmbedShape extends ShapeProps {
  type: 'pdfEmbed';
  x: number;
  y: number;
  width?: number;
  height?: number;
  src: string; // PDF 파일의 URL 또는 데이터 URL
  draggable: boolean;
}

export interface IframeEmbedShape extends ShapeProps {
  type: 'iframeEmbed';
  x: number;
  y: number;
  width?: number;
  height?: number;
  src: string;
  draggable: boolean;
}

export interface MarkdownShape extends ShapeProps {
  type: 'markdown';
  x: number;
  y: number;
  width?: number;
  height?: number;
  src?: string;
  draggable: boolean;
  mkText?: string;
}

export interface BoardShape extends ShapeProps {
  type: 'board';
  x: number;
  y: number;
  width: number;
  height: number;
  titleBlock: string;
  draggable: boolean;
}

// 타입 가드 함수
export function isRectangle(shape: ShapeProps): shape is RectangleShape {
  return shape.type === 'rectangle';
}

export function isArrow(shape: ShapeProps): shape is ArrowShape {
  return shape.type === 'arrow';
}

export function isText(shape: ShapeProps): shape is TextShape {
  return shape.type === 'text';
}

export function isSection(shape: ShapeProps): shape is SectionShape {
  return shape.type === 'section';
}

// 관계 타입을 결정하는 헬퍼 함수
export function determineRelationshipType(
  arrowHeads: ArrowHeadState
): RelationshipType {
  if (arrowHeads.left && arrowHeads.right) {
    return RelationshipType.Bidirectional;
  } else if (!arrowHeads.left && !arrowHeads.right) {
    return RelationshipType.Equal;
  } else {
    return RelationshipType.Unidirectional;
  }
}

export function isImageEmbed(shape: ShapeProps): shape is ImageEmbedShape {
  return shape.type === 'imageEmbed';
}

export const isPDFEmbed = (shape: ShapeProps): shape is PDFEmbedShape => {
  return shape.type === 'pdfEmbed';
};

export const isIframeEmbed = (shape: ShapeProps): shape is IframeEmbedShape => {
  return shape.type === 'iframeEmbed';
};

export const isMarkdown = (shape: ShapeProps): shape is MarkdownShape => {
  return shape.type === 'markdown';
};

export const isBoard = (shape: ShapeProps): shape is BoardShape => {
  return shape.type === 'board';
};
