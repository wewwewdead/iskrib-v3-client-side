import { useNavigate } from 'react-router-dom';
import './sidebar.css'
import React, { useEffect, useState, useRef } from "react";

const Sidebar = () =>{
    const navigate = useNavigate(null)
    const links = [
        {path: '/home', label: 'Home', action: ()=> navigate('/home'), icon: <svg xmlns="http://www.w3.org/2000/svg" height="34px" viewBox="0 -960 960 960" width="34px" fill="#ffffffff"><path d="M240-200h120v-240h240v240h120v-360L480-740 240-560v360Zm-80 80v-480l320-240 320 240v480H520v-240h-80v240H160Zm320-350Z"/></svg>},
        {path: '/profile', label: 'Profile', action: ()=> navigate('/profile'), icon: <svg xmlns="http://www.w3.org/2000/svg" height="34px" viewBox="0 -960 960 960" width="34px" fill="#ffffffff"><path d="M234-276q51-39 114-61.5T480-360q69 0 132 22.5T726-276q35-41 54.5-93T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 59 19.5 111t54.5 93Zm246-164q-59 0-99.5-40.5T340-580q0-59 40.5-99.5T480-720q59 0 99.5 40.5T620-580q0 59-40.5 99.5T480-440Zm0 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q53 0 100-15.5t86-44.5q-39-29-86-44.5T480-280q-53 0-100 15.5T294-220q39 29 86 44.5T480-160Zm0-360q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm0-60Zm0 360Z"/></svg>},
        {path: '/boomark', label: 'Bookmarks', action: ()=> navigate('/bookmark'), icon: <svg xmlns="http://www.w3.org/2000/svg" height="34px" viewBox="0 -960 960 960" width="34px" fill="#FFFFFF"><path d="M200-120v-640q0-33 23.5-56.5T280-840h400q33 0 56.5 23.5T760-760v640L480-240 200-120Zm80-122 200-86 200 86v-518H280v518Zm0-518h400-400Z"/></svg>}
    ]
    return(
        <>
        <div className='side-bar-container'>
            <div className='sidebar-header'>
                Iskrib
            </div>
            {links.map((link, index) => (
                <div className={location.pathname === link.path ? 'sidebar-links-active' : 'sidebar-links'} onClick={link.action} key={index}>
                    {link.icon}
                    {link.label}
                </div>
            ))}
        </div>
        </>
    )
}
export default Sidebar;