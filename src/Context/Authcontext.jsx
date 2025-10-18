import { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../utils/supabaseClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserData } from '../../API/Api';

const AuthContext = createContext();

export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    const queryClient = useQueryClient();

    const {data: authData} = useQuery({
        queryKey: ['authsession'],
        queryFn: async() =>{
            const {data, error} = await supabase.auth.getSession();
            if(error) throw error;
            return data.session
        },
        staleTime: 1000 * 60 * 60,
        cacheTime: 1000 * 60 * 60,
    })

    useEffect(() =>{
        let mounted = true;
        (async () =>{
            const {data} = await supabase.auth.getSession();
            if(mounted){
                queryClient.setQueryData(['authsession'], data?.session)
                setLoading(false)
            }
        })();

        //listen for login or logout events
        const {data: listener} = supabase.auth.onAuthStateChange((_event, session) => {
            if(mounted){
                queryClient.setQueryData(['authsession'], session ?? null);
            } 
        })
        return() => listener.subscription.unsubscribe();
        
    }, [])

    const {data: userData, isLoading} = useQuery({
            queryKey: ['userData', authData?.access_token],
            queryFn: ({queryKey}) => getUserData(queryKey[1]),
            enabled: !!authData?.access_token, //only runs if token exists
            staleTime: 1000 * 60 * 60,
            cacheTime: 1000 * 60 * 60,
        })

    const signOut = async() =>{
        await supabase.auth.signOut();
        queryClient.setQueryData(['authsession'], null)

    }

    const value = {
        session: authData,
        user: userData,
        loading: loading,
        isLoading: isLoading,
        signOut
    }
    return <AuthContext.Provider value={value}>
        {children}
    </AuthContext.Provider>
}
export const useAuth = () => useContext(AuthContext);