import { IframeEmbedWidget } from '@/lib/type';
import { useEffect, useRef, useState } from 'react';

interface WidgetUrlProps extends IframeEmbedWidget {
  onHeightChange: (height: number) => void;
}

export default function WidgetUrl({ ...props }: WidgetUrlProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState<number>(props.height || 552);

  useEffect(() => {
    props.onHeightChange?.(height);
  }, [height]);

  return (
    <div
      style={{ width: props.width || 472, height: height, overflow: 'hidden' }}
    >
      <iframe
        ref={iframeRef}
        src={props.src}
        tabIndex={0}
        allowFullScreen
        width='100%'
        height='100%'
      />
    </div>
  );
}
