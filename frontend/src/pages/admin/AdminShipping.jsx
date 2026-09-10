import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';

const METHOD_META = {
  cod: {
    label: 'Cash on delivery',
    hint: "Charged when the customer pays the courier on arrival.",
  },
  online: {
    label: 'Pay online (UPI / cards / netbanking)',
    hint: 'Charged when the customer pays via Razorpay at checkout.',
  },
};

function Row({ method, cfg, onChange, onSave, saving, savedAt, error }) {
  const meta = METHOD_META[method];
  return (
    <div className="admin-form-card" style={{ marginBottom: 20 }}>
      <h3 style={{ margin: '0 0 6px' }}>{meta.label}</h3>
      <p style={{ color: 'var(--muted)', fontSize: 13, margin: '0 0 20px' }}>{meta.hint}</p>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor={`${method}-amount`}>Shipping charge (₹)</label>
          <input
            id={`${method}-amount`}
            type="number"
            min="0"
            step="1"
            value={cfg.amount}
            onChange={(e) => onChange({ ...cfg, amount: Number(e.target.value) || 0 })}
          />
        </div>
        <div className="form-group">
          <label htmlFor={`${method}-free`}>Free above (₹) — 0 to disable</label>
          <input
            id={`${method}-free`}
            type="number"
            min="0"
            step="1"
            value={cfg.free_above}
            onChange={(e) => onChange({ ...cfg, free_above: Number(e.target.value) || 0 })}
          />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
        <button
          type="button"
          className="btn-solid accent"
          disabled={saving}
          onClick={onSave}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        {savedAt && <span style={{ color: 'var(--muted)', fontSize: 13 }}>Saved.</span>}
        {error && <span style={{ color: '#c94a4a', fontSize: 13 }}>{error}</span>}
      </div>
    </div>
  );
}

export default function AdminShipping() {
  const [config, setConfig] = useState({
    cod: { amount: 49, free_above: 499 },
    online: { amount: 0, free_above: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState({ cod: {}, online: {} });

  useEffect(() => {
    api.get('/shipping/config').then(({ data }) => {
      const next = { ...config };
      for (const row of data) next[row.payment_method] = { amount: row.amount, free_above: row.free_above };
      setConfig(next);
    }).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveMethod = async (method) => {
    setSaveState((s) => ({ ...s, [method]: { saving: true } }));
    try {
      await api.put(`/shipping/admin/config/${method}`, {
        payment_method: method,
        amount: config[method].amount,
        free_above: config[method].free_above,
      });
      setSaveState((s) => ({ ...s, [method]: { savedAt: Date.now() } }));
      setTimeout(() => setSaveState((s) => ({ ...s, [method]: {} })), 2500);
    } catch (e) {
      setSaveState((s) => ({ ...s, [method]: { error: e.response?.data?.detail || 'Save failed' } }));
    }
  };

  return (
    <div className="section admin-page">
      <div className="container" style={{ maxWidth: 760 }}>
        <p className="kicker">— Admin</p>
        <h2 className="display sm">Shipping <em>charges</em>.</h2>
        <p style={{ color: 'var(--muted)', margin: '10px 0 32px' }}>
          <Link to="/admin" className="btn-link">← Back to dashboard</Link>
        </p>

        {loading ? (
          <p style={{ color: 'var(--muted)' }}>Loading…</p>
        ) : (
          <>
            <Row
              method="cod"
              cfg={config.cod}
              onChange={(next) => setConfig((c) => ({ ...c, cod: next }))}
              onSave={() => saveMethod('cod')}
              saving={!!saveState.cod.saving}
              savedAt={saveState.cod.savedAt}
              error={saveState.cod.error}
            />
            <Row
              method="online"
              cfg={config.online}
              onChange={(next) => setConfig((c) => ({ ...c, online: next }))}
              onSave={() => saveMethod('online')}
              saving={!!saveState.online.saving}
              savedAt={saveState.online.savedAt}
              error={saveState.online.error}
            />
            <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 24 }}>
              Changes take effect immediately for new orders. Orders already placed are unaffected.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
