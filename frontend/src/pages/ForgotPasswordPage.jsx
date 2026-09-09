import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('sending');
    try {
      await api.post('/auth/forgot-password', { email });
      setStatus('sent');
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Try again.');
      setStatus('error');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {status === 'sent' ? (
          <div style={{ textAlign: 'center' }}>
            <p className="kicker center">— Check your inbox</p>
            <h2 className="display sm center">Reset link <em>sent</em>.</h2>
            <p style={{ color: 'var(--muted)', margin: '20px 0 32px' }}>
              If <strong style={{ color: 'var(--ink)' }}>{email}</strong> matches an account, we've emailed a link to reset your password. It's good for one hour.
            </p>
            <Link to="/" className="btn-solid accent full">Back to home</Link>
          </div>
        ) : (
          <>
            <p className="kicker center">— Password reset</p>
            <h2 className="display sm center">Forgot your <em>password</em>?</h2>
            <p style={{ color: 'var(--muted)', margin: '16px 0 24px', textAlign: 'center' }}>
              Enter your email and we'll send you a link to set a new one.
            </p>
            <form onSubmit={submit} className="auth-form">
              <div className="form-group">
                <label htmlFor="fp-email">Email</label>
                <input
                  id="fp-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoFocus
                />
              </div>
              {error && <div className="auth-error">{error}</div>}
              <button type="submit" className="btn-solid accent full" disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
            <p className="auth-switch" style={{ textAlign: 'center', marginTop: 20 }}>
              Remembered it? <Link to="/login" className="btn-link">Sign in →</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
