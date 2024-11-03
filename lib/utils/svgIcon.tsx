import React from 'react';
import { cn } from '../utils';

interface SvgIconProps {
  width?: number;
  height?: number;
  fill?: string;
  children?: React.ReactNode;
  path?: string;
  className?: string;
}

const SvgIcon = ({
  path,
  width,
  height,
  fill = 'white',
  children,
  className,
}: SvgIconProps) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill={fill}
      className={cn('hover:fill-basic-800  cursor-pointer', className)}
    >
      {children}
      <path d={path} fill={fill} />
    </svg>
  );
};

export default SvgIcon;
