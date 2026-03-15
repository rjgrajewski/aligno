import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Legal.css';

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

export default function Privacy() {
    return (
        <div className="page" style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
            <section style={{ flex: 1, padding: '4rem 1rem' }}>
                <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <motion.div initial="hidden" animate="show" variants={staggerContainer}>

                        <motion.div variants={fadeUp} style={{ marginBottom: '3rem' }}>
                            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1rem' }}>
                                Privacy <span className="gradient-text">Policy</span>
                            </h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                                Last updated: March 15, 2026
                            </p>
                        </motion.div>

                        <motion.div variants={fadeUp} className="legal-section">
                            <h2 className="legal-heading">1. Data Controller</h2>
                            <p className="legal-text">
                                The data controller for personal data collected through flowjob.it is Rafal Grajewski. For any privacy-related inquiries, please contact us at <a href="mailto:privacy@flowjob.it" className="legal-link">privacy@flowjob.it</a>.
                            </p>
                        </motion.div>

                        <motion.div variants={fadeUp} className="legal-section">
                            <h2 className="legal-heading">2. Data We Collect</h2>
                            <p className="legal-text">We collect and process the following categories of personal data:</p>
                            <ul className="legal-list">
                                <li><strong>Account data</strong> — email address and password hash, collected during registration.</li>
                                <li><strong>Profile data</strong> — professional information you provide voluntarily (name, experience, education, skills, data processing clause for CV).</li>
                                <li><strong>Skill preferences</strong> — skills you select, highlight, skip, or mark as avoided through the swipe interface.</li>
                                <li><strong>Technical data</strong> — IP address and browser metadata transmitted automatically when connecting to our servers.</li>
                            </ul>
                        </motion.div>

                        <motion.div variants={fadeUp} className="legal-section">
                            <h2 className="legal-heading">3. Purpose and Legal Basis</h2>
                            <p className="legal-text">We process your data for the following purposes:</p>
                            <ul className="legal-list">
                                <li><strong>Providing the service</strong> — matching your skills with job offers, generating your CV, and delivering a personalized experience. Legal basis: contract performance (Art. 6(1)(b) GDPR).</li>
                                <li><strong>Account management</strong> — authentication and maintaining your session. Legal basis: contract performance.</li>
                                <li><strong>Service improvement</strong> — understanding usage patterns to improve the platform. Legal basis: legitimate interest (Art. 6(1)(f) GDPR).</li>
                            </ul>
                        </motion.div>

                        <motion.div variants={fadeUp} className="legal-section">
                            <h2 className="legal-heading">4. Data Storage and Security</h2>
                            <p className="legal-text">
                                Your data is stored in a PostgreSQL database hosted on Amazon Web Services (AWS) with encrypted connections (SSL/TLS). Passwords are stored as salted bcrypt hashes and are never stored in plain text. Authentication uses JSON Web Tokens (JWT) transmitted via secure HttpOnly cookies.
                            </p>
                        </motion.div>

                        <motion.div variants={fadeUp} className="legal-section">
                            <h2 className="legal-heading">5. Client-Side Storage</h2>
                            <p className="legal-text">
                                We use your browser's local storage to maintain session state and cache your profile data for a better user experience. This storage is strictly necessary for the service to function and does not require consent under the ePrivacy Directive (Art. 5(3)). For details, see our <Link to="/cookies" className="legal-link">Cookie &amp; Storage Policy</Link>.
                            </p>
                        </motion.div>

                        <motion.div variants={fadeUp} className="legal-section">
                            <h2 className="legal-heading">6. Third-Party Services</h2>
                            <p className="legal-text">We use the following third-party services:</p>
                            <ul className="legal-list">
                                <li><strong>Google Fonts</strong> — to deliver typography. Google may receive your IP address when fonts are loaded. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="legal-link">Google Privacy Policy</a>.</li>
                                <li><strong>Cloudflare CDN</strong> — to serve font files for PDF generation. <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" className="legal-link">Cloudflare Privacy Policy</a>.</li>
                                <li><strong>Amazon Web Services</strong> — for hosting and database infrastructure. <a href="https://aws.amazon.com/privacy/" target="_blank" rel="noopener noreferrer" className="legal-link">AWS Privacy Policy</a>.</li>
                            </ul>
                            <p className="legal-text">
                                We do not use any analytics, tracking, advertising, or social media plugins. No data is shared with third parties for marketing purposes.
                            </p>
                        </motion.div>

                        <motion.div variants={fadeUp} className="legal-section">
                            <h2 className="legal-heading">7. Data Retention</h2>
                            <p className="legal-text">
                                Your personal data is retained for as long as your account is active. If you request account deletion, all associated data will be permanently removed within 30 days.
                            </p>
                        </motion.div>

                        <motion.div variants={fadeUp} className="legal-section">
                            <h2 className="legal-heading">8. Your Rights</h2>
                            <p className="legal-text">Under GDPR, you have the right to:</p>
                            <ul className="legal-list">
                                <li><strong>Access</strong> — request a copy of your personal data.</li>
                                <li><strong>Rectification</strong> — correct inaccurate data.</li>
                                <li><strong>Erasure</strong> — request deletion of your data ("right to be forgotten").</li>
                                <li><strong>Data portability</strong> — receive your data in a structured, machine-readable format.</li>
                                <li><strong>Restriction</strong> — limit processing of your data.</li>
                                <li><strong>Objection</strong> — object to processing based on legitimate interest.</li>
                            </ul>
                            <p className="legal-text">
                                To exercise any of these rights, contact us at <a href="mailto:privacy@flowjob.it" className="legal-link">privacy@flowjob.it</a>.
                            </p>
                        </motion.div>

                        <motion.div variants={fadeUp} className="legal-section">
                            <h2 className="legal-heading">9. Changes to This Policy</h2>
                            <p className="legal-text">
                                We may update this privacy policy from time to time. Changes will be posted on this page with an updated revision date. Continued use of the service after changes constitutes acceptance of the updated policy.
                            </p>
                        </motion.div>

                    </motion.div>
                </div>
            </section>
        </div>
    );
}
