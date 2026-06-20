import React from "react";
import { motion } from "framer-motion";
import "./profileCompletion.css";

/**
 * Strong (but non-modal) activation banner shown to owners who have not yet
 * created a profile_theme. Opens the existing Profile Builder via onCustomize.
 */
const NewUserCustomizeCTA = ({ onCustomize }) => {
    return (
        <motion.section
            className="nucta-card"
            aria-label="Customize your profile"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
            <div className="nucta-glow" aria-hidden="true" />
            <div className="nucta-body">
                <span className="nucta-eyebrow">Your room is empty</span>
                <h3 className="nucta-title">Make your profile yours</h3>
                <p className="nucta-sub">
                    Choose a vibe, pick your colors, and turn this page into a space people
                    remember. It only takes a minute.
                </p>
                <button type="button" className="nucta-btn" onClick={() => onCustomize?.()}>
                    Open Profile Builder
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>
            <div className="nucta-swatches" aria-hidden="true">
                <span style={{ background: "linear-gradient(135deg,#2a2440,#544a8a)" }} />
                <span style={{ background: "linear-gradient(135deg,#1d2b22,#3f7a5a)" }} />
                <span style={{ background: "linear-gradient(135deg,#3a2418,#bd7b32)" }} />
                <span style={{ background: "linear-gradient(135deg,#33202a,#a8516f)" }} />
            </div>
        </motion.section>
    );
};

export default NewUserCustomizeCTA;
