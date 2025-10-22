import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createParagraphNode, $getRoot, COMMAND_PRIORITY_EDITOR } from 'lexical';
import { $createImageNode, INSERT_IMAGE_COMMAND } from '../ImageNode';

export default function ImagePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INSERT_IMAGE_COMMAND,
      (payload) => {
        const { src, width, height } = payload;
        
        const imageNode = $createImageNode(src, width, height);
        
        const root = $getRoot();
        root.append(imageNode);

        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}