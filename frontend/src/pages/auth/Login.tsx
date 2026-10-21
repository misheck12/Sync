import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { isPlatformHost } from '../../utils/platformAccess';
import {
  Loader2,
  Eye,
  EyeOff,
  GraduationCap,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import './Login.css';

const DEFAULT_TENANT_SLUG = 'lyangend';

const resolveTenantSlug = () => {
  const host = window.location.hostname.toLowerCase();
  if (host.endsWith('.syncsos.com')) {
    const subdomain = host.split('.')[0];
    if (subdomain && !['www', 'api', 'ops'].includes(subdomain)) return subdomain;
  }

  const storedSlug = localStorage.getItem('tenantSlug');
  if (storedSlug && storedSlug.trim()) return storedSlug.trim();

  const normalizedHost = host.split(':')[0];
  const candidate = normalizedHost.includes('.') ? normalizedHost.split('.')[0] : normalizedHost;

  if (candidate && !['localhost', '127', '0', 'www'].includes(candidate)) {
    return candidate;
  }

  return DEFAULT_TENANT_SLUG;
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [publicSettings, setPublicSettings] = useState<{ schoolName?: string; logoUrl?: string }>({});
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isPlatformHost()) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const slug = resolveTenantSlug();
    if (!slug) return;
    localStorage.setItem('tenantSlug', slug);

    api.get('/settings/public', { headers: { 'X-Tenant-Slug': slug } })
      .then(r => setPublicSettings(r.data))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const slug = resolveTenantSlug();
      if (!slug) {
        setError('Unable to identify your school portal. Please open the correct school link.');
        setLoading(false);
        return;
      }

      localStorage.removeItem('platformSession');
      localStorage.setItem('tenantSlug', slug);
      const response = await api.post('/auth/login', { email, password });

      const { token, user } = response.data;
      login(token, user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="school-login">
      <section className="school-login__story" aria-label="Welcome to your school portal">
        <div className="school-login__story-inner">
          <div className="school-login__brand school-login__brand--light">
            <div className="school-login__emblem">
              {publicSettings.logoUrl ? <img src={publicSettings.logoUrl} alt="" /> : <GraduationCap size={26} strokeWidth={1.7} aria-hidden="true" />}
            </div>
            <div className="school-login__brand-copy">
              <span className="school-login__brand-name">{publicSettings.schoolName || 'Sync School Portal'}</span>
              <span className="school-login__brand-caption">SCHOOL PORTAL</span>
            </div>
          </div>

          <div className="school-login__story-body">
            <div className="school-login__eyebrow"><span className="school-login__eyebrow-line" /> A BETTER WAY TO GROW</div>
            <h1>Every school day,<br /><em>more in sync.</em></h1>
            <p>A thoughtful space for the people who make learning happen. Your school, your community, all in one place.</p>

            <div className="school-login__illustration" aria-hidden="true">
              <div className="school-login__orbit school-login__orbit--outer" />
              <div className="school-login__orbit school-login__orbit--inner" />
              <div className="school-login__illustration-spark school-login__illustration-spark--one">✳</div>
              <div className="school-login__illustration-spark school-login__illustration-spark--two">✳</div>
              <div className="school-login__illustration-card school-login__illustration-card--back" />
              <div className="school-login__illustration-card school-login__illustration-card--front">
                <div className="school-login__illustration-icon"><BookOpen size={31} strokeWidth={1.6} /></div>
                <span className="school-login__illustration-rule school-login__illustration-rule--long" />
                <span className="school-login__illustration-rule" />
                <span className="school-login__illustration-rule school-login__illustration-rule--short" />
                <div className="school-login__illustration-seal"><Sparkles size={22} strokeWidth={1.7} /></div>
              </div>
              <div className="school-login__illustration-label">A place to belong <span>↗</span></div>
            </div>
          </div>

          <div className="school-login__story-footer">
            <span>MADE FOR BETTER SCHOOL DAYS</span>
            <span>© {new Date().getFullYear()} Livingi Labz</span>
          </div>
        </div>
      </section>

      <section className="school-login__entry" aria-labelledby="school-login-heading">
        <div className="school-login__entry-inner">
          <div className="school-login__brand school-login__brand--mobile">
            <div className="school-login__emblem">
              {publicSettings.logoUrl ? <img src={publicSettings.logoUrl} alt="" /> : <GraduationCap size={26} strokeWidth={1.7} aria-hidden="true" />}
            </div>
            <div className="school-login__brand-copy">
              <span className="school-login__brand-name">{publicSettings.schoolName || 'Sync School Portal'}</span>
              <span className="school-login__brand-caption">SCHOOL PORTAL</span>
            </div>
          </div>

          <div className="school-login__form-wrap">
            <span className="school-login__welcome-icon" aria-hidden="true"><BookOpen size={25} strokeWidth={1.6} /></span>
            <p className="school-login__kicker">WELCOME BACK</p>
            <h2 id="school-login-heading">Good to see you again.</h2>
            <p className="school-login__intro">Sign in to your school workspace to pick up where you left off.</p>

            <form onSubmit={handleSubmit} className="school-login__form">
              {error && <div className="school-login__error" role="alert">{error}</div>}
              <div className="school-login__field">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@school.edu"
                />
              </div>

              <div className="school-login__field">
                <label htmlFor="password">Password</label>
                <div className="school-login__password">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="school-login__password-toggle"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="school-login__submit">
                {loading ? <><Loader2 size={20} className="school-login__spinner" aria-hidden="true" /> Signing in…</> : <>Sign in to your portal <ArrowRight size={19} aria-hidden="true" /></>}
              </button>
            </form>

            <div className="school-login__help">
              <ShieldCheck size={19} strokeWidth={1.7} aria-hidden="true" />
              <p>Having trouble signing in? Contact your school administrator for help with your account.</p>
            </div>
          </div>

          <div className="school-login__entry-footer"><span>SECURE SCHOOL ACCESS</span><span>Powered by <strong>Sync</strong></span></div>
        </div>
      </section>
    </main>
  );
};

export default Login;
