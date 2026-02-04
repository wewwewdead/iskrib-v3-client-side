import './signup.css'
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from '../../utils/supabaseClient';
import Turnstile from 'react-turnstile'
import { useAuth } from '../../Context/useAuth';

const SITE_KEY = import.meta.env.VITE_SITE_KEY;

const SignUp = () => {
    const { session } = useAuth();

    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [showPass, setShowPass] = useState(false)
    const [errorMessage, setErrorMessage] = useState(null);
    const [isLoadingSignUp, setIsLoadingSignUp] = useState(false)
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();

    const [captchaToken, setCaptchaToken] = useState(null);

    const handleShowPass = (e) =>{
        e.preventDefault();
        setShowPass((prev) => !prev)
    }

    const handleSignUp = async(e) =>{
        e.preventDefault();
        setErrorMessage(null);
        setSuccessMessage('');
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

            const { error: error } = await supabase.auth.signUp({
                email: email,
                password: password
            })
            if(error.message){
                return setErrorMessage(error.message)
            }
            setSuccessMessage('Account created. Check your email to confirm.');
            setTimeout(() => navigate('/home'), 600);
        } catch (error) {
            console.error('Error during sign-up:', error.message);
            setErrorMessage(error.message);
        } finally {
            setEmail('');
            setPassword('');
            setIsLoadingSignUp(false)
        }

    }
    const handleNavigate = (e) => {
        e.preventDefault();
        return navigate('/login');
    }

    useEffect(() =>{
        if(session){
            return navigate('/home')
        }
    }, [session, navigate])

    const isSubmitDisabled = !email || !password || !captchaToken || isLoadingSignUp;

    return(
        <div className='auth-shell signup-shell'>
            <section className='auth-panel'>
                <div className='brand'>Iskrib</div>
                <h1 className='panel-title'>Create your quiet writing space.</h1>
                <p className='panel-copy'>
                    Keep your poems, journals, and reflections beautifully organized.
                </p>
                <div className='panel-details'>
                    Private drafts · Elegant publishing · Calm community
                </div>
            </section>

            <section className='auth-form-panel'>
                <div className='auth-form-card'>
                    <div>
                        <div className='form-title'>Create an account</div>
                        <p className='form-subtitle'>Start writing in minutes.</p>
                    </div>

                    <form className='auth-form' onSubmit={handleSignUp} aria-busy={isLoadingSignUp ? 'true' : 'false'}>
                        <div className='form-field'>
                            <label htmlFor='signup-email'>Email</label>
                            <div className='input-with-action'>
                                <input
                                    id='signup-email'
                                    maxLength={50}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className='auth-input'
                                    type='email'
                                    placeholder='you@iskrib.com'
                                    autoComplete='email'
                                    required
                                />
                                {email && (
                                    <div
                                        style={email.length >= 50 ? { color: 'rgb(184, 76, 76)' } : {}}
                                        className='length-counter'
                                    >
                                        {`${email.length}/50`}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className='form-field'>
                            <label htmlFor='signup-password'>Password</label>
                            <div className='input-with-action'>
                                <input
                                    id='signup-password'
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className='auth-input'
                                    type={showPass ? 'text' : "password"}
                                    placeholder='Create a password'
                                    autoComplete='new-password'
                                    required
                                />
                                <button className='show-toggle' type='button' onClick={handleShowPass}>
                                    {showPass ? 'Hide' : 'Show'}
                                </button>
                            </div>
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

                        <button className='primary-button' type='submit' disabled={isSubmitDisabled}>
                            <span className='button-label'>Create account</span>
                            {isLoadingSignUp && <span className='button-spinner' aria-hidden='true' />}
                        </button>

                        <button
                            className='secondary-button'
                            type='button'
                            onClick={() => navigate('/home')}
                            disabled={isLoadingSignUp}
                        >
                            Explore Iskrib
                        </button>
                    </form>

                    <div className='auth-footer'>
                        Have an account?
                        <button className='link-button' type='button' onClick={handleNavigate}>
                            Log in
                        </button>
                    </div>

                    {errorMessage && (
                        <div className='form-message error' role='alert'>
                            {errorMessage}
                        </div>
                    )}

                    {successMessage && (
                        <div className='form-message success' role='status'>
                            {successMessage}
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}
export default SignUp;
