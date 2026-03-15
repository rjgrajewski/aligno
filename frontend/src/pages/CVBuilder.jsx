import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, auth } from '../services/api.js';
import { useSkills } from '../hooks/useSkills.js';
import SwipeSkillSelector from '../components/SwipeSkillSelector.jsx';
import SkillSwipeOverlay, { SwipeDirectionConfirmModal } from '../components/SkillSwipeOverlay.jsx';

function useIsMobile() {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);
    return isMobile;
}


export default function CVBuilder() {
    const isMobile = useIsMobile();
    const [selected, setSelected] = useState(new Set());
    const [highlighted, setHighlighted] = useState(new Set());
    const [skipped, setSkipped] = useState(new Set());
    const { skills, loading } = useSkills([...selected]);
    const [bufferedDeck, setBufferedDeck] = useState([]);
    const [anti, setAnti] = useState(new Set());
    const [confirmedTutorials, setConfirmedTutorials] = useState([]);
    const [pendingAction, setPendingAction] = useState(null); // { direction, skillName }
    const [previewSkill, setPreviewSkill] = useState(null);

    const selectedRef = useRef(new Set());
    const antiRef = useRef(new Set());
    const skippedRef = useRef(new Set());

    // Keep refs in sync with state for use in toggle handlers
    useEffect(() => { selectedRef.current = selected; }, [selected]);
    useEffect(() => { antiRef.current = anti; }, [anti]);
    useEffect(() => { skippedRef.current = skipped; }, [skipped]);

    const [saved, setSaved] = useState('');
    const [loadError, setLoadError] = useState(null);
    const saveTimeout = useRef(null);
    const initialLoadDone = useRef(false);

    const containerRef = useRef(null);

    const loadUserCV = useCallback(async (mounted = { current: true }) => {
        const user = auth.getUser();
        if (!user) return;
        setLoadError(null);
        const cv = await api.getUserCV(user.id);
        if (!mounted.current) return;
        if (!cv.loadSucceeded) {
            setLoadError(cv.error || 'Failed to load your skills');
            return;
        }
        setSelected(new Set(cv.skills || []));
        setAnti(new Set(cv.antiSkills || []));
        setHighlighted(new Set(cv.highlightedSkills || []));
        setSkipped(new Set(cv.skippedSkills || []));
        setConfirmedTutorials(cv.confirmedTutorials || []);
        setTimeout(() => { if (mounted.current) initialLoadDone.current = true; }, 100);
    }, []);

    useEffect(() => {
        const mounted = { current: true };
        loadUserCV(mounted);
        return () => { mounted.current = false; };
    }, [loadUserCV]);

    useEffect(() => {
        if (!initialLoadDone.current) return;
        const user = auth.getUser();
        if (!user) return;

        setSaved('Saving...');
        if (saveTimeout.current) clearTimeout(saveTimeout.current);

        saveTimeout.current = setTimeout(async () => {
            try {
                const highlightedFiltered = [...highlighted].filter(s => selected.has(s));
                await api.saveUserCV(user.id, {
                    skills: [...selected],
                    antiSkills: [...anti],
                    highlightedSkills: highlightedFiltered,
                    skippedSkills: [...skipped],
                    confirmedTutorials: confirmedTutorials
                });
                setSaved('Saved!');
                setTimeout(() => setSaved(''), 2500);
            } catch (e) {
                setSaved('Error saving');
            }
        }, 1000);
    }, [selected, anti, highlighted, confirmedTutorials, skipped]);



    // Intelligent Collaborative Sorting Buffer:
    // We want the background API to continually fetch optimal matching skills as the user swipes.
    // However, we MUST protect the top N cards that the user is currently looking at
    // from being unexpectedly swapped out while they are deciding.
    useEffect(() => {
        setBufferedDeck(currentDeck => {
            // 1. Identify valid cards currently in the buffer (protect top 2)
            const validCurrentBuffer = currentDeck
                .filter(s =>
                    !selected.has(s.name) &&
                    !anti.has(s.name) &&
                    !skipped.has(s.name) &&
                    (!pendingAction || pendingAction.skillName !== s.name)
                )
                .slice(0, 2);

            // 2. Identify names of the protected cards
            const bufferNames = new Set(validCurrentBuffer.map(s => s.name));

            // 3. Filter the new API skills to exclude already processed AND already buffered cards
            const newFilteredSkills = skills.filter(s =>
                !selected.has(s.name) &&
                !anti.has(s.name) &&
                !skipped.has(s.name) &&
                !bufferNames.has(s.name) &&
                (!pendingAction || pendingAction.skillName !== s.name)
            );

            // 4. Combine safe buffer with new collaborative suggestions
            return [...validCurrentBuffer, ...newFilteredSkills];
        });
    }, [skills, selected, anti, skipped, pendingAction]);



    const getSkillFrequency = useCallback((name) => {
        const skill = skills.find(s => s.name === name);
        return skill ? skill.frequency : 0;
    }, [skills]);

    const assignSkillDirection = useCallback((direction, name) => {
        if (direction === 'right') {
            setAnti(prev => { const next = new Set(prev); next.delete(name); return next; });
            setSkipped(prev => { const next = new Set(prev); next.delete(name); return next; });
            setSelected(prev => { const next = new Set(prev); next.add(name); return next; });
            setHighlighted(prev => { const next = new Set(prev); next.delete(name); return next; });
            return;
        }

        if (direction === 'up') {
            setAnti(prev => { const next = new Set(prev); next.delete(name); return next; });
            setSkipped(prev => { const next = new Set(prev); next.delete(name); return next; });
            setSelected(prev => { const next = new Set(prev); next.add(name); return next; });
            setHighlighted(prev => { const next = new Set(prev); next.add(name); return next; });
            return;
        }

        if (direction === 'down') {
            setSelected(prev => { const next = new Set(prev); next.delete(name); return next; });
            setSkipped(prev => { const next = new Set(prev); next.delete(name); return next; });
            setAnti(prev => { const next = new Set(prev); next.add(name); return next; });
            setHighlighted(prev => { const next = new Set(prev); next.delete(name); return next; });
            return;
        }

        if (direction === 'left') {
            setSelected(prev => { const next = new Set(prev); next.delete(name); return next; });
            setAnti(prev => { const next = new Set(prev); next.delete(name); return next; });
            setSkipped(prev => { const next = new Set(prev); next.add(name); return next; });
            setHighlighted(prev => { const next = new Set(prev); next.delete(name); return next; });
        }
    }, []);

    const handleClearCategory = useCallback((category) => {
        const curSelected = selectedRef.current;
        const curAnti = antiRef.current;
        const curSkipped = skippedRef.current;
        
        let namesToClear = [];
        
        if (category === 'know') {
            namesToClear = [...curSelected].filter(s => !highlighted.has(s));
            setSelected(prev => { const n = new Set(prev); namesToClear.forEach(name => n.delete(name)); return n; });
        } else if (category === 'mustHave') {
            namesToClear = [...highlighted];
            setHighlighted(new Set());
            setSelected(prev => { const n = new Set(prev); namesToClear.forEach(name => n.delete(name)); return n; });
        } else if (category === 'block') {
            namesToClear = [...curAnti];
            setAnti(new Set());
        } else if (category === 'skip') {
            namesToClear = [...curSkipped];
            setSkipped(new Set());
        }

        if (namesToClear.length > 0) {
            const newBufferedCards = namesToClear.map(name => ({
                name,
                frequency: getSkillFrequency(name)
            }));
            setBufferedDeck(prevDeck => [
                ...newBufferedCards,
                ...prevDeck.filter(s => !namesToClear.includes(s.name))
            ]);
        }
    }, [getSkillFrequency, highlighted]);

    const queueSwipe = useCallback((direction, name, source, skill) => {
        if (confirmedTutorials.includes(direction)) {
            assignSkillDirection(direction, name);
            return;
        }

        setPendingAction({ direction, skillName: name, source, skill });
    }, [assignSkillDirection, confirmedTutorials]);

    const handleSwipe = useCallback((direction, name) => {
        const skill = { name, frequency: getSkillFrequency(name) };
        queueSwipe(direction, name, 'deck', skill);
    }, [getSkillFrequency, queueSwipe]);

    const handlePreviewSwipe = useCallback((direction, name) => {
        if (!previewSkill) return;
        const skill = previewSkill;
        setPreviewSkill(null);
        if (confirmedTutorials.includes(direction)) {
            assignSkillDirection(direction, name);
        } else {
            setPendingAction({ direction, skillName: name, source: 'preview', skill });
        }
    }, [assignSkillDirection, confirmedTutorials, previewSkill]);

    const handlePreviewSkill = useCallback((name) => {
        setPreviewSkill({ name, frequency: getSkillFrequency(name) });
    }, [getSkillFrequency]);

    // Keep highlighted a subset of selected (e.g. when user deselects a skill)
    useEffect(() => {
        setHighlighted(prev => {
            const next = new Set(prev);
            for (const x of next) {
                if (!selected.has(x)) next.delete(x);
            }
            return next;
        });
    }, [selected]);

    return (
        <div style={{ ...styles.wrapper, flexDirection: 'column', overflowX: 'hidden' }}>
            <AnimatePresence>
                {pendingAction && (
                    <SwipeDirectionConfirmModal
                        action={pendingAction}
                        onConfirm={(dontShowAgain) => {
                            if (dontShowAgain) {
                                setConfirmedTutorials(prev => [...prev, pendingAction.direction]);
                            }
                            assignSkillDirection(pendingAction.direction, pendingAction.skillName);
                            setPendingAction(null);
                        }}
                        onUndo={() => {
                            if (pendingAction.source === 'preview') {
                                setPreviewSkill(pendingAction.skill);
                            } else {
                                setBufferedDeck(prev => [pendingAction.skill, ...prev.filter(s => s.name !== pendingAction.skill.name)]);
                            }
                            setPendingAction(null);
                        }}
                    />
                )}
                {previewSkill && (
                    <SkillSwipeOverlay
                        skill={previewSkill}
                        onSwipe={handlePreviewSwipe}
                        onClose={() => setPreviewSkill(null)}
                    />
                )}
            </AnimatePresence>
            {/* MAIN AREA */}
            <div style={{ ...styles.main, padding: isMobile ? '0.5rem' : '1.5rem 2rem' }}>

                {/* Save Indicator */}
                <div style={{ position: 'absolute', top: '1rem', right: '1.5rem', zIndex: 50 }}>
                    <AnimatePresence>
                        {saved && (
                            <motion.span
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                style={{
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    background: 'var(--bg-elevated)',
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '999px',
                                    border: '1px solid var(--border)',
                                    color: saved === 'Saved!' ? 'var(--accent-cyan)' : saved.includes('Error') ? 'var(--accent-red)' : 'var(--text-secondary)'
                                }}
                            >
                                {saved === 'Saved!' ? '✓ ' : ''}{saved}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>

                {/* Header: hidden on mobile */}
                {!isMobile && (
                    <div style={{ ...styles.mainHeader, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', textAlign: 'center' }}>
                        <div>
                            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.25rem' }}>Skill Map</h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                Swipe cards or use <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>arrow keys</span> to organize your skills
                            </p>
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: isMobile ? 'calc(100vh - 80px)' : 'calc(100vh - 150px)', width: '100%' }} ref={containerRef}>
                    {loadError ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                            <p style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚠️</p>
                            <p style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--accent-red)' }}>Could not load your skills</p>
                            <p style={{ fontSize: '0.9rem', marginBottom: '1.25rem' }}>{loadError}</p>
                            <button
                                className="btn btn-primary"
                                onClick={() => loadUserCV()}
                                style={{ padding: '0.6rem 1.5rem', fontSize: '0.95rem', fontWeight: 600, borderRadius: '8px' }}
                            >
                                Retry
                            </button>
                        </div>
                    ) : loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                            <div className="pulse" style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--bg-elevated)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                        </div>
                    ) : (
                        <SwipeSkillSelector
                            skills={bufferedDeck}
                            isMobile={isMobile}
                            selected={selected}
                            anti={anti}
                            highlighted={highlighted}
                            skipped={skipped}
                            onSkillPreview={handlePreviewSkill}
                            onClearCategory={handleClearCategory}
                            onSwipeRight={(name) => handleSwipe('right', name)}
                            onSwipeLeft={(name) => handleSwipe('left', name)}
                            onSwipeUp={(name) => handleSwipe('up', name)}
                            onSwipeDown={(name) => handleSwipe('down', name)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

const styles = {
    wrapper: {
        display: 'flex',
        minHeight: 'calc(100vh - 64px)',
    },
    mainHeader: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap',
    },
    bubbleCloudContainer: {
        position: 'relative',
        flex: 1,
        width: '100%',
        minHeight: '600px',
        overflow: 'hidden',
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)',
    },
    loadingPlaceholder: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        padding: '0.5rem',
    },
    skeleton: {
        background: 'var(--bg-elevated)',
        animation: 'pulse 1.5s ease-in-out infinite',
    },
};
