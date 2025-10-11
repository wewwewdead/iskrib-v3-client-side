import './login.css';
import React, {useEffect, useState} from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from '../../Context/Authcontext.jsx';
import supabase from '../../utils/supabaseClient.js';
const LoginPage = () =>{
    const [showPass, setShowPass] = useState(false)
    const [password, setPassword] = useState(null)
    const [email, setEmail] = useState(null);
    const [errorMessage, setErrorMessage] = useState('')

    const {session} = useAuth();
    
    const navigate = useNavigate(null);
    const handleShowPass = (e) =>{
        e.stopPropagation();
        setShowPass(!showPass)
    }
    const handleNavigate = (e) =>{
        e.stopPropagation();
        return navigate('/signUp');
    }
    const handleLogin = async(e) =>{
        e.stopPropagation();
        try {
            const {error} = await supabase.auth.signInWithPassword({email: email, password: password})
            if(error){
                return setErrorMessage(error.message)
            }
            navigate('/home')
        } catch (error) {
            console.error('Error during sign-up:', error.message);
            setErrorMessage(error.message);
        } finally {
            setEmail(null);
            setPassword(null);
        }
    }

    useEffect(() =>{
        if(session){
            navigate('/home')
        }
    }, [session])
    return(
        <>
        <div className='login-page-container'>
            <div className='input-container'>
                <div className='input-container-child'>
                    <input value={email ? email : ''} onChange={(e) => setEmail(e.target.value)} className='login-input' type="text" placeholder='email'/>
                </div>
                <div className='input-container-child'>
                    <input value={password ? password : ''} onChange={(e) => setPassword(e.target.value)} className='login-input' type={showPass ? 'text' : 'password'} placeholder='password'/>
                    {password && (
                        <div onClick={(e) => handleShowPass(e)} className='show-bttn'>
                            {showPass ? 'hide' : 'show'}
                        </div>
                    )}
                    
                </div>
                
                <button onClick={(e) => handleLogin(e)} disabled={!password} className={!password ? 'log-in-bttn-disabled' : 'log-in-bttn'}>
                    Log in
                </button>
            </div>

            <div className='switch-container'>
                Don't have an account? <span onClick={(e) => handleNavigate(e)} className='sign-up-bttn'>Sign up</span>
            </div>

            {errorMessage && (
                <div className='error-message'>
                    {errorMessage}
                </div>  
            )}
        </div>

        <div className='login-logo'>
            Iskrib
        </div>
        </>
    )
}
export default LoginPage