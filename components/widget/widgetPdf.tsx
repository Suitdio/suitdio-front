import { pdfjs, Document, Page } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { useEffect, useState } from 'react';
import { PDFEmbedWidget } from '@/lib/type';

// PDF 워커 설정 수정
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export default function WidgetPdf({
  onHeightChange,
  width,
  height,
  ...props
}: PDFEmbedWidget & {
  onHeightChange?: (height: number) => void;
}) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [pdfDimensions, setPdfDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [containerHeight, setContainerHeight] = useState<number>(height ?? 750);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  const onDocumentLoadSuccess = async ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);

    // PDF 문서의 첫 페이지 크기 정보 가져오기
    const pdf = await pdfjs.getDocument(props.src).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.0 });

    setPdfDimensions({
      width: viewport.width,
      height: viewport.height,
    });

    // 원본 비율 저장
    const ratio = viewport.height / viewport.width;
    setAspectRatio(ratio);

    // 초기 높이 설정
    if (width) {
      const newHeight = width * ratio;
      setContainerHeight(newHeight);
      onHeightChange?.(newHeight);
    }
  };

  // width, height, scale 변경 시 크기 조절
  useEffect(() => {
    if (!aspectRatio || !width) return;

    // widgetShell에서 전달받은 height이 있는 경우
    if (height) {
      setContainerHeight(height);
      // scale 조정 (width 기준으로 scale 계산)
      const expectedHeight = width * aspectRatio;
      const newScale = height / expectedHeight;
      setScale(newScale);
    } else {
      // height이 없는 경우 width를 기준으로 비율에 맞게 조정
      const newHeight = width * aspectRatio * scale;
      setContainerHeight(newHeight);
      onHeightChange?.(newHeight);
    }
  }, [width, height, aspectRatio]);

  // scale만 변경된 경우
  useEffect(() => {
    if (!aspectRatio || !width) return;
    if (!height) {
      // height이 고정되지 않은 경우만 조절
      const newHeight = width * aspectRatio * scale;
      setContainerHeight(newHeight);
      onHeightChange?.(newHeight);
    }
  }, [scale]);

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
    <div className='pdf-viewer w-full h-full'>
      <div
        className='pdf-container'
        style={{
          width: '100%',
          height: containerHeight,
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Document file={props.src} onLoadSuccess={onDocumentLoadSuccess}>
          <Page pageNumber={pageNumber} scale={scale} width={width} />
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
