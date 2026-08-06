import { useState } from 'react';

export default function WholesalePage() {
  const [form, setForm] = useState({ name: '', business: '', email: '', phone: '', volume: '', message: '' });
  const [sent, setSent] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Wholesale enquiry — ${form.business || form.name}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nBusiness: ${form.business}\nEmail: ${form.email}\nPhone: ${form.phone}\nMonthly volume: ${form.volume}\n\n${form.message}`
    );
    window.location.href = `mailto:hello@chhatak.co?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <div className="wholesale-page">
      {/* BUY / CTA */}
      <section id="buy" className="buy section" style={{ paddingTop: 140 }}>
        <div className="container buy-grid">
          <div>
            <p className="kicker accent">— Available now</p>
            <h2 className="display sm">One pouch is <em>never</em> enough.</h2>
            <p className="lead-dark">Stock Chhatak in your café, gourmet store, or coastal resort. Complimentary shipping on wholesale orders above ₹9,999.</p>
            <div className="buy-actions">
              <a className="btn-solid accent" href="#enquire">Enquire now →</a>
              <a className="btn-link" href="mailto:hello@chhatak.co">hello@chhatak.co</a>
            </div>
          </div>

          <div className="buy-card">
            <img src="/images/packaging-front-back.png" alt="Chhatak packaging front and back" className="buy-card-img" loading="lazy" />
            <p className="kicker">— Combo</p>
            <h3 className="combo-title">Pack of three</h3>
            <p className="combo-sub">100g each · Indian Classic</p>
            <div className="combo-price">
              <span className="price-now">₹549</span>
              <span className="price-was">₹699</span>
            </div>
            <ul className="combo-list">
              <li>Complimentary shipping</li>
              <li>100% authentic Chhatak</li>
              <li>Easy returns within 7 days</li>
            </ul>
            <a className="btn-solid accent full" href="/#products">Grab the combo</a>
          </div>
        </div>
      </section>

      {/* WHOLESALE ENQUIRY */}
      <section id="enquire" className="section wholesale-enquire">
        <div className="container" style={{ maxWidth: 720 }}>
          <p className="kicker center">— Wholesale enquiry</p>
          <h2 className="display sm center">Get in <em>touch</em>.</h2>
          <p className="muted-text" style={{ textAlign: 'center', margin: '20px auto 40px', maxWidth: 480 }}>
            Tell us about your business. Our wholesale team gets back within one working day.
          </p>

          {sent && (
            <div className="auth-error" style={{ background: 'rgba(80,180,120,0.12)', borderColor: 'rgba(80,180,120,0.3)', color: '#8dc99a' }}>
              Opening your email client with the enquiry pre-filled. If nothing happens, email <a href="mailto:hello@chhatak.co" className="btn-link">hello@chhatak.co</a> directly.
            </div>
          )}

          <form onSubmit={submit} className="auth-form" style={{ marginTop: 24 }}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="w-name">Your name</label>
                <input id="w-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label htmlFor="w-business">Business / store</label>
                <input id="w-business" required value={form.business} onChange={(e) => setForm({ ...form, business: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="w-email">Email</label>
                <input id="w-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label htmlFor="w-phone">Phone</label>
                <input id="w-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="w-volume">Estimated monthly volume</label>
              <input id="w-volume" placeholder="e.g. 200 pouches / month" value={form.volume} onChange={(e) => setForm({ ...form, volume: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="w-message">Anything else?</label>
              <textarea id="w-message" rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </div>
            <button type="submit" className="btn-solid accent full">Send enquiry</button>
          </form>
        </div>
      </section>
    </div>
  );
}
