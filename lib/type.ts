// utils/types.ts

// 모든 도형 타입을 포함하는 유니온 타입 정의
export type AllWidgetTypes =
  | RectangleWidget
  | ArrowWidget
  | TextWidget
  | ImageEmbedWidget
  | PDFEmbedWidget
  | IframeEmbedWidget
  | MarkdownWidget
  | SectionWidget
  | BoardWidget;

// 새로운 타입을 추가할 때 여기에 | NewWidgetType 형태로 추가

export interface WidgetProps {
  id: string;
  type:
    | 'shell'
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

export interface ShellWidgetProps<T extends AllWidgetTypes>
  extends WidgetProps {
  type: 'shell';
  x: number;
  y: number;
  width: number;
  height: number;
  isSelected?: boolean;
  resizable: boolean;
  editable: boolean;
  draggable: boolean;
  innerWidget: T; // 내부 위젯을 저장하는 속성
}

export interface RectangleWidget extends WidgetProps {
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  draggable: boolean;
}

export interface TextWidget extends WidgetProps {
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

export interface ArrowWidget extends WidgetProps {
  type: 'arrow';
  from: string;
  to: string;
  points: number[];
  arrowTipX: number;
  arrowTipY: number;
  arrowHeads: ArrowHeadState; // 화살표 머리 상태 추가
}

export interface SectionWidget extends WidgetProps {
  type: 'section';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  draggable: boolean;
  memberIds: string[]; // 섹션에 포함된 객체들의 ID 배열
}

export interface ImageEmbedWidget extends WidgetProps {
  type: 'imageEmbed';
  src: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  draggable: boolean;
}
export interface PDFEmbedWidget extends WidgetProps {
  type: 'pdfEmbed';
  x: number;
  y: number;
  width?: number;
  height?: number;
  src: string; // PDF 파일의 URL 또는 데이터 URL
  draggable: boolean;
}

export interface IframeEmbedWidget extends WidgetProps {
  type: 'iframeEmbed';
  x: number;
  y: number;
  width?: number;
  height?: number;
  src: string;
  draggable: boolean;
}

export interface MarkdownWidget extends WidgetProps {
  type: 'markdown';
  x: number;
  y: number;
  width?: number;
  height?: number;
  src?: string;
  draggable: boolean;
  mkText?: string;
}

export interface BoardWidget extends WidgetProps {
  type: 'board';
  x: number;
  y: number;
  width: number;
  height: number;
  titleBlock: string;
  draggable: boolean;
}

// 타입 가드 함수
export function isRectangle(widget: WidgetProps): widget is RectangleWidget {
  return widget.type === 'rectangle';
}

export function isArrow(widget: WidgetProps): widget is ArrowWidget {
  return widget.type === 'arrow';
}

export function isText(widget: WidgetProps): widget is TextWidget {
  return widget.type === 'text';
}

export function isSection(widget: WidgetProps): widget is SectionWidget {
  return widget.type === 'section';
}

export function isImageEmbed(widget: WidgetProps): widget is ImageEmbedWidget {
  return widget.type === 'imageEmbed';
}

export const isPDFEmbed = (widget: WidgetProps): widget is PDFEmbedWidget => {
  return widget.type === 'pdfEmbed';
};

export const isIframeEmbed = (
  widget: WidgetProps
): widget is IframeEmbedWidget => {
  return widget.type === 'iframeEmbed';
};

export const isMarkdown = (widget: WidgetProps): widget is MarkdownWidget => {
  return widget.type === 'markdown';
};

export const isBoard = (widget: WidgetProps): widget is BoardWidget => {
  return widget.type === 'board';
};
