import './authmodal.css';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const AuthModal = ({isOpen, onClose}) => {
    const navigate = useNavigate();

    const handleLogin = () => {
        onClose();
        navigate('/login');
    }

    const handleSignUp = () => {
        onClose();
        navigate('/signUp');
    }

    if(!isOpen) return null;

    return(
        <AnimatePresence>
        <div className='auth-modal-overlay' onClick={onClose}>
            <motion.div
            className='auth-modal-container'
            onClick={(e) => e.stopPropagation()}
            initial={{opacity: 0, scale: 0.85}}
            animate={{opacity: 1, scale: 1, transition: {type: 'spring', stiffness: 260, damping: 20}}}
            exit={{opacity: 0, scale: 0.85, transition: {type: 'tween', duration: 0.15}}}
            >
                <button className='auth-modal-close' onClick={onClose}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>

                <div className='auth-modal-logo'>Iskrib</div>
                <p className='auth-modal-message'>Sign in to interact with posts</p>

                <div className='auth-modal-buttons'>
                    <button onClick={handleLogin} className='auth-modal-login-bttn'>Log in</button>
                    <button onClick={handleSignUp} className='auth-modal-signup-bttn'>Sign up</button>
                </div>
            </motion.div>
        </div>
        </AnimatePresence>
    )
}
export default AuthModal;
