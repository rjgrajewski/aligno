import { useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

function SwipePreviewCard({ skill, onSwipe }) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-10, 10]);

    const rightOpacity = useTransform(x, [30, 120], [0, 1]);
    const leftOpacity = useTransform(x, [-30, -120], [0, 1]);
    const downOpacity = useTransform(y, [30, 120], [0, 1]);
    const upOpacity = useTransform(y, [-30, -120], [0, 1]);

    const handleDragEnd = (_, info) => {
        const dragX = info.offset.x;
        const dragY = info.offset.y;
        const absX = Math.abs(dragX);
        const absY = Math.abs(dragY);
        const threshold = 100;
        const velocityThreshold = 500;

        let direction = null;

        if (absX > absY) {
            if (dragX > threshold || info.velocity.x > velocityThreshold) direction = 'right';
            else if (dragX < -threshold || info.velocity.x < -velocityThreshold) direction = 'left';
        } else {
            if (dragY > threshold || info.velocity.y > velocityThreshold) direction = 'down';
            else if (dragY < -threshold || info.velocity.y < -velocityThreshold) direction = 'up';
        }

        if (direction) {
            onSwipe(direction, skill.name);
        }
    };

    const words = skill.name.split(/\s+/);
    const maxWordLength = Math.max(...words.map((word) => word.length));

    let fontSize = 'clamp(1.8rem, 10vw, 2.8rem)';
    if (maxWordLength >= 14) {
        fontSize = 'clamp(1.1rem, 5vw, 1.5rem)';
    } else if (maxWordLength >= 11) {
        fontSize = 'clamp(1.3rem, 6vw, 1.8rem)';
    } else if (maxWordLength >= 9) {
        fontSize = 'clamp(1.5rem, 7.5vw, 2.2rem)';
    } else if (skill.name.length > 12) {
        fontSize = 'clamp(1.6rem, 8vw, 2.4rem)';
    }

    return (
        <motion.div
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{ width: '100%', maxWidth: '320px', height: '420px', maxHeight: '70vh' }}
        >
            <motion.div
                style={{
                    width: '100%',
                    height: '100%',
                    background: 'var(--bg-elevated)',
                    borderRadius: '24px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1px solid var(--border)',
                    x,
                    y,
                    rotate,
                    cursor: 'grab',
                }}
                drag
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                dragElastic={0.8}
                onDragEnd={handleDragEnd}
                whileTap={{ cursor: 'grabbing' }}
            >
                <div style={{ textAlign: 'center', padding: '1.5rem', width: '100%', boxSizing: 'border-box' }}>
                    <h2
                        style={{
                            fontSize,
                            fontWeight: 800,
                            overflowWrap: 'break-word',
                            wordBreak: 'normal',
                            lineHeight: 1.1,
                            margin: 0,
                        }}
                    >
                        {skill.name}
                    </h2>
                    {skill.frequency > 0 && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '0.5rem' }}>
                            Mentioned in {skill.frequency} jobs
                        </p>
                    )}
                </div>

                <motion.div style={overlayStyles.right(rightOpacity)}>
                    <div style={stampStyles('var(--accent-cyan)', '-10deg', '2.2rem')}>GOT IT</div>
                </motion.div>

                <motion.div style={overlayStyles.left(leftOpacity)}>
                    <div style={stampStyles('#888', '10deg', '2.2rem')}>SKIP</div>
                </motion.div>

                <motion.div style={overlayStyles.down(downOpacity)}>
                    <div style={stampStyles('var(--accent-red)', '0deg', '2rem')}>AVOID</div>
                </motion.div>

                <motion.div style={overlayStyles.up(upOpacity)}>
                    <div style={stampStyles('#00e676', '0deg', '2rem')}>SHOW OFF</div>
                </motion.div>
            </motion.div>
        </motion.div>
    );
}

export default function SkillSwipeOverlay({ skill, onSwipe, onClose }) {
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onClose?.();
                return;
            }

            if (!['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
                return;
            }

            event.preventDefault();

            if (event.key === 'ArrowRight') onSwipe?.('right', skill.name);
            else if (event.key === 'ArrowLeft') onSwipe?.('left', skill.name);
            else if (event.key === 'ArrowUp') onSwipe?.('up', skill.name);
            else if (event.key === 'ArrowDown') onSwipe?.('down', skill.name);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, onSwipe, skill.name]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1800,
                background: 'rgba(0,0,0,0.78)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
                padding: '1.5rem',
            }}
        >
            <button
                onClick={(event) => {
                    event.stopPropagation();
                    onClose?.();
                }}
                style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                    borderRadius: '999px',
                    width: '42px',
                    height: '42px',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                }}
            >
                x
            </button>
            <p style={{ margin: 0, color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem' }}>
                Swipe or use arrow keys to classify this skill.
            </p>
            <div onClick={(event) => event.stopPropagation()}>
                <SwipePreviewCard skill={skill} onSwipe={onSwipe} />
            </div>
        </motion.div>
    );
}

