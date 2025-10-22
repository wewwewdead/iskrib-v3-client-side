const ParseContent = (contentString) => {
    try {
        const content = JSON.parse(contentString);
        const root = content.root;
        const children = root?.children || [];
            
        const parsedData = {
            text: [],
            images: [],
            firsImage: null,
        };

        children.forEach((node) => {
            if (node.type === 'paragraph' && node.children) {
                // extract text from paragraph
                const paragraphText = node.children
                    .filter(child => child.type === 'text')
                    .map(child => child.text)
                    .join(' ');
                    
                if (paragraphText.trim()) {
                    parsedData.text.push(paragraphText);
                }
                } else if (node.type === 'heading' && node.children) {
                    // extract text from heading
                    const headingText = node.children
                        .filter(child => child.type === 'text')
                        .map(child => child.text)
                        .join(' ');
                    
                    if (headingText.trim()) {
                        parsedData.text.push(headingText);
                    }
                } else if (node.type === 'image') {
                    // extract image data
                    const imageData = {
                        src: node.src,
                        width: node.width,
                        height: node.height
                    }
                    parsedData.images.push(imageData);

                    if(!parsedData.firsImage){
                        parsedData.firsImage = imageData;
                    }
                }
            });

            return parsedData;
        } catch (error) {
            console.error('Error parsing content:', error);
            return { text: [], images: [] };
        }
}
export default ParseContent;