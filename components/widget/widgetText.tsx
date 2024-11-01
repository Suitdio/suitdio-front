import { TextWidget as TextWidgetType } from '@/lib/type';
import { PartialBlock } from '@blocknote/core';
import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote } from '@blocknote/react';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { relative } from 'path';
import { useEffect } from 'react';

interface WidgetTextProps extends TextWidgetType {
  editable: boolean;
  autoFocus?: boolean;
}

export default function WidgetText({
  text,
  editable,
  fontSize,
  autoFocus,
}: WidgetTextProps) {
  const initialContent: PartialBlock[] | undefined = text
    ? JSON.parse(text)
    : undefined;

  const editor = useCreateBlockNote({
    initialContent,
  });

  useEffect(() => {
    if (autoFocus && editable) {
      editor.focus();
    }
  }, [autoFocus, editable, editor]);

  return (
    <div style={{ zIndex: -1, position: 'relative' }}>
      <BlockNoteView editor={editor} editable={editable} />
    </div>
  );
}
