// utils/types.ts

// 모든 도형 타입을 포함하는 유니온 타입 정의
export type AllWidgetTypes =
  | TextWidget
  | ImageEmbedWidget
  | PDFEmbedWidget
  | IframeEmbedWidget
  | SectionWidget
  | BoardWidget;

// 새로운 타입을 추가할 때 여기에 | NewWidgetType 형태로 추가

export interface WidgetProps {
  id: string;
  type:
    | 'text'
    | 'image'
    | 'pdf'
    | 'url'
    | 'boardLink'
    | 'section'
    | 'mindmap'
    | 'shell'
    | 'arrow';
  isSelected?: boolean;
}

// 위젯 타입들을 유니온 타입으로 정의
export type NodeWidgetType = 'text' | 'image' | 'pdf' | 'url' | 'boardLink';
export type AreaWidgetType = 'section' | 'mindmap';
export type AllWidgetType = NodeWidgetType | AreaWidgetType | 'shell' | 'arrow';

// 타입 검사를 위한 상수 배열 (런타임에서 사용)
export const NODE_WIDGET_TYPES = [
  'text',
  'image',
  'pdf',
  'url',
  'boardLink',
] as const;
export const AREA_WIDGET_TYPES = ['section', 'mindmap'] as const;

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

export interface TextWidget extends WidgetProps {
  type: 'text';
  x: number; // 추가
  y: number; // 추가
  text: string;
  fontSize: number;
  width?: number;
  height?: number;
  draggable: boolean;
  editable: boolean;
  resizeable: boolean;
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

// export interface ArrowWidget extends WidgetProps {
//   type: 'arrow';
//   from: string;
//   to: string;
//   points: number[];
//   arrowTipX: number;
//   arrowTipY: number;
//   arrowHeads: ArrowHeadState; // 화살표 머리 상태 추가
// }

export interface SectionWidget extends WidgetProps {
  type: 'section';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  memberIds: string[]; // 섹션에 포함된 객체들의 ID 배열
  draggable: boolean;
  editable: boolean;
  resizeable: boolean;
}

export interface ImageEmbedWidget extends WidgetProps {
  type: 'image';
  src: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  draggable: boolean;
  editable: boolean;
  resizeable: boolean;
}
export interface PDFEmbedWidget extends WidgetProps {
  type: 'pdf';
  x: number;
  y: number;
  width?: number;
  height?: number;
  src: string; // PDF 파일의 URL 또는 데이터 URL
  draggable: boolean;
  editable: boolean;
  resizeable: boolean;
}

export interface IframeEmbedWidget extends WidgetProps {
  type: 'url';
  x: number;
  y: number;
  width?: number;
  height?: number;
  src: string;
  draggable: boolean;
  editable: boolean;
  resizeable: boolean;
}

export interface BoardWidget extends WidgetProps {
  type: 'boardLink';
  x: number;
  y: number;
  width: number;
  height: number;
  titleBlock: string;
  draggable: boolean;
  editable: boolean;
  resizeable: boolean;
}

// 타입 가드 함수

// export function isArrow(widget: WidgetProps): widget is ArrowWidget {
//   return widget.type === 'arrow';
// }

export function isText(widget: WidgetProps): widget is TextWidget {
  return widget.type === 'text';
}

export function isSection(widget: WidgetProps): widget is SectionWidget {
  return widget.type === 'section';
}

export function isImageEmbed(widget: WidgetProps): widget is ImageEmbedWidget {
  return widget.type === 'image';
}

export const isPDFEmbed = (widget: WidgetProps): widget is PDFEmbedWidget => {
  return widget.type === 'pdf';
};

export const isIframeEmbed = (
  widget: WidgetProps
): widget is IframeEmbedWidget => {
  return widget.type === 'url';
};

export const isBoard = (widget: WidgetProps): widget is BoardWidget => {
  return widget.type === 'boardLink';
};
