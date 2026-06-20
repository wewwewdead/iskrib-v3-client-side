import { useLocation, useNavigate } from 'react-router-dom';
import './sidebar.css'
import React, { useEffect, useState, useRef } from "react";
import { useAuth } from '../../Context/useAuth';
import { useTheme } from '../../Context/useTheme';
import VerifiedBadge from '../Badge/VerifiedBadge';
import StreakBadge from '../Streak/StreakBadge';
import useStreakData from '../Streak/useStreakData';

const Sidebar = ({links}) =>{
    const {user, session, signOut} = useAuth();
    const {theme, toggleTheme} = useTheme();
    const navigate = useNavigate(null)
    const location = useLocation();

    const userData = user?.userData?.[0];
    const { data: streakData } = useStreakData(userData?.id);
    return(
        <>
        <nav className='side-bar-container' role="navigation" aria-label="Main navigation">
            <div className='sidebar-header'>
                Iskrib
            </div>
            {links.map((link, index) => {
                const className = link.className ? link.className : location.pathname === link.path ? 'sidebar-links-active' : 'sidebar-links';
                const inner = (
                    <>
                        <div className='icon-container'>
                            {link.icon}
                            {link.notifCount && (
                                <div className='notification-count'>{link.notifCount}</div>
                            )}
                        </div>
                        {link.label}
                    </>
                );
                // Pure-navigation items become real anchors: open-in-new-tab,
                // middle-click, and keyboard/AT support for free. Plain left-click
                // is intercepted for client-side routing; modified clicks fall
                // through to the browser. Items without a path (e.g. Write) keep
                // their action handler but gain keyboard activation.
                if (link.path) {
                    return (
                        <a
                            href={link.path}
                            className={className}
                            key={index}
                            onClick={(e) => {
                                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                                e.preventDefault();
                                link.action?.();
                            }}
                        >
                            {inner}
                        </a>
                    );
                }
                return (
                    <div
                        className={className}
                        onClick={link.action}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); link.action?.(); } }}
                        key={index}
                    >
                        {inner}
                    </div>
                );
            })}
            <div className='sidebar-theme-toggle' onClick={toggleTheme}>
                <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
                <div className={`theme-toggle-track ${theme === 'dark' ? 'active' : ''}`}>
                    <div className='theme-toggle-thumb'/>
                </div>
            </div>
            <div className='sidebar-user-container'>
                {userData && (
                    <>
                    <div className='sidebar-avatar-container'>
                        <img loading='lazy' className='sidebar-avatar' src={userData.image_url || '/assets/profile.jpg'} alt={`${userData?.name || "User"} profile picture`} />

                        <div className='sidebar-metadata-container'>
                            <span className='sidebar-name'>{userData.name}<VerifiedBadge badge={userData.badge} size={14} /><StreakBadge count={streakData?.current_streak} size={14} /></span>
                            <span className='sidebar-email'>{session?.user.email}</span>
                        </div>
                    </div>
                    <div className='side-bar-logout-container'>
                        <div onClick={signOut}>
                            Sign Out
                        </div>
                    </div>
                    </>                  
                )}
            </div>
        </nav>
        </>
    )
}
export default Sidebar;
