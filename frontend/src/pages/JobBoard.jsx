import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { api, auth } from '../services/api.js';
import { useOffers } from '../hooks/useOffers.js';
import JobCard from '../components/JobCard.jsx';
import FilterBar from '../components/FilterBar.jsx';
import SparklesBg from '../components/Sparkles.jsx';
import SkillSwipeOverlay, { SwipeDirectionConfirmModal } from '../components/SkillSwipeOverlay.jsx';

export default function JobBoard() {
    const { offers: jobs, loading } = useOffers();
    const [userSkills, setUserSkills] = useState(new Set());
    const [antiSkills, setAntiSkills] = useState(new Set());
    const [highlightedSkills, setHighlightedSkills] = useState(new Set());
    const [skippedSkills, setSkippedSkills] = useState(new Set());
    const [confirmedTutorials, setConfirmedTutorials] = useState([]);
    const [previewSkill, setPreviewSkill] = useState(null);
    const [pendingAction, setPendingAction] = useState(null);
    const [skillsLoadError, setSkillsLoadError] = useState(null);

    const initialLoadDone = useRef(false);

    const [locationFilter, setLocationFilter] = useState('');
    const [operatingModeFilter, setOperatingModeFilter] = useState('');
    const [employmentTypeFilter, setEmploymentTypeFilter] = useState('');

    const [visibleCount, setVisibleCount] = useState(30);

    useEffect(() => {
        setVisibleCount(30);
    }, [locationFilter, operatingModeFilter, employmentTypeFilter, jobs.length]);

    const loadUserSkills = useCallback(async (mounted = { current: true }) => {
        const user = auth.getUser();
        if (!user) return;
        setSkillsLoadError(null);
        const cv = await api.getUserCV(user.id);
        if (!mounted.current) return;
        if (!cv.loadSucceeded) {
            setSkillsLoadError(cv.error || 'Failed to load your skills');
            return;
        }
        setUserSkills(new Set(cv.skills || []));
        setAntiSkills(new Set(cv.antiSkills || []));
        setHighlightedSkills(new Set(cv.highlightedSkills || []));
        setSkippedSkills(new Set(cv.skippedSkills || []));
        setConfirmedTutorials(cv.confirmedTutorials || []);
        setTimeout(() => { if (mounted.current) initialLoadDone.current = true; }, 100);
    }, []);

    useEffect(() => {
        const mounted = { current: true };
        loadUserSkills(mounted);
        return () => { mounted.current = false; };
    }, [loadUserSkills]);

    // Initial server load sort config
    const [initialSortConfig, setInitialSortConfig] = useState([]);

    // Auto-save changes (can be same 1000ms delay or different)
    useEffect(() => {
        if (!initialLoadDone.current) return;
        const user = auth.getUser();
        if (!user) return;

        const timer = setTimeout(async () => {
            try {
                await api.saveUserCV(user.id, {
                    skills: [...userSkills],
                    antiSkills: [...antiSkills],
                    highlightedSkills: [...highlightedSkills].filter(skill => userSkills.has(skill)),
                    skippedSkills: [...skippedSkills],
                    confirmedTutorials,
                });
            } catch (e) {
                console.error("Failed to save skills from JobBoard:", e);
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [userSkills, antiSkills, highlightedSkills, skippedSkills, confirmedTutorials]);

    const assignSkillDirection = useCallback((direction, name) => {
        if (direction === 'right') {
            setAntiSkills(prev => { const next = new Set(prev); next.delete(name); return next; });
            setSkippedSkills(prev => { const next = new Set(prev); next.delete(name); return next; });
            setUserSkills(prev => { const next = new Set(prev); next.add(name); return next; });
            setHighlightedSkills(prev => { const next = new Set(prev); next.delete(name); return next; });
            return;
        }

        if (direction === 'up') {
            setAntiSkills(prev => { const next = new Set(prev); next.delete(name); return next; });
            setSkippedSkills(prev => { const next = new Set(prev); next.delete(name); return next; });
            setUserSkills(prev => { const next = new Set(prev); next.add(name); return next; });
            setHighlightedSkills(prev => { const next = new Set(prev); next.add(name); return next; });
            return;
        }

        if (direction === 'down') {
            setUserSkills(prev => { const next = new Set(prev); next.delete(name); return next; });
            setSkippedSkills(prev => { const next = new Set(prev); next.delete(name); return next; });
            setAntiSkills(prev => { const next = new Set(prev); next.add(name); return next; });
            setHighlightedSkills(prev => { const next = new Set(prev); next.delete(name); return next; });
            return;
        }

        if (direction === 'left') {
            setUserSkills(prev => { const next = new Set(prev); next.delete(name); return next; });
            setAntiSkills(prev => { const next = new Set(prev); next.delete(name); return next; });
            setSkippedSkills(prev => { const next = new Set(prev); next.add(name); return next; });
            setHighlightedSkills(prev => { const next = new Set(prev); next.delete(name); return next; });
        }
    }, []);

    // Derive unique filter options from loaded data
    const filterOptions = useMemo(() => {
        const unique = (key) => [...new Set(jobs.map(j => j[key]).filter(Boolean))].sort();
        return {
            location: unique('location'),
            operatingMode: unique('operatingMode'),
            employmentType: unique('employmentType'),
        };
    }, [jobs]);

    // Calculate initial sorting order when jobs load or filters change
    useEffect(() => {
        if (!initialLoadDone.current) return;

        const sorted = [...jobs].sort((a, b) => {
            // Very simple initial sort based on what User already had saved
            const reqA = a.requiredSkills || [];
            const reqB = b.requiredSkills || [];
            const scoreA = reqA.length > 0 ? (reqA.filter(s => userSkills.has(s)).length / reqA.length) * 100 : 0;
            const scoreB = reqB.length > 0 ? (reqB.filter(s => userSkills.has(s)).length / reqB.length) * 100 : 0;
            return scoreB - scoreA;
        });

        setInitialSortConfig(sorted.map(s => s.id));
        // ONLY run when these arrays change length to avoid infinite re-renders on skill click
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [jobs.length, locationFilter, operatingModeFilter, employmentTypeFilter]);

    const filteredJobs = useMemo(() => {
        return jobs
            .filter(job => {
                if (locationFilter && job.location !== locationFilter) return false;
                if (operatingModeFilter && job.operatingMode !== operatingModeFilter) return false;
                if (employmentTypeFilter && job.employmentType !== employmentTypeFilter) return false;
                return true;
            })
            // NOTE: We do not sort by dynamic userSkills score here anymore. 
            // We only sort by the initial static configuration. The counter inside the card handles the score visualization.
            .sort((a, b) => {
                const indexA = initialSortConfig.indexOf(a.id);
                const indexB = initialSortConfig.indexOf(b.id);
                if (indexA === -1 && indexB === -1) return 0;
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
            });
    }, [jobs, locationFilter, operatingModeFilter, employmentTypeFilter, initialSortConfig]);

    const blockedCount = useMemo(() => {
        return jobs.filter(job => job.requiredSkills?.some(s => antiSkills.has(s))).length;
    }, [jobs, antiSkills]);

    const getSkillFrequency = useCallback((skillName) => (
        jobs.filter(job => job.requiredSkills?.includes(skillName)).length
    ), [jobs]);

    const openSkillPreview = useCallback((skillName) => {
        setPreviewSkill({ name: skillName, frequency: getSkillFrequency(skillName) });
    }, [getSkillFrequency]);

    const handlePreviewSwipe = useCallback((direction, name) => {
        if (!previewSkill) return;
        const skill = previewSkill;
        setPreviewSkill(null);

        if (confirmedTutorials.includes(direction)) {
            assignSkillDirection(direction, name);
            return;
        }

        setPendingAction({ direction, skillName: name, source: 'preview', skill });
    }, [assignSkillDirection, confirmedTutorials, previewSkill]);

    const visibleJobs = useMemo(() => {
        return filteredJobs.slice(0, visibleCount);
    }, [filteredJobs, visibleCount]);

    // Convert Sets to Arrays once to avoid reallocating inside the render loop for every JobCard
    const userSkillsArray = useMemo(() => Array.from(userSkills), [userSkills]);
    const antiSkillsArray = useMemo(() => Array.from(antiSkills), [antiSkills]);

    return (
        <div style={{ position: 'relative' }}>
            <AnimatePresence>
                {previewSkill && (
                    <SkillSwipeOverlay
                        skill={previewSkill}
                        onSwipe={handlePreviewSwipe}
                        onClose={() => setPreviewSkill(null)}
                    />
                )}
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
                            setPreviewSkill(pendingAction.skill);
                            setPendingAction(null);
                        }}
                    />
                )}
            </AnimatePresence>
            <SparklesBg />
            <div className="container" style={{ maxWidth: '860px', padding: '2rem 1.5rem', position: 'relative', zIndex: 1 }}>
                {skillsLoadError && (
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--accent-red)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                        <p style={{ color: 'var(--accent-red)', fontSize: '0.9rem', fontWeight: 500, margin: 0 }}>
                            ⚠️ Could not load your skills — job matching may be inaccurate. {skillsLoadError}
                        </p>
                        <button
                            className="btn btn-primary"
                            onClick={() => loadUserSkills()}
                            style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', fontWeight: 600, borderRadius: '6px', whiteSpace: 'nowrap' }}
                        >
                            Retry
                        </button>
                    </div>
                )}
                <div style={styles.pageHeader}>
                    <div>
                        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.25rem' }}>Job Offers</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            {loading ? 'Loading...' : (
                                <>
                                    Found <strong style={{ color: 'var(--text-primary)' }}>{filteredJobs.length}</strong> offers
                                    {antiSkills.size > 0 && blockedCount > 0 && (
                                        <> · <span style={{ color: 'var(--accent-red)' }}>{blockedCount} blocked</span> by anti-skills</>
                                    )}
                                </>
                            )}
                        </p>
                    </div>
                </div>

                {/* Filter bar */}
                <FilterBar
                    locationFilter={locationFilter} setLocationFilter={setLocationFilter}
                    operatingModeFilter={operatingModeFilter} setOperatingModeFilter={setOperatingModeFilter}
                    employmentTypeFilter={employmentTypeFilter} setEmploymentTypeFilter={setEmploymentTypeFilter}
                    locationOptions={filterOptions.location}
                    operatingModeOptions={filterOptions.operatingMode}
                    employmentTypeOptions={filterOptions.employmentType}
                />

                {/* Job list */}
                {loading ? (
                    <div>
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} style={styles.skeletonCard} />
                        ))}
                    </div>
                ) : filteredJobs.length === 0 ? (
                    <div style={styles.emptyState}>
                        <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</p>
                        <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>No offers found</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Try changing your filters or lowering the minimum match percentage.
                        </p>
                    </div>
                ) : (
                    <>
                        {visibleJobs.map((job, i) => {
                            const uniqueKey = job.id || job.url || `${job.title}-${job.company}-${i}`;
                            return (
                                <JobCard
                                    key={uniqueKey}
                                    job={job}
                                    userSkills={userSkillsArray}
                                    antiSkills={antiSkillsArray}
                                    onPreviewSkill={openSkillPreview}
                                />
                            );
                        })}
                        {visibleCount < filteredJobs.length && (
                            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem', marginBottom: '1rem' }}>
                                <button
                                    onClick={() => setVisibleCount(prev => prev + 30)}
                                    className="btn btn-primary"
                                    style={{ padding: '0.75rem 2rem', fontSize: '1rem', fontWeight: 600, borderRadius: '8px' }}
                                >
                                    Load More ({filteredJobs.length - visibleCount} remaining)
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

const styles = {
    pageHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: '1.25rem',
    },
    skeletonCard: {
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        height: '120px',
        marginBottom: '0.75rem',
        animation: 'pulse 1.5s ease-in-out infinite',
    },
    emptyState: {
        textAlign: 'center',
        padding: '4rem 2rem',
        color: 'var(--text-secondary)',
    },
};
