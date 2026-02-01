
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
      node.__rotation,
      node.__key,
    );
  }

  constructor(src, width = 400, height = 300, loading = false, rotation = 0, key) {
    super(key);
    this.__src = src;
    this.__width = width;
    this.__height = height;
    this.__loading = loading;
    this.__rotation = rotation;
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
      rotation: this.__rotation,
    };
  }

  static importJSON(serializedNode) {
    const { src, width, height, rotation } = serializedNode;
    return $createImageNode(src, width, height, false, rotation);
  }

  // update dimensions when user resizes
  setWidthAndHeight(width, height) {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
  }

  setRotation(rotation) {
    const writable = this.getWritable();
    writable.__rotation = rotation;
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
    const rotation = this.__rotation;
    const isEditable = editor.isEditable();
    return <ResizableImageComponent src={src} nodeKey={nodeKey} width={width} height={height} loading={loading} rotation={rotation} isEditable={isEditable}/>;
  }
}

//helper function to create ImageNode
export function $createImageNode(src, width = 400, height = 300, loading = false, rotation = 0) {
  return new ImageNode(src, width, height, loading, rotation);
}
