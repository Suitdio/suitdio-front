import { pdfjs, Document, Page } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { useEffect, useState } from 'react';
import { PDFEmbedWidget } from '@/lib/type';

// PDF 워커 설정 수정
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export default function WidgetPdf({
  onHeightChange,
  ...props
}: PDFEmbedWidget & {
  onHeightChange?: (height: number) => void;
  width?: number;
  height?: number;
}) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  useEffect(() => {
    onHeightChange?.(props.height ?? 750);
  }, [props.height]);

  const changePage = (offset: number) => {
    setPageNumber((prevPage) => {
      const newPage = prevPage + offset;
      if (numPages === null) return prevPage;
      if (newPage < 1) return 1;
      if (newPage > numPages) return numPages;
      return newPage;
    });
  };

  const changeScale = (delta: number) => {
    setScale((prevScale) => {
      const newScale = prevScale + delta;
      if (newScale < 0.5) return 0.5;
      if (newScale > 3) return 3;
      return newScale;
    });
  };

  return (
    <div className='pdf-viewer'>
      <div
        className='pdf-container'
        style={{ width: props.width, height: props.height }}
      >
        <Document file={props.src} onLoadSuccess={onDocumentLoadSuccess}>
          <Page pageNumber={pageNumber} scale={scale} width={props.width} />
        </Document>
      </div>

      <div className='pdf-controls'>
        <div className='page-controls'>
          <button onClick={() => changePage(-1)} disabled={pageNumber <= 1}>
            이전
          </button>
          <span>
            {pageNumber} / {numPages || '-'}
          </span>
          <button
            onClick={() => changePage(1)}
            disabled={numPages !== null && pageNumber >= numPages}
          >
            다음
          </button>
        </div>

        <div className='zoom-controls'>
          <button onClick={() => changeScale(-0.2)}>축소</button>
          <span>{Math.round(scale * 100)}%</span>
          <button onClick={() => changeScale(0.2)}>확대</button>
        </div>
      </div>
    </div>
  );
}
