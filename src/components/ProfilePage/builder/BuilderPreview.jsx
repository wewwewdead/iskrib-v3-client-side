import { profileThemeToCssVars, isSectionVisible } from "./profileThemeUtils";
import StickerLayer from "./StickerLayer";
import formatCounts from "../../../../helpers/fomatCounts";

/**
 * Live preview of the profile hero as the draft theme is edited.
 * Stickers are editable here (drag to move, remove). Background is the user's
 * existing profile background so the preview matches the real page.
 */
const BuilderPreview = ({ theme, userData, followerCount, followingCount, onStickersChange }) => {
    const cssVars = profileThemeToCssVars(theme, userData);
    const background = userData?.background || null;

    const showStats = isSectionVisible(theme, "stats");
    const showBio = isSectionVisible(theme, "bio");
    const showJoined = isSectionVisible(theme, "joined_date");

    return (
        <div className="pt-preview-wrap pt-scope" style={cssVars}>
            <div className="pt-preview-surface" style={background || undefined}>
                <StickerLayer
                    stickers={theme.stickers}
                    editable
                    onChange={onStickersChange}
                    accentColor={theme.colors.accent}
                />

                <div className="pt-preview-hero hero-section" style={{ background: "transparent", border: "none" }}>
                    <div className="profile-top-row">
                        <div className="profile-avatar-ring">
                            <img
                                className="my-profile-image"
                                src={userData?.image_url || "/assets/profile.jpg"}
                                alt=""
                            />
                        </div>
                        {showStats && (
                            <div className="profile-stats-container">
                                <div className="profile-stat-item">
                                    <span className="stat-number">{formatCounts(followerCount)}</span>
                                    <span className="stat-label">Followers</span>
                                </div>
                                <div className="profile-stat-item">
                                    <span className="stat-number">{formatCounts(followingCount)}</span>
                                    <span className="stat-label">Following</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="profile-name-container">
                        <div className="profile-name-row">
                            <p className="profile-name">{userData?.name || "Your name"}</p>
                        </div>
                        {userData?.username && <p className="profile-user-handle">@{userData.username}</p>}
                    </div>

                    {showBio && (
                        <div className="profile-bio-container">
                            <p className="profile-bio">{userData?.bio || "Your bio appears here."}</p>
                        </div>
                    )}

                    {showJoined && userData?.created_at && (
                        <div className="visited-profile-joined-date">
                            <p className="visited-profile-date-joined">
                                {new Date(userData.created_at).toLocaleDateString("en-US", {
                                    month: "long",
                                    day: "2-digit",
                                    year: "numeric",
                                })}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BuilderPreview;
