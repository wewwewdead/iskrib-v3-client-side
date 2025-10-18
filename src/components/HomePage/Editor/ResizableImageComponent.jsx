import { useState, useRef, useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey } from 'lexical';

const ResizableImageComponent = ({ src ,nodeKey, width, height, }) => {
  const [editor] = useLexicalComposerContext();
  const [isResizing, setIsResizing] = useState(false);
  const [currentWidth, setCurrentWidth] = useState(width);
  const [currentHeight, setCurrentHeight] = useState(height);
  const [isSelected, setIsSelected] = useState(false);
  const imageRef = useRef(null);
  const startPosRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  //handle delete image from the editor
  const handleDelete = (e) =>{
    e.stopPropagation();
    editor.update(() =>{
        const node = editor.getEditorState()._nodeMap.get(nodeKey);
        try {
            node.remove();
        } catch (error) {
            console.error("Failed to remove image node:", error);
        }
    })
  }

  // handle mouse down on resize handle
  const handleMouseDown = (e, corner) => {
    // e.preventDefault();
    e.stopPropagation();
    
    const isTouchStart = e.type === 'touchstart';
    const clientX = isTouchStart ? e.touches[0].clientX : e.clientX;
    const clientY = isTouchStart ? e.touches[0].clientY : e.clientY;
    
    setIsResizing(true);
    startPosRef.current = {
      x: clientX,
      y: clientY,
      width: currentWidth || 300,
      height: currentHeight || 200,
    };

    const handleMouseMove = (moveEvent) => {
        const isTouchMove = moveEvent.type === 'touchmove'
        const moveX = isTouchMove ? moveEvent.touches[0].clientX : moveEvent.clientX;
        const moveY = isTouchMove ? moveEvent.touches[0].clientY : moveEvent.clientY;

        const deltaX = (moveX - startPosRef.current.x) / 8;
        const deltaY = (moveY - startPosRef.current.y) / 8;

        let newWidth, newHeight;

        if (corner === 'se') {
            // southeast corner - resize proportionally
            const aspectRatio =startPosRef.current.width / startPosRef.current.height;
            newWidth = Math.max(100, startPosRef.current.width + deltaX);
            newHeight = newWidth / aspectRatio;
        } else if (corner === 'e') {
            // east side - resize width only
            newWidth = Math.max(100, startPosRef.current.width + deltaX);
            newHeight = currentHeight;
        } else if (corner === 's') {
            // south side - resize height only
            newWidth = currentWidth;
            newHeight = Math.max(100, startPosRef.current.height + deltaY);
        } else if(corner === 'ne') {
            // northeast corner - resize proportionally
            const aspectRatio = startPosRef.current.width / startPosRef.current.height;
            newWidth = Math.max(100, startPosRef.current.width + deltaX)
            newHeight = newWidth / aspectRatio
        } else if (corner === 'sw') {
            // southwest corner - resize proportionally
            const aspectRatio = startPosRef.current.width / startPosRef.current.height;
            newWidth = Math.max(100, startPosRef.current.width - deltaX)
            newHeight = newWidth / aspectRatio
        } else if (corner === 'nw') {
            // northhwest corner - resize proportionally
            const aspectRatio = startPosRef.current.width / startPosRef.current.height;
            newWidth = Math.max(100, startPosRef.current.width - deltaX)
            newHeight = newWidth / aspectRatio
        }  else if(corner === 'n') {
            // south side - resize height only
            newWidth = currentWidth;
            newHeight = Math.max(100, startPosRef.current.height - deltaY);
        }

        const roundedWidth = Math.round(newWidth);
        const roundedHeight = Math.round(newHeight);

        setCurrentWidth(roundedWidth);
        setCurrentHeight(roundedHeight);
        startPosRef.current.width = roundedWidth;
        startPosRef.current.height = roundedHeight;
    };
    
    const handleMouseUp = () => {
        setIsResizing(false);

        const finalWidth = startPosRef.current.width;
        const finalHeight = startPosRef.current.height;

        console.log(`Saving: ${finalWidth}x${finalHeight}`);//for debugging
      
        // update the Lexical node with new dimensions
        editor.update(() => {
            const node = $getNodeByKey(nodeKey);
            if (node && typeof node.setWidthAndHeight === 'function') {
                node.setWidthAndHeight(finalWidth, finalHeight);
            }
        }, {
                onUpdate: () => {
                //forcing a statechange so if user resize the image it will update the editorstate
                editor.update(() =>{
                //empty because this i only used for triggering the OnChangePlugin
                    })
                }
            }
        );
        document.removeEventListener('touchmove', handleMouseMove)
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchend', handleMouseUp)
    };

    document.addEventListener('touchmove', handleMouseMove, {passive: false})
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleMouseUp)
};


  // handle image click for selection
  const handleImageClick = () => {
    setIsSelected(!isSelected);
  };

  // click outside to deselect
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (imageRef.current && !imageRef.current.contains(e.target)) {
        setIsSelected(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
    className='image-wrapper'
      ref={imageRef}
      style={{
        cursor: isResizing ? 'nwse-resize' : 'pointer',
      }}
      onClick={handleImageClick}
    >
      <img
        src={src}
        alt="content"
        style={{
          width: `${currentWidth}px`,
          height: `${currentHeight}px`,
          display: 'block',
          border: isSelected ? '1px solid rgba(153, 200, 255, 0.99)' : '2px solid transparent',
          borderRadius: '10px',
          userSelect: 'none',
        }}
        draggable={false}
      />

      <div onClick={(e) => handleDelete(e)} className='image-delete'>
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>
      </div>

      {isSelected && (
        <>
          {/* southeast corner handle - proportional resize */}
          <div
            onMouseDown={(e) => handleMouseDown(e, 'se')}
            onTouchStart={(e) => handleMouseDown(e, 'se')}
            className='southeast-side-handle'
          />

          {/* southwest corner handle - proportional resize */}
          <div
            onMouseDown={(e) => handleMouseDown(e, 'sw')}
            onTouchStart={(e) => handleMouseDown(e, 'sw')} 
            className='southwest-side-handle'
          />

          {/* northeast corner handle - proportional resize */}
          <div
            onMouseDown={(e) => handleMouseDown(e, 'ne')}
            onTouchStart={(e) => handleMouseDown(e, 'ne')} 
            className='northeast-side-handle'
          />

          {/* northwest corner handle - proportional resize */}
          <div
            onMouseDown={(e) => handleMouseDown(e, 'nw')}
            onTouchStart={(e) => handleMouseDown(e, 'nw')} 
            className='northwest-side-handle'
          />

          {/* east side handle - width only */}
          <div
            onMouseDown={(e) => handleMouseDown(e, 'e')}
            onTouchStart={(e) => handleMouseDown(e, 'e')} 
            className='east-side-handle'
          />

          {/* south side handle - height only */}
          <div
            onMouseDown={(e) => handleMouseDown(e, 's')}
            onTouchStart={(e) => handleMouseDown(e, 's')} 
            className='south-side-handle'
          />

           {/* north side handle - height only */}
          <div
            onMouseDown={(e) => handleMouseDown(e, 'n')}
            onTouchStart={(e) => handleMouseDown(e, 'n')} 
            className='north-side-handle'
          />

          {/* dimensions display */}
          <div
          className='dimension-display'
          >
            {currentWidth} × {currentHeight}
          </div>
        </>
      )}
    </div>
  );
}
export default ResizableImageComponent;