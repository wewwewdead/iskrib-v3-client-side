import { AnimatePresence, motion } from "framer-motion";
import styles from "./PieMenu.module.css";

const RADIUS = 72;

const PieMenu = ({isOpen, position, items, onClose, isDark}) => {
    if(!isOpen || !position || !items?.length){
        return null;
    }

    const angleStep = (2 * Math.PI) / items.length;
    const startAngle = -Math.PI / 2;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className={`${styles.overlay} ${isDark ? styles.isDark : ""}`}
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    exit={{opacity: 0}}
                    transition={{duration: 0.15}}
                    onClick={onClose}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        onClose();
                    }}
                >
                    <div
                        className={styles.ring}
                        style={{left: position.x, top: position.y}}
                    >
                        {items.map((item, index) => {
                            const angle = startAngle + index * angleStep;
                            const x = Math.cos(angle) * RADIUS;
                            const y = Math.sin(angle) * RADIUS;

                            return (
                                <motion.button
                                    key={item.label}
                                    type="button"
                                    className={`${styles.item} ${item.isDelete ? styles.deleteItem : ""}`}
                                    style={{left: x, top: y}}
                                    initial={{scale: 0, opacity: 0}}
                                    animate={{scale: 1, opacity: 1}}
                                    exit={{scale: 0, opacity: 0}}
                                    transition={{
                                        type: "spring",
                                        stiffness: 420,
                                        damping: 22,
                                        delay: index * 0.03
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        item.action();
                                        onClose();
                                    }}
                                    title={item.label}
                                >
                                    {item.icon || item.label}
                                </motion.button>
                            );
                        })}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PieMenu;
