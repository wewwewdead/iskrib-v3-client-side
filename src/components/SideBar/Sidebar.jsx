import { useNavigate } from 'react-router-dom';
import './sidebar.css'
import React, { useEffect, useState, useRef } from "react";
import { useAuth } from '../../Context/Authcontext';

const Sidebar = ({links}) =>{
    const {user, session, signOut} = useAuth();
    const navigate = useNavigate(null)
    

    const userData = user?.userData?.[0];
    return(
        <>
        <div className='side-bar-container'>
            <div className='sidebar-header'>
                Iskrib
            </div>
            {links.map((link, index) => (
                <div className={link.className ? link.className : location.pathname === link.path ? 'sidebar-links-active' : 'sidebar-links'} onClick={link.action} key={index}>
                    {link.icon}
                    {link.label}
                </div>
            ))}
            <div className='sidebar-user-container'>
                {userData && (
                    <>
                    <div className='sidebar-avatar-container'>
                        <img loading='lazy' className='sidebar-avatar' src={userData.imageUrl || '../src/assets/profile.jpg'} alt="" />

                        <div className='sidebar-metadata-container'>
                            <span className='sidebar-name'>{userData.name}</span>
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
        </div>
        </>
    )
}
export default Sidebar;