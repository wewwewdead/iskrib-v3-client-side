// import { DecoratorNode } from "lexical";
// import ImageComponent from "../ImageComponent";
// import SimpleDecoratorComponent from "../simpleComponent";

// export default class ImageNode extends DecoratorNode {
//   static getType() {
//     return "image";
//   }

//   static clone(node) {
//     return new ImageNode(node.__src, node.__key);
//   }

//   constructor(src, key) {
//     super(key);
//     this.__src = src;
//   }

//   createDOM() {
//     return document.createElement("div");
//   }

//   updateDOM() {
//     return false;
//   }

//   exportJSON() {
//     return {
//       type: "image",
//       version: 1,
//       src: this.__src,
//     };
//   }

//   static importJSON(serializedNode) {
//     const { src } = serializedNode;
//     return new ImageNode(src);
//   }

//   decorate() {
//     // return <div>Test Content</div>;
    
//     console.log("ImageComponent is:", ImageComponent);
//     const src = this.__src;
//     const nodeKey = this.getKey();
//     return <ImageComponent src={src} nodeKey={nodeKey} />;
//   }
// }
// export function $createImageNode(src) {
//   return new ImageNode(src);
// }

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
      node.__key,
    );
  }

  constructor(src, width = 400, height = 300, key) {
    super(key);
    this.__src = src;
    this.__width = width;
    this.__height = height;
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
    const { src, width, height } = serializedNode;
    return $createImageNode(src, width, height); 
  }

  // update dimensions when user resizes
  setWidthAndHeight(width, height) {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
  }

  getWidth() {
    return this.__width;
  }

  getHeight() {
    return this.__height;
  }

  decorate() {
    const src = this.__src;
    const nodeKey = this.getKey();
    const width = this.__width;
    const height = this.__height
    return <ResizableImageComponent src={src} nodeKey={nodeKey} width={width} height={height}/>;
  }
}

//helper function to create ImageNode
export function $createImageNode(src, width = 400, height = 300) {
  return new ImageNode(src, width, height);
}
