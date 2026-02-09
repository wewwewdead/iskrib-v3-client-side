import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './bgloader.css';

const Loader = ({ isLoading }) => {
    const [show, setShow] = useState(true);

    useEffect(() => {
        if (!isLoading) {
            // small delay before starting exit animation
            const timer = setTimeout(() => setShow(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isLoading]);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    className="splash-screen"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                >
                    <motion.div
                        className="splash-logo"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] }}
                    >
                        <svg
                            width="120"
                            height="120"
                            viewBox="0 0 120 120"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <text
                                x="50%"
                                y="50%"
                                dominantBaseline="central"
                                textAnchor="middle"
                                className="splash-text"
                            >
                                iSkrib
                            </text>
                        </svg>
                    </motion.div>

                    {/* subtle bottom progress bar like X */}
                    {isLoading && (
                        <div className="splash-progress-track">
                            <motion.div
                                className="splash-progress-bar"
                                initial={{ width: '0%' }}
                                animate={{ width: '70%' }}
                                transition={{ duration: 2, ease: 'easeOut' }}
                            />
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Loader;
