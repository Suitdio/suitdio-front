import { TextWidget as TextWidgetType } from '@/lib/type';
import { PartialBlock } from '@blocknote/core';
import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote } from '@blocknote/react';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { relative } from 'path';

export default function WidgetText({ text, fontSize }: TextWidgetType) {
  const initialContent: PartialBlock[] | undefined = text
    ? JSON.parse(text)
    : undefined;

  console.log(initialContent);
  const editor = useCreateBlockNote({
    initialContent,
  });
  return (
    <div style={{ zIndex: -1, position: 'relative' }}>
      <BlockNoteView editor={editor} editable={true} />
    </div>
  );
}
