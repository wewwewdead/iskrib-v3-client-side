

export const handleCLickContent = (navigate) => {
    return (e, jsonbContent,wholeText, title, name, avatar, created_at, journalId, likes, commentsCount, bookmarks) => {
    e.stopPropagation();
    navigate('/home/contentViewer', {
        state: {
            content: jsonbContent,
            wholeText: wholeText,
            title: title,
            name: name,
            avatar: avatar,
            created_at: created_at,
            journalId: journalId,
            likes: likes,
            commentsCount: commentsCount,
            bookmarks: bookmarks
        }
    })
    }
    
}