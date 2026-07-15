import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';

export default function AuthDialog() {
  const { authDialog, closeAuthDialog, openAuthDialog, login, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');

  useEffect(() => {
    if (!authDialog) {
      setEmail(''); setPassword(''); setName(''); setPhone(''); setConfirm(''); setError(''); setVerifyEmail('');
    }
  }, [authDialog]);

  useEffect(() => {
    if (!authDialog) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') closeAuthDialog(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [authDialog, closeAuthDialog]);

  if (!authDialog) return null;

  const isLogin = authDialog === 'login';

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isLogin && password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setBusy(true);
    try {
      if (isLogin) {
        await login(email, password);
        closeAuthDialog();
      } else {
        await register(name, email, phone || null, password);
        setVerifyEmail(email);
      }
    } catch (err) {
      const msg = err.response?.data?.detail;
      setError(Array.isArray(msg) ? msg[0]?.msg || 'Failed' : msg || (isLogin ? 'Login failed' : 'Registration failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-dialog-backdrop" onMouseDown={closeAuthDialog} role="dialog" aria-modal="true" aria-label={isLogin ? 'Sign in' : 'Create account'}>
      <div className="auth-dialog" onMouseDown={(e) => e.stopPropagation()}>
        <button type="button" className="auth-dialog-close" aria-label="Close" onClick={closeAuthDialog}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>

        {verifyEmail ? (
          <div style={{ textAlign: 'center' }}>
            <p className="kicker center">— Almost there</p>
            <h2 className="display sm center">Check your <em>inbox</em>.</h2>
            <p style={{ color: 'var(--muted)', margin: '20px auto 8px', maxWidth: 360 }}>
              We just sent a verification link to <strong style={{ color: 'var(--ink)' }}>{verifyEmail}</strong>.
              Click it to activate your account.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: 13, margin: '0 auto 28px', maxWidth: 360 }}>
              You're already signed in — verifying your email just unlocks order updates and restock alerts.
            </p>
            <button type="button" className="btn-solid accent full" onClick={closeAuthDialog}>Got it</button>
            <button type="button" className="btn-link" style={{ marginTop: 12 }} onClick={async () => {
              try { await api.post('/auth/resend-verification', { email: verifyEmail }); alert('Verification email re-sent.'); }
              catch { alert('Could not resend right now.'); }
            }}>Resend email</button>
          </div>
        ) : (<>

        <p className="kicker center">— {isLogin ? 'Welcome back' : 'Join the coast'}</p>
        <h2 className="display sm center">{isLogin ? <>Sign <em>in</em>.</> : <>Create an <em>account</em>.</>}</h2>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={submit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="d-name">Full name</label>
              <input id="d-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
            </div>
          )}
          <div className="form-group">
            <label htmlFor="d-email">Email</label>
            <input id="d-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="d-phone">Phone (optional)</label>
              <input id="d-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
            </div>
          )}
          {isLogin ? (
            <div className="form-group">
              <label htmlFor="d-pw">Password</label>
              <input id="d-pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" />
            </div>
          ) : (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="d-pw">Password</label>
                  <input id="d-pw" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" aria-describedby="d-pw-hint" />
                </div>
                <div className="form-group">
                  <label htmlFor="d-cpw">Confirm</label>
                  <input id="d-cpw" type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter" />
                </div>
              </div>
              <p id="d-pw-hint" className="form-hint">
                At least 8 characters, with one uppercase letter, one lowercase letter, and one digit.
              </p>
            </>
          )}
          <button type="submit" className="btn-solid accent full" disabled={busy}>
            {busy ? (isLogin ? 'Signing in…' : 'Creating…') : (isLogin ? 'Sign in' : 'Create account')}
          </button>
        </form>

        <p className="auth-switch">
          {isLogin ? (
            <>Don't have an account? <button type="button" className="btn-link" onClick={() => { setError(''); openAuthDialog('register'); }}>Register →</button></>
          ) : (
            <>Already have an account? <button type="button" className="btn-link" onClick={() => { setError(''); openAuthDialog('login'); }}>Sign in →</button></>
          )}
        </p>
        </>)}
      </div>
    </div>
  );
}
