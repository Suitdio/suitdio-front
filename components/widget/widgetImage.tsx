import { ImageEmbedWidget } from '@/lib/type';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function WidgetImage({
  onHeightChange,
  ...props
}: ImageEmbedWidget & { onHeightChange?: (height: number) => void }) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [height, setHeight] = useState<number>(props.height || 0);

  useEffect(() => {
    const img = new window.Image();
    img.src = props.src;
    img.onload = () => {
      const aspectRatio = img.height / img.width;
      const newHeight = Math.round(props.width ? props.width * aspectRatio : 0);
      setHeight(newHeight);
      onHeightChange?.(newHeight);
      setImage(img);
    };
  }, [props.src, props.width]);

  if (!image || props.width === 0) {
    return null;
  }

  return (
    <div className='relative w-full h-full'>
      <Image
        src={props.src}
        alt='image'
        width={props.width}
        height={height}
        objectFit='contain'
      />
    </div>
  );
}
