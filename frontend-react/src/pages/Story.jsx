import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, useSpring, useTransform, animate } from 'framer-motion';
import { api } from '../services/api';
import './Story.css';
import { DatabaseIcon } from '../components/Icons';
import { archNodes, symbols } from './Story.constants';

const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.2 }
    }
};
const WaveformVisual = () => {
    return (
        <div className="waveform-container">
            {/* Noise Layers - Chaotic Waves */}
            <svg viewBox="0 0 400 200" className="waveform-svg noise-layers">
                {[...Array(6)].map((_, i) => (
                    <motion.path
                        key={i}
                        d={`M 0 100 Q ${50 + i * 20} ${20 + i * 10} 100 100 T 200 100 T 300 100 T 400 100`}
                        fill="none"
                        stroke="var(--text-secondary)"
                        strokeWidth="1"
                        initial={{ opacity: 0 }}
                        animate={{
                            opacity: [0.1, 0.3, 0.1],
                            d: [
                                `M 0 100 Q ${40 + i * 30} ${10 + i * 5} 100 100 T 200 100 T 300 100 T 400 100`,
                                `M 0 100 Q ${60 + i * 30} ${180 - i * 5} 100 100 T 200 100 T 300 100 T 400 100`,
                                `M 0 100 Q ${40 + i * 30} ${10 + i * 5} 100 100 T 200 100 T 300 100 T 400 100`
                            ]
                        }}
                        transition={{
                            duration: 3 + i,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.2
                        }}
                    />
                ))}
            </svg>

            {/* Signal Wave - Clean & Strong */}
            <svg viewBox="0 0 400 200" className="waveform-svg signal-layer">
                <defs>
                    <linearGradient id="signalGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="transparent" />
                        <stop offset="50%" stopColor="var(--accent-cyan)" />
                        <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                </defs>
                <motion.path
                    d="M 0 100 C 100 100 150 20 200 100 C 250 180 300 100 400 100"
                    fill="none"
                    stroke="url(#signalGradient)"
                    strokeWidth="4"
                    initial={{ pathLength: 0, opacity: 0 }}
                    whileInView={{ pathLength: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                />
                {/* Glowing Nodes on Signal */}
                <motion.circle
                    cx="200" cy="100" r="4"
                    fill="var(--accent-cyan)"
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: [0, 1, 0], scale: [0.5, 2, 0.5] }}
                    viewport={{ once: true }}
                    transition={{ repeat: Infinity, duration: 2, delay: 1 }}
                />
            </svg>

            <div className="illustration-text">SIGNAL VS NOISE</div>

            {/* Pulse effect in the background */}
            <motion.div
                className="waveform-pulse"
                animate={{ scale: [1, 1.2, 1], opacity: [0, 0.15, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
        </div>
    );
};


const DataFlowDecoration = () => {
    return (
        <div className="data-flow-decoration" style={{ position: 'relative', width: '100%', height: '450px', background: '#0a0a0a', borderRadius: '24px', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            {/* Source Node (Web) */}
            <motion.div
                style={{ position: 'absolute', left: '10%', padding: '20px', border: '1px solid rgba(0,229,255,0.3)', borderRadius: '12px', background: 'rgba(0,229,255,0.05)', backdropFilter: 'blur(4px)', zIndex: 2 }}
                animate={{ borderColor: ['rgba(0,229,255,0.2)', 'rgba(0,229,255,0.6)', 'rgba(0,229,255,0.2)'] }}
                transition={{ duration: 3, repeat: Infinity }}
            >
                <div style={{ color: '#00E5FF', fontSize: '24px', marginBottom: '8px' }}>🌐</div>
                <div style={{ width: '60px', height: '4px', background: 'rgba(0,229,255,0.3)', marginBottom: '4px', borderRadius: '2px' }} />
                <div style={{ width: '40px', height: '4px', background: 'rgba(0,229,255,0.3)', borderRadius: '2px' }} />
            </motion.div>

            {/* Target Node (Database) */}
            <motion.div
                style={{ position: 'absolute', right: '10%', padding: '20px', border: '1px solid rgba(255,215,0,0.3)', borderRadius: '12px', background: 'rgba(255,215,0,0.05)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 2 }}
                animate={{ borderColor: ['rgba(255,215,0,0.2)', 'rgba(255,215,0,0.6)', 'rgba(255,215,0,0.2)'] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
            >
                <div style={{ color: '#FFD700', fontSize: '24px', marginBottom: '8px', textAlign: 'center' }}>🗄️</div>
                <div style={{ width: '60px', height: '6px', background: 'rgba(255,215,0,0.3)', borderRadius: '2px' }} />
                <div style={{ width: '60px', height: '6px', background: 'rgba(255,215,0,0.3)', borderRadius: '2px' }} />
                <div style={{ width: '60px', height: '6px', background: 'rgba(255,215,0,0.3)', borderRadius: '2px' }} />
            </motion.div>

            {/* Flowing Particles */}
            {[...Array(20)].map((_, i) => (
                <motion.div
                    key={i}
                    style={{ position: 'absolute', width: '6px', height: '6px', borderRadius: '50%', background: i % 2 === 0 ? '#00E5FF' : '#FFD700', boxShadow: `0 0 10px ${i % 2 === 0 ? '#00E5FF' : '#FFD700'}`, zIndex: 1 }}
                    initial={{ x: '-120px', y: (Math.random() - 0.5) * 80, opacity: 0 }}
                    animate={{
                        x: ['-120px', '120px'],
                        y: [(Math.random() - 0.5) * 80, (Math.random() - 0.5) * 20],
                        opacity: [0, 1, 1, 0],
                        scale: [0.5, 1.5, 0.5]
                    }}
                    transition={{
                        duration: 1.5 + Math.random() * 2,
                        repeat: Infinity,
                        delay: Math.random() * 3,
                        ease: "easeInOut"
                    }}
                />
            ))}

            {/* Background Grid */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', zIndex: 0 }} />
        </div>
    );
};

const NeonCloudDecoration = () => {
    // Cloud SVG Path data
    const pathD = "M6.5 17.5C4.01472 17.5 2 15.4853 2 13C2 10.7065 3.71542 8.81434 5.92348 8.53676C6.56477 5.37893 9.38787 3 12.75 3C15.82 3 18.4285 5.03575 19.3093 7.82885C21.401 8.2323 23 10.129 23 12.4444C23 14.9604 20.9853 17.5 18.5 17.5H6.5Z";

    return (
        <div className="neon-cloud-decoration" style={{ position: 'relative', width: '100%', maxWidth: '800px', height: '400px', margin: '4rem auto 2rem', background: '#050505', borderRadius: '24px', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>

            {/* Background Grid */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,229,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px', zIndex: 0 }} />

            {/* Glowing Cloud SVG */}
            <motion.div
                style={{ position: 'relative', zIndex: 2, width: '280px', height: '180px' }}
                animate={{ y: [-15, 15, -15] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', overflow: 'visible' }}>

                    {/* Faint static outline */}
                    <path
                        d={pathD}
                        stroke="rgba(0, 229, 255, 0.15)"
                        strokeWidth="0.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Glowing point tracing the path */}
                    <motion.path
                        d={pathD}
                        stroke="#00E5FF"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ filter: 'drop-shadow(0 0 12px #00E5FF) drop-shadow(0 0 3px #fff)' }}
                        initial={{ pathLength: 0, pathOffset: 0 }}
                        animate={{
                            pathOffset: [0, 1]
                        }}
                        transition={{
                            duration: 4,
                            ease: "linear",
                            repeat: Infinity
                        }}
                        strokeDasharray="0.05 1" /* Creates a very short dash resembling a point/comet */
                    />

                    {/* Secondary trail tracing the path */}
                    <motion.path
                        d={pathD}
                        stroke="rgba(0, 229, 255, 0.5)"
                        strokeWidth="0.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ filter: 'drop-shadow(0 0 5px #00E5FF)' }}
                        initial={{ pathLength: 0, pathOffset: 0 }}
                        animate={{
                            pathOffset: [0, 1]
                        }}
                        transition={{
                            duration: 4,
                            ease: "linear",
                            repeat: Infinity
                        }}
                        strokeDasharray="0.3 1" /* Longer trail behind the point */
                    />

                    {/* Container Nodes inside Cloud (Processing Dots) */}
                    <motion.rect x="8" y="11.5" width="2" height="2" rx="1" fill="#FF00FF"
                        style={{ filter: 'drop-shadow(0 0 5px #FF00FF)' }}
                        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }} />
                    <motion.rect x="11.5" y="11.5" width="2" height="2" rx="1" fill="#FF00FF"
                        style={{ filter: 'drop-shadow(0 0 5px #FF00FF)' }}
                        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} />
                    <motion.rect x="15" y="11.5" width="2" height="2" rx="1" fill="#FF00FF"
                        style={{ filter: 'drop-shadow(0 0 5px #FF00FF)' }}
                        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }} />
                </svg>

                {/* Subtle Inner Glow */}
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '150px', height: '80px', background: 'radial-gradient(ellipse at center, rgba(0,229,255,0.15) 0%, transparent 70%)', filter: 'blur(20px)', borderRadius: '50%' }} />
            </motion.div>

            {/* Uploading Data Particles */}
            {[...Array(15)].map((_, i) => (
                <motion.div
                    key={`up-${i}`}
                    style={{ position: 'absolute', bottom: 0, left: `calc(50% - 140px + ${Math.random() * 280}px)`, width: '2px', height: '20px', background: 'linear-gradient(to top, transparent, rgba(0,229,255,0.5))', borderRadius: '2px', zIndex: 1 }}
                    initial={{ y: 200, opacity: 0 }}
                    animate={{ y: -150, opacity: [0, 0.5, 0] }}
                    transition={{
                        duration: 1.5 + Math.random(),
                        repeat: Infinity,
                        delay: Math.random() * 3,
                        ease: "linear"
                    }}
                />
            ))}

            {/* Overlay Gradient for depth */}
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, transparent 30%, #050505 100%)', zIndex: 3, pointerEvents: 'none' }} />
        </div>
    );
};

const FloatingSymbol = ({ icon: Icon, color, delay = 0, size = 30, initialPos = { left: '0%', top: '0%' } }) => {
    const randomX = useMemo(() => Math.random() * 100 - 50, []);
    const randomY = useMemo(() => -150 - Math.random() * 100, []);
    const randomDuration = useMemo(() => 15 + Math.random() * 10, []);

    return (
        <motion.div
            style={{
                position: 'absolute',
                width: size,
                height: size,
                color: color,
                opacity: 0,
                zIndex: 1,
                ...initialPos
            }}
            animate={{
                opacity: [0, 0.4, 0.4, 0],
                scale: [0.5, 1, 1, 0.5],
                x: [0, randomX],
                y: [0, randomY],
            }}
            transition={{
                duration: randomDuration,
                repeat: Infinity,
                delay: delay,
                ease: "easeInOut"
            }}
        >
            <Icon />
        </motion.div>
    );
};

const AIFunnelVis = () => (
    <div className="ai-box">
        <div className="ai-word-raw">MS Excel</div>
        <div className="ai-word-raw">Microsoft Excel</div>
        <div className="ai-word-raw">Excel</div>
        <motion.div
            className="ai-funnel"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
        >
            ↓ Bedrock Normalization ↓
        </motion.div>
        <div className="ai-word-clean">Excel</div>
    </div>
);

const TacklingSkillChaos = () => {
    const [tab, setTab] = useState('problem');
    return (
        <section className="section" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
            <div className="container">
                <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} className="two-col">
                    <motion.div variants={fadeUp} className="col-left">
                        <h2 className="section-title">Tackling Skill Chaos with <span className="gradient-text">AI</span></h2>
                        <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                            <button onClick={() => setTab('problem')} className="btn" style={{ background: tab === 'problem' ? 'var(--accent-cyan)' : 'rgba(0, 229, 255, 0.05)', color: tab === 'problem' ? '#000' : 'var(--text-primary)', border: '1px solid var(--accent-cyan)', padding: '0.5rem 1rem', fontSize: '0.9rem', width: 'auto', cursor: 'pointer' }}>The Problem</button>
                            <button onClick={() => setTab('solution')} className="btn" style={{ background: tab === 'solution' ? 'var(--accent-cyan)' : 'rgba(0, 229, 255, 0.05)', color: tab === 'solution' ? '#000' : 'var(--text-primary)', border: '1px solid var(--accent-cyan)', padding: '0.5rem 1rem', fontSize: '0.9rem', width: 'auto', cursor: 'pointer' }}>The Solution</button>
                            <button onClick={() => setTab('arch')} className="btn" style={{ background: tab === 'arch' ? 'var(--accent-cyan)' : 'rgba(0, 229, 255, 0.05)', color: tab === 'arch' ? '#000' : 'var(--text-primary)', border: '1px solid var(--accent-cyan)', padding: '0.5rem 1rem', fontSize: '0.9rem', width: 'auto', cursor: 'pointer' }}>Architecture</button>
                        </div>
                        <div style={{ minHeight: '220px', position: 'relative' }}>
                            {tab === 'problem' && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} key="t1" transition={{ duration: 0.3 }}>
                                    <p className="paragraph">With working database and a daily refresh mechanism in place, I could start querying job listings for myself using SQL. That was when I hit another wall.</p>
                                    <p className="paragraph">Many listings contained the same requirements written in multiple ways. From a human perspective they mean the same thing, but from a data perspective they fragmented the signal and create unnecessary duplication.</p>
                                </motion.div>
                            )}
                            {tab === 'solution' && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} key="t2" transition={{ duration: 0.3 }}>
                                    <p className="paragraph">I started exploring whether an LLM could be used to collapse these variants into a single canonical representation and reduce repetition across the dataset. I went back to research.</p>
                                    <p className="paragraph">My initial plan was to use embeddings to capture the semantic meaning of each skill and then group similar names together. And while this mechanism was impressive, I actually got a much better precision with a strategy of using carefully tuned system prompt on alphabetically sorted batches of unique skill names.</p>
                                </motion.div>
                            )}
                            {tab === 'arch' && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} key="t3" transition={{ duration: 0.3 }}>
                                    <p className="paragraph">This is where I brought another AWS capability into the architecture: <strong>Amazon Bedrock</strong>.</p>
                                    <p className="paragraph">Unlike job listings - which are removed from the database once they become outdated - the skill normalization layer maintains a persistent dictionary. This allows the system to reuse previously normalized skills and significantly reduce token usage if the same variant appears again in the future. Each normalization run processes only new, unseen skill entires, which keeps the pipeline extremely fast and cost-efficient.</p>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                    <motion.div variants={fadeUp} className="col-right" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <AIFunnelVis />
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};

const VibecodingMinimalVis = () => {
    return (
        <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            width: '100%',
            maxWidth: '350px',
            margin: '0 auto',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    style={{ width: '16px', height: '16px', borderTop: '2px solid var(--accent-cyan)', borderRight: '2px solid transparent', borderRadius: '50%' }}
                />
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent-cyan)', display: 'flex', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Thinking
                    <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}>.</motion.span>
                    <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}>.</motion.span>
                    <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}>.</motion.span>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <motion.div style={{ height: '8px', background: 'var(--text-secondary)', borderRadius: '4px', opacity: 0.3, width: '40%' }} animate={{ opacity: [0.1, 0.4, 0.1] }} transition={{ duration: 2, repeat: Infinity, delay: 0 }} />
                    <motion.div style={{ height: '8px', background: 'var(--text-secondary)', borderRadius: '4px', opacity: 0.3, width: '30%' }} animate={{ opacity: [0.1, 0.4, 0.1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.2 }} />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <motion.div style={{ height: '8px', background: 'var(--text-secondary)', borderRadius: '4px', opacity: 0.3, width: '20%' }} animate={{ opacity: [0.1, 0.4, 0.1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.4 }} />
                    <motion.div style={{ height: '8px', background: 'var(--text-secondary)', borderRadius: '4px', opacity: 0.3, width: '60%' }} animate={{ opacity: [0.1, 0.4, 0.1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.6 }} />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <motion.div style={{ height: '8px', background: 'var(--text-secondary)', borderRadius: '4px', opacity: 0.3, width: '70%' }} animate={{ opacity: [0.1, 0.4, 0.1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.8 }} />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <motion.div style={{ height: '8px', background: 'var(--text-secondary)', borderRadius: '4px', opacity: 0.3, width: '30%' }} animate={{ opacity: [0.1, 0.4, 0.1] }} transition={{ duration: 2, repeat: Infinity, delay: 1.0 }} />
                    <motion.div style={{ height: '8px', background: 'var(--text-secondary)', borderRadius: '4px', opacity: 0.3, width: '20%' }} animate={{ opacity: [0.1, 0.4, 0.1] }} transition={{ duration: 2, repeat: Infinity, delay: 1.2 }} />
                    <motion.div style={{ height: '8px', background: 'var(--text-secondary)', borderRadius: '4px', opacity: 0.3, width: '25%' }} animate={{ opacity: [0.1, 0.4, 0.1] }} transition={{ duration: 2, repeat: Infinity, delay: 1.4 }} />
                </div>
            </div>
        </div>
    );
};

const VibecodingSection = () => {
    const [activeStep, setActiveStep] = useState(0);

    const steps = [
        {
            title: "Think",
            content: "Around this stage, I also discovered that the way I was working — writing code in tight feedback loops with AI — closely resembles what the community calls vibe coding. That realization led me to explore more specialized AI‑native development tools, starting with Cursor and later Antigravity, which further accelerated my iteration speed and experimentation workflow."
        },
        {
            title: "Try",
            content: "While using Cursor, I asked it to generate a web application that would wrap everything I had built so far in a clean graphical interface — eliminating the need to write SQL queries every time I wanted to search for relevant roles. The first results of the generated interface were far from ideal. The UI looked rough and amateurish, contained bugs, and occasionally crashed, but… I've made a thing!"
        },
        {
            title: "Iterate",
            content: "Just a few weeks earlier, I had no practical experience coding in Python. Suddenly, I was looking at the early graphical shell of my own application. I stepped into the role of a supervisor and began deliberately steering Cursor toward the direction I wanted. In parallel, I researched frontend best practices and explored what was possible with React to progressively improve the user experience."
        }
    ];

    return (
        <section className="section" style={{ background: 'var(--bg-deep)' }}>
            <div className="container">
                <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} className="two-col">
                    <motion.div variants={fadeUp} className="col-left">
                        <h2 className="section-title"><span className="gradient-text">Vibecoding</span></h2>

                        <div style={{ position: 'relative', paddingLeft: '2rem' }}>
                            {/* Vertical Line */}
                            <div style={{ position: 'absolute', left: '7px', top: '10px', bottom: '10px', width: '2px', background: 'var(--border)', zIndex: 0 }} />

                            {/* Active Line Progress */}
                            <motion.div
                                style={{ position: 'absolute', left: '7px', top: '10px', width: '2px', background: 'var(--accent-cyan)', zIndex: 1 }}
                                animate={{ height: `${(activeStep / (steps.length - 1)) * 100}%` }}
                                transition={{ duration: 0.4, ease: "easeInOut" }}
                            />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {steps.map((step, index) => {
                                    const isActive = index === activeStep;
                                    const isPast = index < activeStep;

                                    return (
                                        <div
                                            key={index}
                                            style={{ position: 'relative', cursor: 'pointer', opacity: isActive || isPast ? 1 : 0.5, transition: 'opacity 0.3s ease' }}
                                            onClick={() => setActiveStep(index)}
                                        >
                                            {/* Node */}
                                            <motion.div
                                                style={{
                                                    position: 'absolute', left: '-2rem', top: '6px', width: '16px', height: '16px', borderRadius: '50%',
                                                    background: isActive ? 'var(--bg-deep)' : isPast ? 'var(--accent-cyan)' : 'var(--bg-surface)',
                                                    border: `2px solid ${isActive || isPast ? 'var(--accent-cyan)' : 'var(--border)'}`,
                                                    zIndex: 2
                                                }}
                                                animate={{
                                                    scale: isActive ? 1.2 : 1,
                                                    boxShadow: isActive ? '0 0 10px rgba(0, 229, 255, 0.5)' : 'none'
                                                }}
                                            />

                                            {/* Inner Dot for Active */}
                                            {isActive && (
                                                <motion.div
                                                    style={{ position: 'absolute', left: '-1.65rem', top: '11px', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-cyan)', zIndex: 3 }}
                                                    layoutId="activeDot"
                                                />
                                            )}

                                            <h3 style={{ fontSize: '1.1rem', color: isActive ? 'var(--accent-cyan)' : 'var(--text-primary)', marginBottom: '0.5rem', fontWeight: 600, transition: 'color 0.3s ease' }}>
                                                {step.title}
                                            </h3>

                                            {/* Content strictly height-animated for tight compactness */}
                                            <motion.div
                                                initial={false}
                                                animate={{
                                                    height: isActive ? 'auto' : 0,
                                                    opacity: isActive ? 1 : 0,
                                                    marginTop: isActive ? '0.5rem' : 0
                                                }}
                                                style={{ overflow: 'hidden' }}
                                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                            >
                                                <p className="paragraph" style={{ marginBottom: 0 }}>{step.content}</p>
                                            </motion.div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                    </motion.div>
                    <motion.div variants={fadeUp} className="col-right">
                        <VibecodingMinimalVis />
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};

import { AnimatePresence } from 'framer-motion';

const DesigningExperienceSection = () => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <section className="section" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
            <div className="container">
                <motion.div
                    initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
                    className="two-col"
                    style={{ flexDirection: 'row-reverse' }}
                >
                    <motion.div variants={fadeUp} className="col-left" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <h2 className="section-title">Designing the Experience</h2>

                        <div style={{ position: 'relative', flexGrow: 1, minHeight: '340px' }}>
                            <AnimatePresence mode="popLayout" initial={false}>
                                {!isExpanded ? (
                                    <motion.div
                                        key="part1"
                                        initial={{ opacity: 0, y: -40 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -40 }}
                                        transition={{ duration: 0.4, ease: "easeInOut" }}
                                    >
                                        <p className="paragraph">The most important part of the application is the philosophy of matching job offers to a candidate’s skill profile — and I needed a solution that would feel genuinely user‑friendly.</p>

                                        <p className="paragraph">Even after removing much of the noise through normalization, the skill dictionary still contained several thousand entries. My first experiments used dropdowns and text autocomplete, but the sheer volume of suggestions remained overwhelming and discouraging.</p>

                                        <p className="paragraph" style={{ marginBottom: 0 }}>
                                            So I reframed the problem: what if selecting skills felt intuitive, playful, and almost game‑like instead of another rigid filter?
                                        </p>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="part2"
                                        initial={{ opacity: 0, y: 40 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 40 }}
                                        transition={{ duration: 0.4, ease: "easeInOut" }}
                                    >

                                        <p className="paragraph">I wanted the experience to feel fundamentally different from traditional job search filters. Instead of forms and dropdowns, the interface needed to feel alive, responsive, and a bit playful.</p>

                                        <p className="paragraph">Using Vite and React as the foundation, I built an interactive skill map where technologies behave more like objects in a living ecosystem than static UI elements. With the help of D3‑force and Framer Motion, the interface reacts fluidly to every user action — bubbles move, reposition, and flow into the user profile in a way that feels intentional and satisfying.</p>

                                        <p className="paragraph">The goal wasn’t visual flash for its own sake. It was about reducing cognitive friction. Users don’t have to think in terms of filters or queries — they explore. They tap. They follow momentum. The system continuously responds by surfacing the next most relevant skills, keeping the experience smooth and engaging.</p>

                                        <p className="paragraph" style={{ marginBottom: 0 }}>Under the hood, the experience is carefully tuned for performance so the map remains perfectly fluid even with many elements on screen. But from the user’s perspective, it should simply feel fast, natural, and oddly satisfying.</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div style={{ marginTop: 'auto', paddingTop: '1.5rem' }}>
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="btn"
                                style={{
                                    background: 'transparent',
                                    border: '1px solid var(--accent-cyan)',
                                    color: 'var(--accent-cyan)',
                                    padding: '0.4rem 1rem',
                                    fontSize: '0.9rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    cursor: 'pointer'
                                }}
                            >
                                {isExpanded ? 'Go back' : 'Read more'}
                                <motion.span animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
                                    →
                                </motion.span>
                            </button>
                        </div>
                    </motion.div>
                    <motion.div variants={fadeUp} className="col-right">
                        <div className="vibe-map">
                            <motion.div className="vibe-node" style={{ top: '20%', left: '30%', borderColor: 'var(--accent-cyan)' }} animate={{ y: [0, -10, 0], x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 4 }}>React</motion.div>
                            <motion.div className="vibe-node" style={{ top: '50%', left: '50%', borderColor: 'var(--accent-violet)', transform: 'translate(-50%, -50%)', background: 'var(--bg-elevated)', border: '2px solid var(--accent-violet)' }} animate={{ y: [0, 10, 0], scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 5 }}>Skills Match</motion.div>
                            <motion.div className="vibe-node" style={{ top: '70%', left: '20%', borderColor: 'var(--accent-amber)' }} animate={{ y: [0, 8, 0], x: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 4.5 }}>Python</motion.div>
                            <motion.div className="vibe-node" style={{ top: '30%', right: '20%', borderColor: 'var(--accent-amber)' }} animate={{ y: [0, -5, 0], x: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 3 }}>SQL</motion.div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};

const CVBuilderDecoration = () => {
    return (
        <div className="cv-builder-vis" style={{
            position: 'relative',
            width: '100%',
            height: '350px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            {/* The Document */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{
                    width: '300px',
                    height: '320px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '2rem',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
                    position: 'relative',
                    overflow: 'hidden',
                    zIndex: 2
                }}
            >
                {/* Header Skeleton */}
                <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--border)' }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
                        <div style={{ width: '60%', height: '12px', background: 'var(--text-primary)', borderRadius: '4px', opacity: 0.8 }} />
                        <div style={{ width: '40%', height: '8px', background: 'var(--text-secondary)', borderRadius: '4px', opacity: 0.5 }} />
                    </div>
                </div>

                {/* Experience Skeleton */}
                <div style={{ width: '30%', height: '10px', background: 'var(--text-secondary)', borderRadius: '4px', opacity: 0.4, marginBottom: '1rem' }} />
                <div style={{ width: '100%', height: '6px', background: 'var(--border)', borderRadius: '3px', marginBottom: '8px' }} />
                <div style={{ width: '90%', height: '6px', background: 'var(--border)', borderRadius: '3px', marginBottom: '8px' }} />
                <div style={{ width: '95%', height: '6px', background: 'var(--border)', borderRadius: '3px', marginBottom: '2rem' }} />

                {/* Skills Container */}
                <div style={{ width: '30%', height: '10px', background: 'var(--text-secondary)', borderRadius: '4px', opacity: 0.4, marginBottom: '1rem' }} />
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Skills will fly into here */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 1.5, duration: 0.4 }}
                        style={{ padding: '4px 10px', background: 'rgba(0, 229, 255, 0.1)', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)', borderRadius: '12px', fontSize: '0.6rem', fontWeight: 600 }}
                    >
                        React
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 2.2, duration: 0.4 }}
                        style={{ padding: '4px 10px', background: 'rgba(255, 0, 255, 0.1)', border: '1px solid var(--accent-violet)', color: 'var(--accent-violet)', borderRadius: '12px', fontSize: '0.6rem', fontWeight: 600 }}
                    >
                        Python
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 2.9, duration: 0.4 }}
                        style={{ padding: '4px 10px', background: 'rgba(255, 221, 0, 0.1)', border: '1px solid var(--accent-amber)', color: 'var(--accent-amber)', borderRadius: '12px', fontSize: '0.6rem', fontWeight: 600 }}
                    >
                        AWS
                    </motion.div>
                </div>
            </motion.div>

            {/* Flying Nodes outside CV */}
            <motion.div
                initial={{ opacity: 0, x: -150, y: -50, scale: 0 }}
                whileInView={{
                    opacity: [0, 1, 1, 0],
                    x: [-150, -50, -10],
                    y: [-50, -20, 85],
                    scale: [0, 1, 1, 0]
                }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, times: [0, 0.2, 0.8, 1], ease: "easeInOut" }}
                style={{
                    position: 'absolute',
                    padding: '6px 14px',
                    background: 'var(--bg-deep)',
                    border: '1px solid var(--accent-cyan)',
                    color: 'var(--accent-cyan)',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    zIndex: 10,
                    boxShadow: '0 0 15px rgba(0, 229, 255, 0.3)'
                }}
            >
                React
            </motion.div>

            <motion.div
                initial={{ opacity: 0, x: -180, y: 50, scale: 0 }}
                whileInView={{
                    opacity: [0, 1, 1, 0],
                    x: [-180, -80, 50],
                    y: [50, 20, 85],
                    scale: [0, 1, 1, 0]
                }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, delay: 0.7, times: [0, 0.2, 0.8, 1], ease: "easeInOut" }}
                style={{
                    position: 'absolute',
                    padding: '6px 14px',
                    background: 'var(--bg-deep)',
                    border: '1px solid var(--accent-violet)',
                    color: 'var(--accent-violet)',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    zIndex: 10,
                    boxShadow: '0 0 15px rgba(255, 0, 255, 0.3)'
                }}
            >
                Python
            </motion.div>

            <motion.div
                initial={{ opacity: 0, x: 150, y: -20, scale: 0 }}
                whileInView={{
                    opacity: [0, 1, 1, 0],
                    x: [150, 80, 100],
                    y: [-20, 0, 85],
                    scale: [0, 1, 1, 0]
                }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, delay: 1.4, times: [0, 0.2, 0.8, 1], ease: "easeInOut" }}
                style={{
                    position: 'absolute',
                    padding: '6px 14px',
                    background: 'var(--bg-deep)',
                    border: '1px solid var(--accent-amber)',
                    color: 'var(--accent-amber)',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    zIndex: 10,
                    boxShadow: '0 0 15px rgba(255, 221, 0, 0.3)'
                }}
            >
                AWS
            </motion.div>
        </div>
    );
};

