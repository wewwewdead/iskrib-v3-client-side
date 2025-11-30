
const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const checkUser = async(userId) => {
    const response = await fetch(`${BASE_URL}/check-user?userId=${userId}`,{
        method: 'GET',
    })

    if(!response.ok){
        const error = await response.json();
        throw new Error(error || 'failed to get user data')
    }
    const userData = await response.json()
    // console.log(userData)
    return userData;
}
export const submitProfileData = async(body, token)=>{
    const headers = {}
    if(token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}/upload-user-data`, {
        method: 'POST',
        headers: headers,
        body: body
    })
    if(!response.ok){
        const error = await response.json();
        throw new Error(error || 'Failed to upload data');
    }
    const data = await response.json();
    console.log(data)
    return data;
}

export const updateProfileData = async(body, token) => {
    if(body){
        console.log(body)
    }
    const headers = {};
    if(token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}/update-user-data`, {
        method: 'POST',
        headers: headers,
        body: body
    })
    if(!response.ok){
        const error = await response.json();
        throw new Error(error || 'failed to update profile data')
    }
    const data = await response.json();
    console.log(data)
}
export const getUserData = async(userId) =>{

    const response = await fetch(`${BASE_URL}/getUserData?userId=${userId}`, {
        method: 'GET',
    })
    if(!response.ok){
        const error = await response.json()
        throw new Error(error || 'Failed to fetch user data');
    }
     const data = await response.json();
     return data;
}
export const updateFontColor = async(token, fontColor) => {
    const headers = {};
    if(token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}/updateFontColor`, {
        method: 'POST',
        headers: headers,
        body: fontColor
    })

    if(!response.ok){
        const error = await response.json()
        throw new Error(error)
    }

    const data = await response.json();
    return data;
}

export const saveJournalImage = async(token, body) => {
    const headers = {};
    if(token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${BASE_URL}/save-journal-image`, {
        method: 'POST',
        body: body,
        headers: headers
    })
    if(!response.ok){
        const error = await response.json();
        throw new Error(error);
    }
    const data = await response.json();
    console.log(data)
    return data;
}
export const saveJournal = async(token, body) => {
    console.log(body)
    const headers = {}
    if(token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}/save-journal`, {
        method: 'POST',
        headers,
        body: body,
    })
    if(!response.ok){
        const error = await response.json();
        throw new Error(error);
    }
    const data = await response.json();
    console.log(data)
    return data;
}

export const updateJournal = async(token, body) => {
    const headers = {};
    if(token) headers['Authorization'] = `Bearer ${token}`;

    const response =  await fetch(`${BASE_URL}/update-journal`, {
        method: 'POST',
        headers: headers,
        body: body
    })

    if(!response.ok){
        const error = await response.json();
        throw new Error(error);
    }

    const message = await response.json();
    console.log(message)
    return message;
}

export const deleteJournalImage = async(token, url) => {
    console.log(url)
    let img_url = ''
    let data = {
        filepath: []
    };
    
    if(url.length){
        console.log(url.length)
        url.forEach(element => {
            data.filepath.push(element.split('/journal-images/').pop());
    });
       
        // img_url = url.split('/journal-images/').pop()
        // if(img_url){
        //     data = {
        //         filepath: img_url
        //     }

        // }
        // console.log(url.split('/journal-images/').pop(),'url') //pop() method will remove the last element in the array and returns it;
        //in that case i can get the fileName e.g https://hufaxmqdofaycnhdzrxf.supabase.co/storage/v1/object/public/journal-images/user_id_7ceaa0ad-0266-4966-bfe6-ec152b2d9f75/1760963803951_4720148b-c85b-4af3-99e0-dd2ce87c10b0.webp
    }

    console.log(data.filepath)
    const headers = {'Content-Type': 'application/json',}
    if(token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${BASE_URL}/delete-journal-images`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: headers
    })
    if(!response.ok){
        const error = await response.json();
        throw new Error(error);
    }
    const message = await response.json();
    console.log(message)
    return message;

}

export const getJournals = async(cursor = null, limit = 5, userId) =>{
    // console.log(userId)
    try {
        const url = cursor 
        ? `${BASE_URL}/journals?limit=${limit}&before=${cursor}&userId=${userId}`
        : `${BASE_URL}/journals?limit=${limit}&userId=${userId}`;

        const response = await fetch(url, {
            method: 'GET'
        });

        if(!response.ok){
            throw new Error('Failed to fetch journals');
        }

        const data = await response.json();
        // console.log(data)
        return data;
    } catch (error) {
        console.error('Error fetching journals:', error);
        throw error;
    }
}
export const getUserJournals = async(cursor = null, limit = 5, userId) =>{
    try {
        const url = cursor ? `${BASE_URL}/userJournals?limit=${limit}&before=${cursor}&userId=${userId}` : `${BASE_URL}/userJournals?limit=${limit}&userId=${userId}`;

        const response = await fetch(url, {
            method: 'GET'
        })
        
        if(!response.ok){
            throw new Error('failed to get response');
        }
        const data = await response.json();
        // console.log(data);
        return data
    } catch (error) {
        onsole.error('Error fetching user journals:', error);
        throw error;
    }
}

