import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client.js';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState(token ? 'loading' : 'missing');
  const [email, setEmail] = useState(null);
  const [error, setError] = useState('');
  const ranRef = useRef(false);

  useEffect(() => {
    if (!token || ranRef.current) return;
    ranRef.current = true;
    api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(({ data }) => { setStatus('verified'); setEmail(data.email); })
      .catch((err) => {
        setError(err.response?.data?.detail || 'Verification failed');
        setStatus('failed');
      });
  }, [token]);

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        {status === 'loading' && (
          <>
            <p className="kicker center">— One moment</p>
            <h2 className="display sm center">Verifying your <em>email</em>…</h2>
          </>
        )}
        {status === 'verified' && (
          <>
            <p className="kicker center">— All set</p>
            <h2 className="display sm center">You're <em>in</em>.</h2>
            <p style={{ color: 'var(--muted)', margin: '20px 0 32px' }}>
              {email ? <><strong style={{ color: 'var(--ink)' }}>{email}</strong> is verified. </> : ''}
              Welcome to Chhatak.
            </p>
            <Link to="/" className="btn-solid accent full">Take me home</Link>
          </>
        )}
        {status === 'failed' && (
          <>
            <p className="kicker center">— Hmm</p>
            <h2 className="display sm center">Link didn't <em>work</em>.</h2>
            <p style={{ color: '#f77', margin: '20px 0 24px' }}>{error}</p>
            <p style={{ color: 'var(--muted)', marginBottom: 24, fontSize: 14 }}>
              The link may have expired or already been used. You can request a new one from your account.
            </p>
            <Link to="/" className="btn-solid accent full">Back to home</Link>
          </>
        )}
        {status === 'missing' && (
          <>
            <p className="kicker center">— Missing token</p>
            <h2 className="display sm center">Nothing to <em>verify</em>.</h2>
            <p style={{ color: 'var(--muted)', margin: '20px 0 24px' }}>Open the link in the verification email you received.</p>
            <Link to="/" className="btn-solid accent full">Back to home</Link>
          </>
        )}
      </div>
    </div>
  );
}
