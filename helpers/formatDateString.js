const formatPostDate = (dateString) =>{
    const date = new Date(dateString);
    const now = new Date();

    const diffInSecs = Math.floor((now - date) / 1000);

    if(diffInSecs < 86400){ // 86400 seconds = 24 hours
        if(diffInSecs < 60) return 'Just now';

        const minutes = Math.floor(diffInSecs / 60);

        if(minutes < 60) return `${minutes}mins ago`;

        const hour = Math.floor(minutes / 60);

        return `${hour} ago`;
    }

    return date.toLocaleDateString('en-Us', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    })


}

export default formatPostDate;