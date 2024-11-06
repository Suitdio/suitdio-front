import { IframeEmbedWidget } from '@/lib/type';
import { useEffect, useRef, useState } from 'react';

interface WidgetUrlProps extends IframeEmbedWidget {
  onHeightChange: (height: number) => void;
  width: number;
  height: number;
}

export default function WidgetUrl({
  width,
  height,
  onHeightChange,
  ...props
}: WidgetUrlProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    onHeightChange?.(height);
  }, [height]);

  return (
    <div style={{ width: width || 472, height: height, overflow: 'hidden' }}>
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
