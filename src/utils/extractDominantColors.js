const extractDominantColors = (imgElement) =>{
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const size = 50;
    canvas.width = size;
    canvas.height = size;

    ctx.drawImage(imgElement, 0, 0, size, size);

    try {
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;

        const colorMap = {};

        for(let i = 0; i < data.length; i += 4){
            const r = Math.floor(data[i] / 10) * 10;
            const g = Math.floor(data[i + 1] / 10) * 10;
            const b = Math.floor(data[i + 2] / 10) * 10;
            const a = data[i + 3];
            
            if(a < 125) continue;

            const key = `${r}, ${g}, ${b}`;;
            colorMap[key] = (colorMap[key] || 0) + 1
        }

        const sortedColors = Object.entries(colorMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2);

        if(sortedColors.length > 0){
            const [r1, g1, b1] = sortedColors[0][0].split(',').map(Number);
            const primary = `rgb(${r1}, ${g1}, ${b1})`;

            let secondary = primary;
            if (sortedColors.length > 1) {
                const [r2, g2, b2] = sortedColors[1][0].split(',').map(Number);
                secondary = `rgb(${r2}, ${g2}, ${b2})`;
            }

            return {primary, secondary};
        }

        return { primary: '#ffffffff', secondary: '#ffffffff' };
    } catch (error) {
        console.error('Error extracting color:', e);
        return { primary: '#ffffffff' , secondary: '#ffffffff'  };
    }
}

export default extractDominantColors;