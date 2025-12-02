

export const handleCLickContent = (navigate) => {
    return (e, jsonbContent,wholeText, title, userId, name, avatar, created_at, journalId, isLiked, commentsCount, isBookmarked, likesCount, bookmarksCount) => {
    e.stopPropagation()

    navigate('/home/contentViewer', {
        state: {
            content: jsonbContent,
            wholeText: wholeText,
            title: title,
            userId: userId,
            name: name,
            avatar: avatar,
            created_at: created_at,
            journalId: journalId,
            isLiked: isLiked, 
            commentsCount: commentsCount,
            isBookmarked: isBookmarked,
            likesCount: likesCount,
            bookmarksCount: bookmarksCount,
        }
    })
    }
    
}

export const handleClickProfile = (navigate) => {
    return(e, loggedInUserId, clickedUserId) =>{
        if(loggedInUserId === clickedUserId){
            navigate('/profile');
        } else {
            navigate('/visitProfile', {
                state: {
                    userId: clickedUserId
                }
            })
        }
    }
}
