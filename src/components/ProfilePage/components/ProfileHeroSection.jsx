import React, { useState } from "react";
import VerifiedBadge from "../../Badge/VerifiedBadge";
import StreakBadge from "../../Streak/StreakBadge";
import useStreakData from "../../Streak/useStreakData";
import formatCounts from "../../../../helpers/fomatCounts";
import ShareMenu from "../../ShareMenu/ShareMenu";
import { getProfileShareUrl } from "../../../utils/getShareUrl";
import StickerLayer from "../builder/StickerLayer";
import { isSectionVisible } from "../builder/profileThemeUtils";

const ProfileHeroSection = ({
    userData,
    user,
    fontColor,
    handleClickEdit,
    handleClickFontColorSelector,
    handleClickCustomize,
    croppedImage,
    gradientPicked,
    profileTheme,
}) => {
    const [showShareMenu, setShowShareMenu] = useState(false);
    const { data: streakData } = useStreakData(userData?.id);
    const showStats = isSectionVisible(profileTheme, "stats");
    const showBio = isSectionVisible(profileTheme, "bio");
    return (
        <div style={croppedImage || gradientPicked} className="hero-section">
            {profileTheme?.stickers?.length > 0 && (
                <StickerLayer stickers={profileTheme.stickers} accentColor={profileTheme?.colors?.accent} />
            )}
            <div className="profile-top-row">
                <div
                    className={`profile-avatar-ring ${userData?.badge === "legend" ? "badge-ring-legend" : userData?.badge === "og" ? "badge-ring-og" : ""}`}
                >
                    <img
                        className="my-profile-image"
                        loading="lazy"
                        src={userData?.image_url || "/assets/profile.jpg"}
                        alt={`${userData?.name || "User"} profile picture`}
                    />
                </div>
                {showStats && (
                    <div className="profile-stats-container">
                        <div className="profile-stat-item">
                            <span className="stat-number">{formatCounts(user?.followerCount)}</span>
                            <span className="stat-label">Followers</span>
                        </div>
                        <div className="profile-stat-item">
                            <span className="stat-number">{formatCounts(user?.followingCount)}</span>
                            <span className="stat-label">Following</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="profile-name-container">
                <div className="profile-name-row">
                    <p className="profile-name">{userData?.name}</p>
                    <VerifiedBadge badge={userData?.badge} size={22} />
                    <StreakBadge count={streakData?.current_streak} size={18} />
                    {userData?.badge && (
                        <span
                            className={`badge-pill ${userData.badge === "legend" ? "badge-pill-legend" : "badge-pill-og"}`}
                        >
                            {userData.badge === "legend" ? "Legend" : "OG"}
                        </span>
                    )}
                </div>
                {userData?.username && (
                    <p className="profile-user-handle">@{userData.username}</p>
                )}
            </div>

            {showBio && userData?.bio && (
                <div className="profile-bio-container">
                    <p className="profile-bio">{userData?.bio}</p>
                </div>
            )}

            <div className="profile-actions-row">
                <div onClick={(e) => handleClickEdit(e)} className="edit-profile-bttn" title="Edit your profile">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="20px"
                        viewBox="0 -960 960 960"
                        width="20px"
                        fill={fontColor || userData?.profile_font_color}
                    >
                        <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h357l-80 80H200v560h560v-278l80-80v358q0 33-23.5 56.5T760-120H200Zm280-360ZM360-360v-170l367-367q12-12 27-18t30-6q16 0 30.5 6t26.5 18l56 57q11 12 17 26.5t6 29.5q0 15-5.5 29.5T897-728L530-360H360Zm481-424-56-56 56 56ZM440-440h56l232-232-28-28-29-28-231 231v57Zm260-260-29-28 29 28 28 28-28-28Z" />
                    </svg>
                    Edit Profile
                </div>
                {handleClickCustomize && (
                    <button
                        type="button"
                        onClick={(e) => handleClickCustomize(e)}
                        className="pt-customize-btn"
                        title="Customize your profile"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="18px"
                            viewBox="0 -960 960 960"
                            width="18px"
                            fill={fontColor || userData?.profile_font_color}
                        >
                            <path d="m480-80-10-120h-10q-142 0-241-99T120-640q0-141 99-240t241-99q71 0 132.5 26.5t108 73Q847-833 873.5-771.5T900-639q0 141-99 240t-241 99h-10l10-120ZM320-440q33 0 56.5-23.5T400-520q0-33-23.5-56.5T320-600q-33 0-56.5 23.5T240-520q0 33 23.5 56.5T320-440Zm120-160q33 0 56.5-23.5T520-680q0-33-23.5-56.5T440-760q-33 0-56.5 23.5T360-680q0 33 23.5 56.5T440-600Zm160 0q33 0 56.5-23.5T680-680q0-33-23.5-56.5T600-760q-33 0-56.5 23.5T520-680q0 33 23.5 56.5T600-600Zm120 160q33 0 56.5-23.5T800-520q0-33-23.5-56.5T720-600q-33 0-56.5 23.5T640-520q0 33 23.5 56.5T720-440Z" />
                        </svg>
                        Customize
                    </button>
                )}
                <div onClick={(e) => handleClickFontColorSelector(e)} className="font-picker-container" title="Change font color">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="20px"
                        viewBox="0 -960 960 960"
                        width="20px"
                        fill={fontColor || userData?.profile_font_color}
                    >
                        <path d="M80 0v-160h800V0H80Zm140-280 210-560h100l210 560h-96l-50-144H368l-52 144h-96Zm176-224h168l-82-232h-4l-82 232Z" />
                    </svg>
                </div>
                {userData?.username && (
                    <div
                        className="font-picker-container"
                        style={{ position: 'relative' }}
                        title="Share profile"
                        onClick={(e) => { e.stopPropagation(); setShowShareMenu((v) => !v); }}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="20px"
                            viewBox="0 0 24 24"
                            width="20px"
                            fill={fontColor || userData?.profile_font_color}
                        >
                            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                        </svg>
                        {showShareMenu && (
                            <ShareMenu
                                url={getProfileShareUrl(userData.username)}
                                title={`${userData.name || userData.username}'s Profile`}
                                onClose={() => setShowShareMenu(false)}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileHeroSection;
