import React from "react";

const ProfileTabList = ({ tablists, navigate, location }) => {
    return (
        <div className="my-profile-tablist">
            {tablists.map((tab, index) => (
                <div onClick={() => navigate(tab.path)} className={"tab-container"} key={index}>
                    {tab.label}
                    <div className={location.pathname === tab.path ? "tab-indicator" : ""}></div>
                </div>
            ))}
        </div>
    );
};

export default ProfileTabList;
