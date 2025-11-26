const FormatNotificationType = (type) => {
    const notifType = type;

    const notificationTypeArray = {
        like: 'Liked your post',
        comment: 'Commented on your post',
        follow: 'Follows you'
    }

    return notificationTypeArray[type] || 'Unknown notification'
}

export default FormatNotificationType;