export const deleteJournal = async(journalId, token) =>{
    const headers = {};

    if(token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}/deleteJournal/${journalId}`, {
        method: 'delete',
        headers: headers
    })
    if(!response.ok){
        const error = await response.json();
        throw new Error(error);
    }
    const data = await response.json();
    console.log(data)
    return data;
}

export const clickLike = async(token, body) => {
    const headers = {'Content-Type': 'application/json'}; //use content type because it will receive a object type of data
    if(token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}/like`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body) //tringify the plain object
    })
    if(!response.ok){
        throw new Error('error adding like')
    }
    const message = await response.json();
    console.log(message)
    return message;
}

export const addComment = async(token, body) =>{
    const headers = {'Content-Type': 'application/json'};
    if(token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${BASE_URL}/addComment`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
    })
    if(!response.ok){
        const error = await response.json();
        throw new Error(error);
    }
    const data = await response.json();
    return data;
};
export const getComments = async(cursor= null, limit= 10, postId) =>{
    try {
        const url = cursor ? `${BASE_URL}/getComments?postId=${postId}&limit=${limit}&before=${cursor}` : `${BASE_URL}/getComments?postId=${postId}&limit=${limit}`;
        const response = await fetch(url, {
            method: 'GET'
        })

        if(!response.ok){
            throw new Error('failed to fetch comments');
        }
        const data = await response.json();
        // console.log(data);
        return data;
    } catch (error) {
        console.error('Error fetching comments:', error);
        throw error;
    }
}

export const addBookmark = async(token, journalId) =>{
    const headers = {'Content-Type': 'application/json'};
    if(token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}/addBoorkmark`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(journalId),
    })

    if(!response.ok){
        const error = await response.json();
        throw new Error('error:', error);
    }

    const message = await response.json();
    console.log(message);
    return message;
}

export const getBookmarks = async(cursor= null, limit= 5, userId) =>{
    const url = cursor ? `${BASE_URL}/getBookmarks?limit=${limit}&before=${cursor}&userId=${userId}` : `${BASE_URL}/getBookmarks?limit=${limit}&userId=${userId}`;
    const response = await fetch(url, {
        method: 'GET',
    })

    if(!response.ok){
        const error = await response.json();
        throw new Error(error);
    }
    const data = await response.json();
    return data;
}

export const addFollows = async(followsData) => {
    const headers ={'Content-Type': 'application/json'}
    const response = await fetch(`${BASE_URL}/addFollows`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(followsData),
    })

    if(!response.ok){
        const error = await response.json()
        throw new Error(error);
    }
    const data = await response.json();
    console.log(data);
    return data;
}

export const getFollowsData = async(loggedInUserId, userIdToFollow) =>{
    const response = await fetch(`${BASE_URL}/getFollowsData?userId=${userIdToFollow}&loggedInUserId=${loggedInUserId}`,{
        method: 'GET'
    })

    if(!response.ok){
        const error = await response.json();
        throw new Error(error);
    }
    const data = await response.json();
    // console.log(data)
    return data;
}

export const getNotificationsCount = async(userId) => {
    const response = await fetch(`${BASE_URL}/getCountNotifications?userId=${userId}`);
    if(!response.ok){
        const error = await response.json();
        throw new Error(error);
    }
    const data = await response.json();
    // console.log(data)
    return data;
}

export const getNotifications = async(token, cursor = null, limit = 5) =>{
    const headers = {}
    if(token) headers['Authorization'] = `Bearer ${token}`
    const url = cursor ? `${BASE_URL}/getNotifications?before=${cursor}&limit=${limit}` : `${BASE_URL}/getNotifications?limit=${limit}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: headers
    })
    if(!response){
        const error = await response.json();
        throw new Error(error);
    }
    const data = await response.json();
    return data;
}

export const readNotification = async(token, notifId) =>{
    const headers = {'Content-Type': 'application/json'};
    if(token) headers['Authorization'] = `Bearer ${token}`;
    
    const response = await fetch(`${BASE_URL}/readNotification`, {
        method: 'POST',
        body: JSON.stringify(notifId),
        headers: headers
    })

    if(!response.ok){
        const error = await response.json();
        throw new Error(error);
    }
    const message = await response.json();
    console.log(message)
    return message;
}

export const deleteNotification = async(token, notifId) =>{
    const headers = {};
    if(token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}/deleteNotification/${notifId}`, {
        method: 'DELETE',
        headers: headers
    })
    
    if(!response.ok){
        const error = await response.json();
        throw new Error(error);
    }
    const message = await response.json();
    console.log(message)
    return message;
}

export const getUnreadNotification = async(token, cursor, limit=5)=>{
    const headers = {};
    if(token)headers['Authorization'] = `Bearer ${token}`;

    const url = cursor ? `${BASE_URL}/getUnreadNotification?before=${cursor}&limit=${limit}` : `${BASE_URL}/getUnreadNotification?limit=${limit}`
    const response = await fetch(url, {
        method: 'GET',
        headers: headers
    })

    if(!response.ok){
        const error = await response.json();
        throw new Error(error);
    }
    const data = await response.json();
    // console.log(data);
    return data;
}

// export const getLikedPosts = async(token) =>{
//     const headers = {}
//     if(token) headers['Authorization'] = `Bearer ${token}`
//     try {
//         const response = await fetch(`${BASE_URL}/getLikes`, {
//             method: 'GET',
//             headers: headers
//         });
        
//         if(!response.ok){
//             throw new Error('Error fetching likes data')
//         }
//         const data = await response.json()
//         console.log(data)
//         return data
//     } catch (error) {
//         console.error('Error fetching likes data:', error);
//         throw error;
//     }
// }