const CalculateText = (text) => {
    const wordPerMin = 250 //avg reading speed
    const words = text.trim().split(/\s+/).length; //split the it by spaces using /\s+/
    // console.log(words)
    const minutes = words/wordPerMin;
    const readingTime = Math.ceil(minutes);

    if(readingTime > 1){
        return `${readingTime} mins read`
    }

    return `${readingTime} min read`;
}

export default CalculateText;