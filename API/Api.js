
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
export const getUserData = async(token) =>{
    const headers = {}
    if(token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}/getUserData`, {
        method: 'GET',
        headers: headers
    })
    if(!response.ok){
        const error = await response.json()
        throw new Error(error || 'Failed to fetch user data');
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
export const deleteJournalImage = async(token, url) => {
    let img_url = ''
    let data = {};
    if(url){
        img_url = url.split('/journal-images/').pop()
        if(img_url){
            data = {
                filepath: img_url
            }

        }
        console.log(url.split('/journal-images/').pop(),'url') //pop() method will remove the last element in the array and returns it;
        //in that case i can get the fileName e.g https://hufaxmqdofaycnhdzrxf.supabase.co/storage/v1/object/public/journal-images/user_id_7ceaa0ad-0266-4966-bfe6-ec152b2d9f75/1760963803951_4720148b-c85b-4af3-99e0-dd2ce87c10b0.webp
    }
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

export const getJournals = async(cursor = null, limit = 5) =>{
    try {
        const url = cursor 
        ? `${BASE_URL}/journals?limit=${limit}&&before=${cursor}`
        : `${BASE_URL}/journals?limit=${limit}`;

        const response = await fetch(url, {
            method: 'GET'
        });

        if(!response.ok){
            throw new Error('Failed to fetch journals');
        }

        const data = await response.json();
        console.log(data)
        return data;
    } catch (error) {
        console.error('Error fetching journals:', error);
        throw error;
    }
}