
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
    console.log(userData)
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