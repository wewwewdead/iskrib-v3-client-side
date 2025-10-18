import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect, useState } from "react";
import ImageNode from "../ImageNode";
import ImageComponent from "../../ImageComponent";

const CustomImagePlugin = () => {
  const [editor] = useLexicalComposerContext();
  const [images, setImages] = useState([]);

  useEffect(() => {
    if (!editor.hasNodes([ImageNode])) {
      throw new Error("CustomImagePlugin: ImageNode not registered on editor");
    }

    const updateImages = () => {
      editor.getEditorState().read(() => {
        const nodes = editor.getEditorState()._nodeMap;
        const imageNodes = [];
        nodes.forEach((node) => {
          if (node.__type === "image") {
            imageNodes.push({ key: node.__key, src: node.__src });
          }
        });
        setImages(imageNodes);
      });
    };

    updateImages();
    return editor.registerUpdateListener(updateImages);
  }, [editor]);

  return (
    <div>
      {images.map(({ key, src }) => (
        <ImageComponent key={key} src={src} nodeKey={key} />
      ))}
    </div>
  );
}
export default CustomImagePlugin;