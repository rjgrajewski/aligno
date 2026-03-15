import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './CookieConsent.css';

const CONSENT_KEY = 'flowjob_cookie_consent';

const DEFAULT_CONSENT = {
    necessary: true,
    analytics: false,
    marketing: false,
};

export function getConsent() {
    try {
        const raw = localStorage.getItem(CONSENT_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export function hasConsentFor(category) {
    const consent = getConsent();
    if (!consent) return false;
    return consent[category] === true;
}

export default function CookieConsent() {
    const [visible, setVisible] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [preferences, setPreferences] = useState({ ...DEFAULT_CONSENT });

    useEffect(() => {
        const existing = getConsent();
        if (!existing) {
            setVisible(true);
        }
    }, []);

    const saveConsent = (consent) => {
        localStorage.setItem(CONSENT_KEY, JSON.stringify({
            ...consent,
            necessary: true,
            timestamp: new Date().toISOString(),
        }));
        setVisible(false);
        window.dispatchEvent(new CustomEvent('cookieConsentChanged', { detail: consent }));
    };

    const acceptAll = () => {
        saveConsent({ necessary: true, analytics: true, marketing: true });
    };

    const acceptSelected = () => {
        saveConsent(preferences);
    };

    const rejectOptional = () => {
        saveConsent({ ...DEFAULT_CONSENT });
    };

    const toggleCategory = (category) => {
        if (category === 'necessary') return;
        setPreferences(prev => ({ ...prev, [category]: !prev[category] }));
    };

    if (!visible) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="consent-overlay"
                initial={{ opacity: 0, y: 80 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 80 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
            >
                <div className="consent-banner">
                    <div className="consent-body">
                        <h3 className="consent-title">We value your privacy</h3>
                        <p className="consent-text">
                            We use cookies and similar technologies to keep you logged in and improve your experience.
                            Some are strictly necessary, others help us understand how the site is used.
                            Read more in our <Link to="/cookies" className="consent-link">Cookie &amp; Storage Policy</Link>.
                        </p>

                        <AnimatePresence>
                            {showDetails && (
                                <motion.div
                                    className="consent-details"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="consent-category">
                                        <label className="consent-label">
                                            <input type="checkbox" checked disabled />
                                            <span className="consent-cat-name">Strictly Necessary</span>
                                        </label>
                                        <span className="consent-cat-desc">Authentication, session, core functionality. Always active.</span>
                                    </div>
                                    <div className="consent-category">
                                        <label className="consent-label">
                                            <input
                                                type="checkbox"
                                                checked={preferences.analytics}
                                                onChange={() => toggleCategory('analytics')}
                                            />
                                            <span className="consent-cat-name">Analytics</span>
                                        </label>
                                        <span className="consent-cat-desc">Help us understand how visitors use the site.</span>
                                    </div>
                                    <div className="consent-category">
                                        <label className="consent-label">
                                            <input
                                                type="checkbox"
                                                checked={preferences.marketing}
                                                onChange={() => toggleCategory('marketing')}
                                            />
                                            <span className="consent-cat-name">Marketing</span>
                                        </label>
                                        <span className="consent-cat-desc">Personalized content and advertising.</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="consent-actions">
                            <button className="consent-btn consent-btn-secondary" onClick={() => setShowDetails(!showDetails)}>
                                {showDetails ? 'Hide details' : 'Customize'}
                            </button>
                            {showDetails && (
                                <button className="consent-btn consent-btn-secondary" onClick={rejectOptional}>
                                    Reject optional
                                </button>
                            )}
                            {showDetails && (
                                <button className="consent-btn consent-btn-primary" onClick={acceptSelected}>
                                    Save preferences
                                </button>
                            )}
                            {!showDetails && (
                                <button className="consent-btn consent-btn-primary" onClick={acceptAll}>
                                    Accept all
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
