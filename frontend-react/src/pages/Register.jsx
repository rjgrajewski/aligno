import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../services/api.js';

// Zwraca { score: 0-4, label, color } na podstawie długości i złożoności hasła
function getPasswordStrength(password) {
    if (!password) return { score: 0, label: '', color: 'var(--border)' };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    score = Math.min(score, 4);
    const levels = [
        { label: 'Bardzo słabe', color: 'var(--accent-red)' },
        { label: 'Słabe', color: 'var(--accent-amber)' },
        { label: 'Średnie', color: 'var(--accent-cyan)' },
        { label: 'Silne', color: 'var(--accent-green)' },
    ];
    const idx = score === 0 ? 0 : Math.min(score, 3);
    return { score, ...levels[idx] };
}

export default function Register() {
    const [tab, setTab] = useState('register'); // 'register' | 'login'
    const [form, setForm] = useState({ name: '', email: '', password: '', passwordConfirm: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const passwordStrength = useMemo(() => getPasswordStrength(form.password), [form.password]);
    const passwordsMatch = form.password === form.passwordConfirm;
    const showPasswordMismatch = tab === 'register' && form.passwordConfirm.length > 0 && !passwordsMatch;

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (tab === 'register') {
                if (!form.name.trim()) { setError('Imię jest wymagane'); return; }
                if (form.password !== form.passwordConfirm) {
                    setError('Hasła muszą być identyczne');
                    return;
                }
                if (form.password.length < 8) {
                    setError('Hasło musi mieć co najmniej 8 znaków');
                    return;
                }
                const { passwordConfirm: _, ...registerData } = form;
                await auth.register(registerData);
            } else {
                await auth.login(form.email, form.password);
            }
            navigate('/cv');
        } catch (err) {
            setError(err?.message || 'Coś poszło nie tak. Spróbuj ponownie.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.wrapper}>
            {/* Left panel */}
            <div style={styles.leftPanel}>
                <div style={styles.leftContent}>
                    <div style={styles.logoBadge}>
                        flow<span style={{ color: 'var(--accent-cyan)' }}>job</span>
                    </div>
                    <h2 style={{ lineHeight: 1.2, marginBottom: '1rem' }}>
                        Your career,<br />
                        <span className="gradient-text">on your terms.</span>
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem' }}>
                        Map your skills, set your boundaries, and get matched with jobs you'll actually want to take.
                    </p>
                    <div style={styles.testimonial}>
                        <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.9rem' }}>
                            "Found my current role in 3 days. Never sent a resume."
                        </p>
                        <p style={{ color: 'var(--accent-cyan)', fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: 600 }}>
                            — Senior Go Developer, Berlin
                        </p>
                    </div>
                </div>
            </div>

            {/* Right form panel */}
            <div style={styles.rightPanel}>
                <div style={styles.formCard}>
                    {/* Tabs */}
                    <div style={styles.tabs}>
                        {['register', 'login'].map(t => (
                            <button
                                key={t}
                                style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }}
                                onClick={() => { setTab(t); setError(''); }}
                            >
                                {t === 'register' ? 'Create Account' : 'Sign In'}
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.form
                            key={tab}
                            onSubmit={handleSubmit}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            style={{ marginTop: '1.5rem' }}
                        >
                            {tab === 'register' && (
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input className="form-input" name="name" value={form.name} onChange={handleChange} placeholder="Jan Kowalski" required />
                                </div>
                            )}
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input className="form-input" type="email" name="email" value={form.email} onChange={handleChange} placeholder="jan@example.com" required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <input className="form-input" type="password" name="password" value={form.password} onChange={handleChange} placeholder="••••••••" required />
                                {tab === 'register' && form.password && (
                                    <div style={styles.strengthWrap}>
                                        <div style={styles.strengthBar}>
                                            {[1, 2, 3, 4].map(i => (
                                                <span
                                                    key={i}
                                                    style={{
                                                        ...styles.strengthSegment,
                                                        background: passwordStrength.score >= i ? passwordStrength.color : 'var(--border)',
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <span style={{ color: passwordStrength.color, fontSize: '0.8rem', fontWeight: 500 }}>
                                            {passwordStrength.label}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {tab === 'register' && (
                                <div className="form-group">
                                    <label className="form-label">Potwierdź hasło</label>
                                    <input
                                        className="form-input"
                                        type="password"
                                        name="passwordConfirm"
                                        value={form.passwordConfirm}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        required
                                        style={showPasswordMismatch ? { borderColor: 'var(--accent-red)' } : undefined}
                                    />
                                    {showPasswordMismatch && (
                                        <p style={{ color: 'var(--accent-red)', fontSize: '0.8rem', marginTop: '0.35rem' }}>
                                            Hasła nie są identyczne
                                        </p>
                                    )}
                                </div>
                            )}

                            {error && (
                                <p style={{ color: 'var(--accent-red)', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>
                            )}

                            <button
                                type="submit"
                                className="btn btn-primary btn-full"
                                style={{ width: '100%', justifyContent: 'center', padding: '0.8rem' }}
                                disabled={loading || (tab === 'register' && (showPasswordMismatch || form.password.length < 8))}
                            >
                                {loading ? 'Loading...' : tab === 'register' ? 'Create Account →' : 'Sign In →'}
                            </button>
                        </motion.form>
                    </AnimatePresence>
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
    leftPanel: {
        flex: '1 1 420px',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 3rem',
    },
    leftContent: {
        maxWidth: '360px',
    },
    logoBadge: {
        fontSize: '1.5rem',
        fontWeight: 800,
        marginBottom: '2rem',
        color: 'var(--text-primary)',
    },
    testimonial: {
        marginTop: '2.5rem',
        padding: '1.25rem',
        background: 'var(--bg-elevated)',
        borderLeft: '3px solid var(--accent-cyan)',
        borderRadius: '0 var(--radius-md) var(--radius-md) 0',
    },
    rightPanel: {
        flex: '1 1 400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 3rem',
    },
    formCard: {
        width: '100%',
        maxWidth: '400px',
    },
    tabs: {
        display: 'flex',
        gap: '0',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-pill)',
        padding: '4px',
    },
    tab: {
        flex: 1,
        padding: '0.55rem',
        border: 'none',
        borderRadius: 'var(--radius-pill)',
        background: 'none',
        color: 'var(--text-secondary)',
        font: 'inherit',
        fontSize: '0.9rem',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.15s',
    },
    tabActive: {
        background: 'var(--bg-elevated)',
        color: 'var(--accent-cyan)',
        boxShadow: '0 0 0 1px var(--border)',
    },
    strengthWrap: {
        marginTop: '0.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
    },
    strengthBar: {
        display: 'flex',
        gap: '4px',
    },
    strengthSegment: {
        flex: 1,
        height: 4,
        borderRadius: 2,
        transition: 'background 0.2s',
    },
};
