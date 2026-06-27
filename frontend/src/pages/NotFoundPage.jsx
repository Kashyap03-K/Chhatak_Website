import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="section" style={{ paddingTop: '120px', textAlign: 'center' }}>
      <div className="container">
        <h2 className="display sm">Page not <em>found</em>.</h2>
        <p style={{ color: 'var(--muted)', margin: '24px 0' }}>
          The page you're looking for doesn't exist.
        </p>
        <Link className="btn-solid accent" to="/">Back to home</Link>
      </div>
    </div>
  );
}