export function SwipeDirectionConfirmModal({ action, onConfirm, onUndo }) {
    const [dontShowAgain, setDontShowAgain] = useState(false);

    const configs = {
        up: { label: 'SHOW OFF', color: '#00e676', rotation: '0deg', desc: 'Places the skill on your CV and improves job matches.' },
        right: { label: 'GOT IT', color: 'var(--accent-cyan)', rotation: '-10deg', desc: 'Improves job matches but remains invisible in your CV.' },
        down: { label: 'AVOID', color: 'var(--accent-red)', rotation: '0deg', desc: 'Eliminates matches with job listings that require the skill.' },
        left: { label: 'SKIP', color: '#888', rotation: '10deg', desc: 'Skips the skill without affecting job matches or your CV.' },
    };

    const config = configs[action.direction];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 2000,
                background: 'rgba(0,0,0,0.85)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.5rem',
            }}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                style={{
                    background: 'var(--bg-elevated)',
                    width: '100%',
                    maxWidth: '400px',
                    borderRadius: '24px',
                    padding: '2.5rem 2rem',
                    border: '1px solid var(--border)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <div
                    style={{
                        marginBottom: '2rem',
                        padding: '0.6rem 1.8rem',
                        border: `5px solid ${config.color}`,
                        color: config.color,
                        fontSize: '2rem',
                        fontWeight: 900,
                        borderRadius: '14px',
                        transform: `rotate(${config.rotation})`,
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(4px)',
                        boxShadow: `0 10px 30px rgba(0,0,0,0.3), 0 0 15px ${config.color}33`,
                        letterSpacing: '1px',
                    }}
                >
                    {config.label}
                </div>

                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem', fontSize: '1.05rem' }}>
                    {config.desc}
                </p>

                <div
                    onClick={() => setDontShowAgain(!dontShowAgain)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.6rem',
                        marginBottom: '2.5rem',
                        cursor: 'pointer',
                        userSelect: 'none',
                    }}
                >
                    <div
                        style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '5px',
                            border: '2px solid var(--border)',
                            background: dontShowAgain ? config.color : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        }}
                    >
                        {dontShowAgain && <span style={{ color: '#000', fontSize: '14px', fontWeight: 900 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Don't show again</span>
                </div>

                <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                    <button
                        onClick={onUndo}
                        style={{
                            flex: 1,
                            padding: '1rem',
                            borderRadius: '14px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-secondary)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '1rem',
                        }}
                    >
                        Undo
                    </button>
                    <button
                        onClick={() => onConfirm(dontShowAgain)}
                        style={{
                            flex: 1.8,
                            padding: '1rem',
                            borderRadius: '14px',
                            background: config.color,
                            border: 'none',
                            color: '#000',
                            fontWeight: 750,
                            cursor: 'pointer',
                            fontSize: '1rem',
                            boxShadow: `0 8px 20px ${config.color}33`,
                        }}
                    >
                        OK
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

const overlayStyles = {
    right: (opacity) => ({
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,229,255,0.05)',
        border: '6px solid var(--accent-cyan)',
        opacity,
        borderRadius: '24px',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20,
        backdropFilter: 'blur(8px)',
    }),
    left: (opacity) => ({
        position: 'absolute',
        inset: 0,
        background: 'rgba(150,150,150,0.05)',
        border: '6px solid #888',
        opacity,
        borderRadius: '24px',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20,
        backdropFilter: 'blur(8px)',
    }),
    down: (opacity) => ({
        position: 'absolute',
        inset: 0,
        background: 'rgba(255,83,112,0.05)',
        border: '6px solid var(--accent-red)',
        opacity,
        borderRadius: '24px',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20,
        backdropFilter: 'blur(8px)',
    }),
    up: (opacity) => ({
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,230,118,0.05)',
        border: '6px solid #00e676',
        opacity,
        borderRadius: '24px',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20,
        backdropFilter: 'blur(8px)',
    }),
};

function stampStyles(color, rotation, fontSize) {
    return {
        padding: '0.6rem 1.8rem',
        border: `5px solid ${color}`,
        color,
        fontSize,
        fontWeight: 900,
        borderRadius: '14px',
        transform: `rotate(${rotation})`,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
    };
}
