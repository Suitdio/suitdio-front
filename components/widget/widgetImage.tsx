import { ImageEmbedWidget } from '@/lib/type';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function WidgetImage({
  onHeightChange,
  width,
  ...props
}: ImageEmbedWidget & { onHeightChange?: (height: number) => void }) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [height, setHeight] = useState<number>(props.height || 0);

  useEffect(() => {
    const img = new window.Image();
    img.src = props.src;
    img.onload = () => {
      const aspectRatio = img.height / img.width;
      const newHeight = Math.round(width ? width * aspectRatio : 0);
      setHeight(newHeight);
      onHeightChange?.(newHeight);
      setImage(img);
    };
  }, [props.src, width]);

  if (!image || width === 0) {
    return null;
  }

  return (
    <div className='relative w-full h-full'>
      <Image
        src={props.src}
        alt='image'
        width={width}
        height={height}
        objectFit='contain'
      />
    </div>
  );
}
