'use client';

import dynamic from 'next/dynamic';

const Whiteboard = dynamic(() => import('@/components/board/whiteboard'), {
  ssr: false,
});

export default function Home() {
  return (
    <div>
      <Whiteboard />
    </div>
  );
}
