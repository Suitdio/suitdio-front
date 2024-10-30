import { TextWidget as TextWidgetType } from '@/lib/type';

export default function WidgetText({ text, fontSize }: TextWidgetType) {
  return (
    <div
      style={{
        fontSize: `${fontSize}px`,
        padding: '4px',
        width: '100%',
        height: '100%',
        userSelect: 'none',
      }}
    >
      {text}
    </div>
  );
}
