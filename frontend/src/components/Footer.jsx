import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
    return (
        <footer className="site-footer">
            <div className="container">
                <div className="footer-links">
                    <Link to="/privacy" className="footer-link">Privacy Policy</Link>
                    <span className="footer-divider">·</span>
                    <Link to="/cookies" className="footer-link">Cookie &amp; Storage Policy</Link>
                </div>
                <p className="footer-copy">
                    <span style={{ opacity: 0.6 }}>Proudly built by Rafal Grajewski.</span><br />
                    © 2026 <strong style={{ color: 'var(--text-primary)' }}>flowjob</strong>.
                </p>
            </div>
        </footer>
    );
}
