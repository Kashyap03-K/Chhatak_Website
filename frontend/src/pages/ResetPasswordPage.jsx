import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/client.js';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <p className="kicker center">— Missing token</p>
          <h2 className="display sm center">Nothing to <em>reset</em>.</h2>
          <p style={{ color: 'var(--muted)', margin: '20px 0 24px' }}>
            Open the reset link from the email we sent.
          </p>
          <Link to="/forgot-password" className="btn-solid accent full">Request a new link</Link>
        </div>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post('/auth/reset-password', { token, password });
      // Auto-login: store the returned token so the user lands signed in.
      localStorage.setItem('access_token', data.access_token);
      const userData = { id: data.user_id, name: data.name, email: '', is_admin: data.is_admin };
      localStorage.setItem('user', JSON.stringify(userData));
      setDone(true);
      setTimeout(() => { navigate('/'); window.location.reload(); }, 1600);
    } catch (err) {
      setError(err.response?.data?.detail || 'Reset failed. The link may have expired.');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <p className="kicker center">— All set</p>
          <h2 className="display sm center">Password <em>updated</em>.</h2>
          <p style={{ color: 'var(--muted)', margin: '20px 0 32px' }}>Signing you in…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="kicker center">— New password</p>
        <h2 className="display sm center">Set a <em>new one</em>.</h2>
        <p style={{ color: 'var(--muted)', margin: '16px 0 24px', textAlign: 'center' }}>
          Pick something you'll remember this time.
        </p>
        <form onSubmit={submit} className="auth-form">
          <div className="form-group">
            <label htmlFor="rp-pw">New password</label>
            <input
              id="rp-pw"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="rp-cpw">Confirm</label>
            <input
              id="rp-cpw"
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter"
            />
          </div>
          <p className="form-hint">
            At least 8 characters, with one uppercase letter, one lowercase letter, and one digit.
          </p>
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" className="btn-solid accent full" disabled={busy}>
            {busy ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}