const WhatsNextSection = () => {
    return (
        <section className="section" style={{ background: 'var(--bg-deep)' }}>
            <div className="container">
                <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={staggerContainer} style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>

                    <motion.div variants={fadeUp} style={{ marginBottom: '4rem' }}>
                        <h2 className="section-title">What's Next?</h2>
                        <p className="paragraph" style={{ maxWidth: '600px', margin: '0 auto' }}>
                            Flowjob is continuously evolving. Here is a glimpse into the roadmap for what is coming next to the platform.
                        </p>
                    </motion.div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
                        {/* Card 1 */}
                        <motion.div variants={fadeUp} className="feature-card" style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            borderRadius: '16px',
                            padding: '2.5rem 2rem',
                            textAlign: 'left',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'var(--accent-cyan)' }} />
                            <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>One-click CV Tailoring</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6 }}>
                                Instantly adapt your CV to match the specific requirements and semantic keywords of any job description, directly within the browser.
                            </p>
                        </motion.div>

                        {/* Card 2 */}
                        <motion.div variants={fadeUp} className="feature-card" style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            borderRadius: '16px',
                            padding: '2.5rem 2rem',
                            textAlign: 'left',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'var(--accent-violet)' }} />
                            <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Deep Recommendation AI</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6 }}>
                                Move beyond basic skill matching. The next iteration will analyze the full semantic context of both your professional profile and the job offer.
                            </p>
                        </motion.div>
                    </div>

                    <motion.div variants={fadeUp} style={{ padding: '3rem', background: 'linear-gradient(180deg, rgba(0,229,255,0.05) 0%, transparent 100%)', borderRadius: '24px', border: '1px solid rgba(0,229,255,0.1)' }}>
                        <h3 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Join the Journey</h3>
                        <p style={{ fontWeight: 400, color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
                            Not just a job search tool, but an intelligent career interface.
                        </p>
                        <Link to="/get-started" className="btn btn-primary" style={{ fontSize: '1.2rem', padding: '1.2rem 3rem' }}>
                            Start your journey →
                        </Link>
                    </motion.div>

                </motion.div>
            </div>
        </section>
    );
};

