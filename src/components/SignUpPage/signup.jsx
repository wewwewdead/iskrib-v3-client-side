import './signup.css'
import React, {useEffect, useState} from "react";
import { useNavigate, Link } from "react-router-dom";
import supabase from '../../utils/supabaseClient';
import Turnstile from 'react-turnstile'
import { MoonLoader } from "react-spinners";
import { useAuth } from '../../Context/useAuth';

const SITE_KEY = import.meta.env.VITE_SITE_KEY;

const SignUp = () => {
    const {session, isLoading} = useAuth();

    const [password, setPassword] = useState(null);
    const [email, setEmail] = useState(null);
    const [showPass, setShowPass] = useState(false)
    const [errorMessage, setErrorMessage] = useState(null);
    const [isLoadingSignUp, setIsLoadingSignUp] = useState(false)
    const navigate = useNavigate(null);

    const [captchaToken, setCaptchaToken] = useState(null);

    const handleShowPass = (e) =>{
        e.stopPropagation();
        setShowPass(!showPass)
    }

    const handleSignUp = async(e) =>{
        e.stopPropagation()
        setIsLoadingSignUp(true)
        const validateEmail = (email) =>{
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email)
        }
        if(!validateEmail(email)){
            setIsLoadingSignUp(false)
           return setErrorMessage('Email is not valid')
        }
        if (!captchaToken) {
            setIsLoadingSignUp(false)
            return setErrorMessage("Please complete the CAPTCHA first.");
        }

        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/verify-turnstile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: captchaToken }),
            })

            const result = await res.json();

            if (!result.success) {
                return setErrorMessage("CAPTCHA verification failed. Try again.");
            }

            const {error: error} = await supabase.auth.signUp({
                email: email,
                password: password
            })
            if(error.message){
                return setErrorMessage(error.message)
            }
            navigate('/home')
        } catch (error) {
            console.error('Error during sign-up:', error.message);
            setErrorMessage(error.message);
        } finally {
            setEmail(null);
            setPassword(null);
            setIsLoadingSignUp(false)
        }

    }
    const handleNavigate = (e) => {
        e.stopPropagation();
        return navigate('/login');
    }
    useEffect(() =>{
        if(session){
            return navigate('/home')
        }
    }, [session])

    if(isLoadingSignUp){
        return(
            <div className='signup-loading-container'>
                <MoonLoader loading={isLoadingSignUp} size={20} speedMultiplier={1} color='rgba(157, 139, 254, 0.8)'/>
            </div>
        )
    }
    return(
        <div className='signup-page-wrapper'>
            <div className='signUp-logo'>
                Iskrib
            </div>
            <p className='signup-tagline'>Where your stories find their voice</p>

            <div className='signup-page-container'>
                <div className='input-container'>
                    <div className='input-container-child'>
                        <input maxLength={50} value={!email ? '' : email} onChange={(e) => setEmail(e.target.value)} className='signUp-input' type="email" placeholder='Email' aria-label='Email'/>
                        {email&&(
                            <div style={email.length >= 50 ? {color: 'rgb(200, 40, 40)'} : {}} className='length-counter'>
                                {`${email.length}/50`}
                            </div>
                        )}
                    </div>
                    <div className='input-container-child'>
                        <input value={!password ? '' : password} onChange={(e) => setPassword(e.target.value)} className='signUp-input' type={showPass ? 'text' : "password"} placeholder='Password' aria-label='Password'/>
                        {password && (
                            <div onClick={(e) => handleShowPass(e)} className='show-bttn'>
                                {showPass ? 'hide' : 'show'}
                            </div>
                        )}
                    </div>
                    <button onClick={(e) => handleSignUp(e)} disabled={!password} className={!password ? 'submit-bttn submit-bttn-disabled' : 'submit-bttn'}>
                        Submit
                    </button>
                </div>

                <div className='switch-container'>
                    Have an account? <span onClick={(e) => handleNavigate(e)} className='sign-in-bttn'>Log in</span>
                </div>

                <div className='captcha-container'>
                    <Turnstile
                    sitekey={SITE_KEY}
                    onVerify={(token) => setCaptchaToken(token)}
                    onExpire={() => setCaptchaToken(null)}
                    onError={() => setCaptchaToken(null)}
                    theme='light'
                    />
                </div>

                {errorMessage && (
                    <div className='error-message'>
                        {errorMessage}
                    </div>
                )}
            </div>
        </div>
    )
}
export default SignUp;
