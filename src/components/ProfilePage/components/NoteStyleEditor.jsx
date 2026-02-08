import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ALLOWED_BORDER_STYLES, ALLOWED_FONT_FAMILIES, DEFAULT_NOTE_CONTAINER_STYLE } from "../../../utils/profileLayout/constants";

const NoteStyleEditor = ({ containerStyle, fontColor, fontFamily, onSave, onClose }) => {
    const [style, setStyle] = useState({
        ...DEFAULT_NOTE_CONTAINER_STYLE,
        ...containerStyle,
    });
    const [noteFont, setNoteFont] = useState(fontColor || "#000000");
    const [noteFontFamily, setNoteFontFamily] = useState(fontFamily || "inherit");

    const bgColorRef = useRef();
    const borderColorRef = useRef();
    const fontColorRef = useRef();

    const handleSave = () => {
        onSave({
            containerStyle: style,
            fontColor: noteFont,
            fontFamily: noteFontFamily,
        });
    };

    return (
        <div className="note-style-editor-overlay" onClick={onClose}>
            <motion.div
                className="note-style-editor"
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
                <h3>Container Style</h3>

                {/* Preview */}
                <div
                    className="style-preview-box"
                    style={{
                        backgroundColor: style.bgColor,
                        borderColor: style.borderColor,
                        borderWidth: `${style.borderWidth}px`,
                        borderStyle: style.borderStyle,
                        borderRadius: `${style.borderRadius}px`,
                        color: noteFont,
                        fontFamily: noteFontFamily === "inherit" ? undefined : noteFontFamily,
                    }}
                >
                    Preview text
                </div>

                {/* Background Color */}
                <div className="style-field">
                    <label>Background Color</label>
                    <div className="style-field-row">
                        <div
                            className="style-color-preview"
                            style={{ backgroundColor: style.bgColor }}
                            onClick={() => bgColorRef.current?.click()}
                        />
                        <input
                            ref={bgColorRef}
                            type="color"
                            className="style-color-input"
                            value={style.bgColor.startsWith("#") ? style.bgColor : "#ffffff"}
                            onChange={(e) => setStyle({ ...style, bgColor: e.target.value })}
                        />
                        <span className="style-range-value">{style.bgColor}</span>
                    </div>
                </div>

                {/* Border Color */}
                <div className="style-field">
                    <label>Border Color</label>
                    <div className="style-field-row">
                        <div
                            className="style-color-preview"
                            style={{ backgroundColor: style.borderColor }}
                            onClick={() => borderColorRef.current?.click()}
                        />
                        <input
                            ref={borderColorRef}
                            type="color"
                            className="style-color-input"
                            value={style.borderColor}
                            onChange={(e) => setStyle({ ...style, borderColor: e.target.value })}
                        />
                    </div>
                </div>

                {/* Border Width */}
                <div className="style-field">
                    <label>Border Width</label>
                    <div className="style-field-row">
                        <input
                            type="range"
                            className="style-range-input"
                            min="0"
                            max="10"
                            step="1"
                            value={style.borderWidth}
                            onChange={(e) => setStyle({ ...style, borderWidth: Number(e.target.value) })}
                        />
                        <span className="style-range-value">{style.borderWidth}px</span>
                    </div>
                </div>

                {/* Border Style */}
                <div className="style-field">
                    <label>Border Style</label>
                    <select
                        className="style-select"
                        value={style.borderStyle}
                        onChange={(e) => setStyle({ ...style, borderStyle: e.target.value })}
                    >
                        {ALLOWED_BORDER_STYLES.map((s) => (
                            <option key={s} value={s}>
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Border Radius */}
                <div className="style-field">
                    <label>Border Radius</label>
                    <div className="style-field-row">
                        <input
                            type="range"
                            className="style-range-input"
                            min="0"
                            max="50"
                            step="1"
                            value={style.borderRadius}
                            onChange={(e) => setStyle({ ...style, borderRadius: Number(e.target.value) })}
                        />
                        <span className="style-range-value">{style.borderRadius}px</span>
                    </div>
                </div>

                {/* Font Color */}
                <div className="style-field">
                    <label>Font Color</label>
                    <div className="style-field-row">
                        <div
                            className="style-color-preview"
                            style={{ backgroundColor: noteFont }}
                            onClick={() => fontColorRef.current?.click()}
                        />
                        <input
                            ref={fontColorRef}
                            type="color"
                            className="style-color-input"
                            value={noteFont}
                            onChange={(e) => setNoteFont(e.target.value)}
                        />
                    </div>
                </div>

                {/* Font Family */}
                <div className="style-field">
                    <label>Font Family</label>
                    <select
                        className="style-select"
                        value={noteFontFamily}
                        onChange={(e) => setNoteFontFamily(e.target.value)}
                    >
                        {ALLOWED_FONT_FAMILIES.map((f) => (
                            <option key={f} value={f} style={{ fontFamily: f === "inherit" ? undefined : f }}>
                                {f === "inherit" ? "Default" : f}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Actions */}
                <div className="note-style-actions">
                    <button className="note-style-cancel-btn" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="note-style-save-btn" onClick={handleSave}>
                        Apply
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default NoteStyleEditor;
