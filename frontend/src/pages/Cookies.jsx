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

export default function Cookies() {
    return (
        <div className="page" style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
            <section style={{ flex: 1, padding: '4rem 1rem' }}>
                <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <motion.div initial="hidden" animate="show" variants={staggerContainer}>

                        <motion.div variants={fadeUp} style={{ marginBottom: '3rem' }}>
                            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1rem' }}>
                                Cookie &amp; Storage <span className="gradient-text">Policy</span>
                            </h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                                Last updated: March 15, 2026
                            </p>
                        </motion.div>

                        <motion.div variants={fadeUp} className="legal-section">
                            <h2 className="legal-heading">1. Overview</h2>
                            <p className="legal-text">
                                This policy explains how flowjob.it uses cookies and similar browser storage technologies (such as localStorage) to operate the service. We are committed to transparency about what data is stored on your device and why.
                            </p>
                        </motion.div>

                        <motion.div variants={fadeUp} className="legal-section">
                            <h2 className="legal-heading">2. Cookies</h2>

                            <h3 className="legal-subheading">Authentication Cookie</h3>
                            <p className="legal-text">
                                We use a single first-party cookie to manage your authenticated session:
                            </p>
                            <div className="legal-table-wrapper">
                                <table className="legal-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Purpose</th>
                                            <th>Duration</th>
                                            <th>Type</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td><code>flowjob_auth</code></td>
                                            <td>Keeps you logged in across page visits</td>
                                            <td>72 hours</td>
                                            <td>Strictly necessary</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <p className="legal-text">
                                This cookie is set with the <code>HttpOnly</code>, <code>Secure</code>, and <code>SameSite=Strict</code> flags. It cannot be accessed by JavaScript and is only sent over encrypted HTTPS connections. As a strictly necessary cookie, it does not require consent under the ePrivacy Directive (Art. 5(3)).
                            </p>

                            <h3 className="legal-subheading">Third-Party Cookies</h3>
                            <p className="legal-text">
                                We do not set any third-party cookies. We do not use analytics, advertising, or social media tracking services.
                            </p>
                        </motion.div>

                        <motion.div variants={fadeUp} className="legal-section">
                            <h2 className="legal-heading">3. Local Storage</h2>
                            <p className="legal-text">
                                We use your browser's <code>localStorage</code> to cache session-related data for a faster experience. All stored data is strictly necessary for the service:
                            </p>
                            <div className="legal-table-wrapper">
                                <table className="legal-table">
                                    <thead>
                                        <tr>
                                            <th>Key</th>
                                            <th>Purpose</th>
                                            <th>Category</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td><code>flowjob_user</code></td>
                                            <td>Caches basic account info (id, email) to avoid redundant server calls</td>
                                            <td>Strictly necessary</td>
                                        </tr>
                                        <tr>
                                            <td><code>flowjob_profile</code></td>
                                            <td>Caches your CV/profile data for instant loading</td>
                                            <td>Strictly necessary</td>
                                        </tr>
                                        <tr>
                                            <td><code>flowjob_onboarding_done</code></td>
                                            <td>Tracks whether you have completed the onboarding flow</td>
                                            <td>Strictly necessary</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <p className="legal-text">
                                This data is removed when you log out. You can also clear it manually through your browser's developer tools or settings.
                            </p>
                        </motion.div>

                        <motion.div variants={fadeUp} className="legal-section">
                            <h2 className="legal-heading">4. Third-Party Connections</h2>
                            <p className="legal-text">
                                While these services do not set cookies, your browser makes network requests to them, which may transmit your IP address:
                            </p>
                            <ul className="legal-list">
                                <li><strong>Google Fonts</strong> (<code>fonts.googleapis.com</code>, <code>fonts.gstatic.com</code>) — used to load the Sora, Inter, Outfit, Roboto, and Merriweather typefaces.</li>
                                <li><strong>Cloudflare CDN</strong> (<code>cdnjs.cloudflare.com</code>) — used to load the Roboto font for PDF generation in the CV Builder.</li>
                            </ul>
                        </motion.div>

                        <motion.div variants={fadeUp} className="legal-section">
                            <h2 className="legal-heading">5. Managing Storage</h2>
                            <p className="legal-text">
                                You can control and delete cookies and localStorage data through your browser settings. Blocking or deleting the authentication cookie will require you to log in again. Clearing localStorage will reset cached profile data, which will be re-fetched from the server on your next visit.
                            </p>
                        </motion.div>

                        <motion.div variants={fadeUp} className="legal-section">
                            <h2 className="legal-heading">6. Future Changes</h2>
                            <p className="legal-text">
                                If we introduce analytics, marketing, or other non-essential cookies or tracking technologies in the future, we will update this policy and present a consent banner before activating them. Non-essential cookies will never be set without your explicit prior consent.
                            </p>
                        </motion.div>

                        <motion.div variants={fadeUp} className="legal-section">
                            <p className="legal-text">
                                For questions about this policy, see our <Link to="/privacy" className="legal-link">Privacy Policy</Link> or contact us at <a href="mailto:privacy@flowjob.it" className="legal-link">privacy@flowjob.it</a>.
                            </p>
                        </motion.div>

                    </motion.div>
                </div>
            </section>
        </div>
    );
}