export default function Story() {
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
    }, []);

    return (
        <div className="page">
            {/* BIO */}
            <section className="section-hero">
                <div className="hero-glow" />
                {symbols.map((sym, i) => (
                    <FloatingSymbol key={i} {...sym} />
                ))}
                <div className="container" style={{ position: 'relative', zIndex: 10 }}>
                    <motion.div
                        initial="hidden" animate="show" variants={staggerContainer}
                        className="hero-content"
                    >
                        <div className="author-section-wrapper">
                            <motion.div variants={fadeUp} className="avatar-wrapper-absolute">
                                {!imageError && (
                                    <img
                                        src="https://github.com/rjgrajewski.png"
                                        alt="Rafal"
                                        className="avatar"
                                        onError={() => setImageError(true)}
                                    />
                                )}
                                {imageError && <div className="avatar-fallback">RG</div>}
                            </motion.div>

                            <motion.h1 variants={fadeUp} className="heading-bio">
                                Hello <span className="gradient-text">World!</span>
                            </motion.h1>

                            <motion.div variants={fadeUp} className="author-box-redesign">
                                <div className="author-text">
                                    <p className="greeting">I'm Rafal, the builder behind flowjob.it</p>
                                    <p className="bio">
                                        Besides being a data analyst by profession, I am a music producer by passion. I also enjoy video editing and experimenting with generative AI. I like building things that make sense. Sometimes that are songs, and sometimes applications like this one.
                                    </p>
                                </div>
                                <div className="tech-badge">
                                    Python • SQL • AWS • AI
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* THE IDEA */}
            <section className="section" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                <div className="container">
                    <motion.div
                        initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
                        className="two-col"
                    >
                        <motion.div variants={fadeUp} className="col-left">
                            <h2 className="section-title">The Idea</h2>
                            <p className="paragraph">Some time ago I decided to validate myself on the job market.</p>
                            <p className="paragraph">I realized very quickly, that most of job boards which promise you to suggest the best matching positions for you, are not doing that very well.</p>
                            <blockquote className="quote">
                                "We have a job just for you! Because you say you know SQL, check out this opening which also requires fluency in Swedish and 5 years of experience with AWS."
                            </blockquote>
                            <p className="paragraph">That was when it came to my mind, that it could be done differently.</p>
                        </motion.div>
                        <motion.div variants={fadeUp} className="col-right">
                            <WaveformVisual />
                        </motion.div>
                    </motion.div>
                </div>
            </section>


            {/* THE FOUNDATION: DATA MODEL */}
            <section className="section" style={{ background: 'var(--bg-deep)' }}>
                <div className="container">
                    <motion.div
                        initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
                        className="two-col"
                        style={{ flexDirection: 'row-reverse' }}
                    >
                        <motion.div variants={fadeUp} className="col-left">
                            <h2 className="section-title">Logical Layer</h2>
                            <p className="paragraph">I didn’t want to build “another job board.” The internet doesn’t need one. What I was intented to do was to build a logical layer between the candidate and the job listing.</p>
                            <p className="paragraph">Job offers are not just text — they are already data. They just aren’t treated that way. If something can be parsed, normalized, and modeled, it can be queried properly. And once you can query it properly, filtering, comparison, and matching start to actually make sense.</p>
                            <p className="highlight-text">
                                That’s why the foundation of flowjob is not a list of job ads. The foundation is a data model.
                            </p>
                        </motion.div>
                        <motion.div variants={fadeUp} className="col-right">
                            <div className="code-window">
                                <div className="code-header">
                                    <span className="dot-red" /> <span className="dot-yellow" /> <span className="dot-green" />
                                    <span className="code-title">job_offer.json</span>
                                </div>
                                <pre className="code-body">
                                    {`{
  "id": "offer_9f8a",
  "title": "Data Engineer",
  "stack": [
    { "skill": "SQL", "required": true },
    { "skill": "Python", "required": true },
    { "skill": "AWS", "required": true }
  ],
  "parsed": true,
  "normalized": true
}`}
                                </pre>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* PREPARING THE SCRAPER */}
            <section className="section" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                <div className="container">
                    <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} className="two-col">
                        <motion.div variants={fadeUp} className="col-left">
                            <h2 className="section-title">Preparing the Scraper</h2>
                            <p className="paragraph">While I was exploring the job market, I noticed that most of openings that were close to my profile were often requiring an experience in web scraping. I decided to solve both of my problems at once and build one to collect the necessary data for further processing.</p>
                            <p className="paragraph">For the implementation, I chose Python - both for its versatility and because adding this skill to my profile could strengthen my position on the job market.</p>
                            <p className="paragraph">I had previously completed a fundamentals course, but developing a product that can potentially improve my own workflow was what I needed to actually understand the language instead of just learning on abstract examples.</p>
                        </motion.div>
                        <motion.div variants={fadeUp} className="col-right">
                            <DataFlowDecoration />
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* ARCHITECTURE & AUTOMATION */}
            <section className="section" style={{ background: 'var(--bg-deep)' }}>
                <div className="container">
                    <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={staggerContainer}>
                        <motion.h2 variants={fadeUp} className="section-title" style={{ textAlign: 'center' }}>Cloud Automation</motion.h2>
                        <p className="paragraph">When my scraper was ready, my satisfaction from its proper functioning was proportional to my worries about its time of execution. Collecting data from a thousands of listings was taking hours, during which my computer was practically unusable.</p>
                        <p className="paragraph">I decided to move the scraper into the cloud, and AWS seemed like another opportunity to gain some valuable experience. After countless conversations with ChatGPT, I learned that AWS Lambda was not a viable option, as the daily refresh process removes outdated listings and ingests hundreds of new ones, which takes roughly an hour to complete, far beyond Lambda’s 15 minute execution limit.</p>
                        <p className="paragraph">Instead, I deployed the scraper as a containerized workload on AWS Fargate (via ECS). This serverless container approach gives me full control over runtime and isolation while keeping the operational overhead minimal and the workload easily scalable when needed.</p>
                        <motion.div variants={fadeUp}>
                            <NeonCloudDecoration />
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* TACKLING SKILL CHAOS WITH AI */}
            <TacklingSkillChaos />

            {/* VIBECODING THREAD */}
            <VibecodingSection />

            {/* FRONTEND VIBE & D3 */}
            <DesigningExperienceSection />

            {/* BACKEND RECOMMENDATION */}
            <section className="section" style={{ background: 'var(--bg-deep)' }}>
                <div className="container">
                    <motion.div
                        initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
                        className="two-col"
                    >
                        <motion.div variants={fadeUp} className="col-left">
                            <h2 className="section-title">Pragmatic Core</h2>
                            <p className="paragraph">Behind this playful surface sits a very pragmatic core. The heart of the recommendation logic lives directly in PostgreSQL.</p>
                            <p className="paragraph">It aggregates the market to surface hot tech initially. Once you select a skill, the logic shifts into personalization mode, finding real co-occurrence patterns in job offers. This creates a recommendation loop that feels predictive without heavy ML infrastructure.</p>
                            <p className="paragraph">The Match Score is computed in real time on the frontend, making the experience feel immediate.</p>
                        </motion.div>
                        <motion.div variants={fadeUp} className="col-right">
                            <div className="match-score-box">
                                <motion.div
                                    className="score-circle-foreground"
                                    initial={{ pathLength: 0 }}
                                    whileInView={{ pathLength: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 2, ease: "easeOut" }}
                                >
                                    <svg viewBox="0 0 100 100" className="svg-score">
                                        <motion.circle
                                            cx="50" cy="50" r="45"
                                            fill="none" stroke="var(--accent-cyan)" strokeWidth="8"
                                            strokeDasharray="283"
                                            initial={{ strokeDashoffset: 283 }}
                                            animate={{ strokeDashoffset: 40 }}
                                            transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                                        />
                                    </svg>
                                    <div className="score-text">98%</div>
                                </motion.div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>



            {/* CV BUILDER & NEXT STEPS */}
            <section className="section" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                <div className="container">
                    <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={staggerContainer} className="two-col" style={{ alignItems: 'center' }}>
                        <motion.div variants={fadeUp} className="col-left">
                            <h2 className="section-title">The Last Mile: CV Builder</h2>
                            <p className="paragraph">
                                Born from a simple observation: right before applying, it often makes sense to manually tailor your document. flowjob renders the CV directly in the browser for true live preview.
                            </p>
                            <p className="paragraph">
                                Skills selected on the map don’t disappear into a black box — they flow directly into the CV builder. In the end, it turns your activity inside flowjob into a market-ready asset.
                            </p>
                        </motion.div>
                        <motion.div variants={fadeUp} className="col-right">
                            <CVBuilderDecoration />
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* WHAT'S NEXT ROADMAP */}
            <WhatsNextSection />

            {/* SUPPORT OPTIONS */}
            < section className="section-sm" style={{ background: 'var(--bg-deep)' }}>
                <div className="container" style={{ textAlign: 'center' }}>
                    <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <h3 style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '1rem', fontWeight: 600 }}>Support Flowjob.it</h3>
                        <p className="paragraph" style={{ marginBottom: '2rem' }}>
                            If you find my work useful, you can support its further development.
                        </p>
                        <a
                            href="https://buymeacoffee.com/rj.grajewski"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn"
                            style={{
                                backgroundColor: '#FFDD00',
                                color: '#000000',
                                border: 'none',
                                fontWeight: 700,
                                padding: '0.65rem 1.5rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.8rem',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 221, 0, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            buymeacoffee.com
                        </a>
                    </motion.div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="footer">
                <div className="container" style={{ textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <span style={{ opacity: 0.6 }}>Proudly built by Rafal Grajewski.</span><br />
                        © 2026 <strong style={{ color: 'var(--text-primary)' }}>flowjob</strong>.
                    </p>
                </div>
            </footer>
        </div >
    );
}
