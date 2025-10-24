import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createParagraphNode, $getRoot, $getSelection, $isRangeSelection, COMMAND_PRIORITY_EDITOR } from 'lexical';
import { $createImageNode, INSERT_IMAGE_COMMAND } from '../ImageNode';
import { $createHeadingNode } from '@lexical/rich-text';

export default function ImagePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INSERT_IMAGE_COMMAND,
      (payload) => {
        const { src, width, height } = payload;
        
        const imageNode = $createImageNode(src, width, height);
        const paragraphNode = $createParagraphNode();
        const selection = $getSelection();
        
        if($isRangeSelection(selection)){
           selection.insertNodes([imageNode]);
        }else {
          const root = $getRoot();
          root.append(imageNode)
          root.append(paragraphNode)
        }
        
       

        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}