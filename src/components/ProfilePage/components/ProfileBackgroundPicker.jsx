import React, { useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { BarLoader } from "react-spinners";
import Cropper from "react-easy-crop";
import GifBackgroundPreview from "./GifBackgroundPreview";

const TABS = [
    { id: "gradient", label: "Gradient" },
    { id: "image", label: "Image" },
    { id: "gif", label: "GIF" },
];

const ProfileBackgroundPicker = ({
    show,
    handleBgOnchange,
    bgInputRef,
    gradients,
    gradientPicked,
    handleSelectGradient,
    handleInsertBgImage,
    imageSrc,
    crop,
    zoom,
    setCrop,
    setZoom,
    setCropAreaPixels,
    handleRemoveBgPreview,
    handleHideGradientPicker,
    handleSaveProfileConfig,
    isUpdatingProfileConfig,
    // GIF background props
    gifInputRef,
    handleInsertGif,
    handleGifInputChange,
    pendingGifFile,
    handleRemoveGif,
    onOpenGifCreator,
    gifError,
}) => {
    const [activeTab, setActiveTab] = useState("gradient");

    if (!show) {
        return null;
    }

    return (
        <AnimatePresence>
            <Motion.div
                key="profile-bg-picker-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="profile-bg-picker-backdrop"
                onClick={(e) => handleHideGradientPicker(e)}
            >
                <Motion.div
                    initial={{ opacity: 0, scale: 0.94, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 8 }}
                    transition={{ type: "spring", stiffness: 250, damping: 25 }}
                    className="profile-bg-picker-container"
                    onClick={(e) => e.stopPropagation()}
                >
                <div className="profile-bg-picker-header">Pick a background</div>

                <div className="profile-bg-tabs" role="tablist" aria-label="Background type">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={activeTab === tab.id}
                            className={`profile-bg-tab${activeTab === tab.id ? " is-active" : ""}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <input
                    onChange={(e) => handleBgOnchange(e)}
                    style={{ display: "none" }}
                    ref={bgInputRef}
                    type="file"
                    accept="image/*"
                />
                <input
                    onChange={(e) => handleGifInputChange?.(e)}
                    style={{ display: "none" }}
                    ref={gifInputRef}
                    type="file"
                    accept="image/gif"
                />

                {activeTab === "gradient" && (
                    <div className="profile-bg-color-palette">
                        {gradients.map((gradient, index) => {
                            const isSelected =
                                gradientPicked &&
                                JSON.stringify(gradientPicked) === JSON.stringify(gradient.style);
                            return (
                                <div
                                    onClick={() => handleSelectGradient(gradient.style)}
                                    key={index}
                                    className={`gradient-box${isSelected ? " gradient-selected" : ""}`}
                                    style={gradient.style}
                                ></div>
                            );
                        })}
                    </div>
                )}

                {activeTab === "image" && (
                    <div className="profile-bg-preview">
                        <div onClick={(e) => handleInsertBgImage(e)} className="add-bgImage-bttn">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="50px"
                                viewBox="0 -960 960 960"
                                width="50px"
                                fill="currentColor"
                            >
                                <path d="M480-480ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h320v80H200v560h560v-320h80v320q0 33-23.5 56.5T760-120H200Zm40-160h480L570-480 450-320l-90-120-120 160Zm440-320v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80Z" />
                            </svg>
                        </div>
                        {imageSrc && (
                            <>
                                <Cropper
                                    image={imageSrc}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={16 / 9}
                                    onCropChange={setCrop}
                                    onZoomChange={setZoom}
                                    onCropComplete={(_, croppedPixels) => setCropAreaPixels(croppedPixels)}
                                />
                                <div className="controls">
                                    <input
                                        type="range"
                                        min={1}
                                        max={3}
                                        step={0.1}
                                        value={zoom}
                                        onChange={(e) => setZoom(e.target.value)}
                                    />
                                </div>
                                <div onClick={() => handleRemoveBgPreview()} className="remove-bg-preview">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        height="24px"
                                        viewBox="0 -960 960 960"
                                        width="24px"
                                        fill="currentColor"
                                    >
                                        <path d="m336-280-56-56 144-144-144-143 56-56 144 144 143-144 56 56-144 143 144 144-56 56-143-144-144 144Z" />
                                    </svg>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === "gif" && (
                    <div className="profile-bg-gif">
                        <p className="profile-bg-gif-note">
                            GIF backgrounds are for motion only. Keep it subtle for readability.
                        </p>

                        {pendingGifFile ? (
                            <div className="profile-bg-gif-preview">
                                <GifBackgroundPreview file={pendingGifFile} onRemove={handleRemoveGif} />
                            </div>
                        ) : (
                            <div className="profile-bg-gif-actions">
                                <button
                                    type="button"
                                    className="profile-bg-gif-btn"
                                    onClick={(e) => handleInsertGif?.(e)}
                                >
                                    Upload GIF
                                </button>
                                <button
                                    type="button"
                                    className="profile-bg-gif-btn profile-bg-gif-btn--create"
                                    onClick={() => onOpenGifCreator?.()}
                                >
                                    Create GIF
                                </button>
                            </div>
                        )}

                        {gifError && <div className="profile-bg-gif-error">{gifError}</div>}
                    </div>
                )}

                <div className="cancel-save-container">
                    <div onClick={(e) => handleHideGradientPicker(e)} className="cancel-button">
                        Cancel
                    </div>
                    <div
                        onClick={() => handleSaveProfileConfig()}
                        className={`save-button${isUpdatingProfileConfig ? " is-saving" : ""}`}
                    >
                        {isUpdatingProfileConfig ? "Saving..." : "Save"}
                    </div>
                </div>

                {isUpdatingProfileConfig && (
                    <BarLoader
                        loading={isUpdatingProfileConfig}
                        width={"100%"}
                        color="var(--accent-purple)"
                        speedMultiplier={0.7}
                    />
                )}
                </Motion.div>
            </Motion.div>
        </AnimatePresence>
    );
};

export default ProfileBackgroundPicker;
