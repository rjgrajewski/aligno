import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SkillSwipeTutorial() {
    const [isVisible, setIsVisible] = useState(false);
    const [dontShowAgain, setDontShowAgain] = useState(false);

    useEffect(() => {
        const hasSeen = localStorage.getItem('flowjob_skills_tutorial_done');
        if (!hasSeen) {
            // Small delay so it doesn't pop up instantly on page load flash
            const timer = setTimeout(() => setIsVisible(true), 300);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        if (dontShowAgain) {
            localStorage.setItem('flowjob_skills_tutorial_done', 'true');
        }
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9999,
                        background: 'rgba(0,0,0,0.85)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem'
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            borderRadius: '24px',
                            padding: '2rem',
                            maxWidth: '450px',
                            width: '100%',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                            color: 'var(--text-primary)'
                        }}
                    >
                        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem', textAlign: 'center' }}>
                            How to Swipe 💡
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem', textAlign: 'center', lineHeight: 1.5 }}>
                            Organize your skills using cards to get better job matches. Here's what each direction does:
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                <div style={{ background: 'rgba(0, 230, 118, 0.1)', color: '#00e676', padding: '0.5rem', borderRadius: '12px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800 }}>↑</div>
                                <div>
                                    <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '1rem', color: '#00e676' }}>Must Have</h4>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>Added to your visible CV and strongly improves job matches.</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                <div style={{ background: 'rgba(0, 229, 255, 0.1)', color: 'var(--accent-cyan)', padding: '0.5rem', borderRadius: '12px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800 }}>→</div>
                                <div>
                                    <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '1rem', color: 'var(--accent-cyan)' }}>Know</h4>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>Improves job matching, but is <strong>not</strong> displayed on your CV.</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                <div style={{ background: 'rgba(255, 83, 112, 0.1)', color: 'var(--accent-red)', padding: '0.5rem', borderRadius: '12px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800 }}>↓</div>
                                <div>
                                    <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '1rem', color: 'var(--accent-red)' }}>Don't Know</h4>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>Blocks the skill. Hides job requirements related to it.</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                <div style={{ background: 'rgba(150, 150, 150, 0.1)', color: '#888', padding: '0.5rem', borderRadius: '12px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800 }}>←</div>
                                <div>
                                    <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '1rem', color: '#888' }}>Skipped</h4>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>Skips this skill for now without affecting your jobs or CV.</p>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={dontShowAgain}
                                    onChange={(e) => setDontShowAgain(e.target.checked)}
                                    style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--accent-cyan)' }}
                                />
                                Don't show again
                            </label>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleClose}
                                style={{
                                    background: 'var(--accent-cyan)',
                                    color: '#000',
                                    border: 'none',
                                    padding: '0.6rem 1.5rem',
                                    borderRadius: '999px',
                                    fontSize: '0.9rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(0, 229, 255, 0.3)'
                                }}
                            >
                                Got it!
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
