
import { DecoratorNode, COMMAND_PRIORITY_EDITOR, createCommand } from "lexical";
import ImageComponent from "../ImageComponent";
import ResizableImageComponent from "../ResizableImageComponent";

export const INSERT_IMAGE_COMMAND = createCommand('INSERT_IMAGE_COMMAND');

export default class ImageNode extends DecoratorNode {
  static getType() {
    return "image";
  }

  static clone(node) {
    return new ImageNode(
      node.__src,
      node.__width,
      node.__height,
      node.__loading,
      node.__key,
    );
  }

  constructor(src, width = 400, height = 300, loading = false, key) {
    super(key);
    this.__src = src;
    this.__width = width;
    this.__height = height;
    this.__loading = loading;
  }

  createDOM() {
    const div = document.createElement("div");
    div.className = 'image-container'
    return div;
  }

  updateDOM() {
    return false;
  }

  exportJSON() {
    return {
      type: "image",
      version: 1,
      src: this.__src,
      width: this.__width,
      height: this.__height,
    };
  }

  static importJSON(serializedNode) {
    const { src, width, height, filePath } = serializedNode;
    return $createImageNode(src, width, height); 
  }

  // update dimensions when user resizes
  setWidthAndHeight(width, height) {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
  }

  setSrcAndLoading(src, loading) {
    const writable = this.getWritable();
    writable.__src = src;
    writable.__loading = loading;
  }

  getWidth() {
    return this.__width;
  }

  getHeight() {
    return this.__height;
  }

  decorate(editor) {
    const src = this.__src;
    const nodeKey = this.getKey();
    const width = this.__width;
    const height = this.__height;
    const loading = this.__loading;
    const isEditable = editor.isEditable();
    return <ResizableImageComponent src={src} nodeKey={nodeKey} width={width} height={height} loading={loading} isEditable={isEditable}/>;
  }
}

//helper function to create ImageNode
export function $createImageNode(src, width = 400, height = 300, loading = false) {
  return new ImageNode(src, width, height, loading);
}
