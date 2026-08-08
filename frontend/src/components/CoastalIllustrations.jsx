// Realistic pen-and-ink coastal illustrations for the Chhatak editorial theme.
// All strokes use currentColor so callers set colour via className / style.

export function LighthouseIllustration({ className = '', ...rest }) {
  return (
    <svg viewBox="0 0 220 320" className={className} {...rest} aria-hidden="true">
      <g stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Rocky base */}
        <path d="M20 300 Q 40 288 60 296 T 100 292 T 140 296 T 180 290 T 208 298 L 208 314 L 20 314 Z" strokeWidth="1.4" />
        <path d="M32 302 Q 44 296 56 300" strokeWidth="0.9" opacity="0.7" />
        <path d="M120 298 Q 132 294 144 298" strokeWidth="0.9" opacity="0.7" />
        <path d="M164 296 Q 176 292 188 298" strokeWidth="0.9" opacity="0.7" />

        {/* Foundation platform */}
        <path d="M60 300 L 60 288 L 160 288 L 160 300" strokeWidth="1.4" />
        <path d="M64 288 L 64 280 L 156 280 L 156 288" strokeWidth="1.2" />

        {/* Tower — tapered */}
        <path d="M78 280 L 82 130 L 138 130 L 142 280" strokeWidth="1.6" />

        {/* Horizontal red-and-white bands (indicated by hatched fills) */}
        <path d="M80 250 L 140 250" strokeWidth="1" />
        <path d="M81 230 L 139 230" strokeWidth="1" />
        <path d="M82 210 L 138 210" strokeWidth="1" />
        {/* Filled dark band */}
        <path d="M81 210 L 139 210 L 139 230 L 81 230 Z" strokeWidth="0.6" fill="currentColor" opacity="0.18" />
        <path d="M83 190 L 137 190" strokeWidth="1" />
        <path d="M84 170 L 136 170" strokeWidth="1" />
        <path d="M85 150 L 135 150" strokeWidth="1" />
        <path d="M83 170 L 137 170 L 137 190 L 83 190 Z" strokeWidth="0.6" fill="currentColor" opacity="0.18" />

        {/* Small round windows */}
        <circle cx="110" cy="240" r="3" strokeWidth="1" />
        <circle cx="110" cy="200" r="3" strokeWidth="1" />
        <circle cx="110" cy="160" r="3" strokeWidth="1" />

        {/* Gallery walkway under lantern */}
        <path d="M72 130 L 148 130 L 148 122 L 72 122 Z" strokeWidth="1.2" />
        <path d="M76 122 L 76 114 L 144 114 L 144 122" strokeWidth="1.1" />
        {/* Railing */}
        {[80, 92, 104, 116, 128, 140].map((x) => (
          <path key={x} d={`M${x} 122 L ${x} 114`} strokeWidth="0.6" opacity="0.75" />
        ))}

        {/* Lantern room */}
        <path d="M84 114 L 84 84 L 136 84 L 136 114 Z" strokeWidth="1.5" />
        <path d="M92 84 L 92 114 M 100 84 L 100 114 M 108 84 L 108 114 M 118 84 L 118 114 M 128 84 L 128 114" strokeWidth="0.5" opacity="0.55" />
        {/* Warm light hint */}
        <path d="M92 90 L 128 90 L 128 108 L 92 108 Z" strokeWidth="0.5" fill="currentColor" opacity="0.14" />

        {/* Cupola roof */}
        <path d="M80 84 L 110 60 L 140 84 Z" strokeWidth="1.4" />
        <path d="M78 84 L 142 84" strokeWidth="1.2" />
        {/* Ball finial */}
        <circle cx="110" cy="54" r="3" strokeWidth="1" />
        <path d="M110 50 L 110 40" strokeWidth="1" />
        {/* Weather-vane arrow */}
        <path d="M104 40 L 118 40" strokeWidth="1" />
        <path d="M114 37 L 118 40 L 114 43" strokeWidth="1" />

        {/* Beacon light rays — faint */}
        <g opacity="0.35" strokeWidth="0.8">
          <path d="M84 98 L 40 78" />
          <path d="M84 100 L 36 100" />
          <path d="M136 98 L 180 78" />
          <path d="M136 100 L 184 100" />
        </g>
      </g>
    </svg>
  );
}

export function CompassRose({ className = '', ...rest }) {
  return (
    <svg viewBox="0 0 200 200" className={className} {...rest} aria-hidden="true">
      <g stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Outer decorative ring */}
        <circle cx="100" cy="100" r="94" strokeWidth="1.4" />
        <circle cx="100" cy="100" r="88" strokeWidth="0.7" opacity="0.6" />
        <circle cx="100" cy="100" r="74" strokeWidth="1" />
        <circle cx="100" cy="100" r="60" strokeWidth="0.6" opacity="0.5" />
        <circle cx="100" cy="100" r="30" strokeWidth="1" />
        <circle cx="100" cy="100" r="6" strokeWidth="1" fill="currentColor" opacity="0.55" />

        {/* Tick marks around outer ring */}
        {Array.from({ length: 72 }).map((_, i) => {
          const a = (i * 360 / 72) * Math.PI / 180;
          const long = i % 6 === 0;
          const r1 = long ? 82 : 85;
          const r2 = 88;
          return (
            <path
              key={i}
              d={`M${100 + Math.cos(a) * r1} ${100 + Math.sin(a) * r1} L ${100 + Math.cos(a) * r2} ${100 + Math.sin(a) * r2}`}
              strokeWidth={long ? 1.1 : 0.6}
              opacity={long ? 1 : 0.55}
            />
          );
        })}

        {/* Cardinal points — solid filled diamond needles */}
        {/* North */}
        <path d="M100 12 L 108 100 L 100 90 L 92 100 Z" strokeWidth="1" fill="currentColor" opacity="0.85" />
        <path d="M100 100 L 108 100 L 100 12 Z" strokeWidth="0.4" fill="currentColor" opacity="0.15" />
        {/* South */}
        <path d="M100 188 L 108 100 L 100 110 L 92 100 Z" strokeWidth="1" />
        <path d="M100 100 L 92 100 L 100 188 Z" strokeWidth="0.4" fill="currentColor" opacity="0.15" />
        {/* East */}
        <path d="M188 100 L 100 108 L 110 100 L 100 92 Z" strokeWidth="1" />
        <path d="M100 100 L 100 108 L 188 100 Z" strokeWidth="0.4" fill="currentColor" opacity="0.15" />
        {/* West */}
        <path d="M12 100 L 100 108 L 90 100 L 100 92 Z" strokeWidth="1" />
        <path d="M100 100 L 100 92 L 12 100 Z" strokeWidth="0.4" fill="currentColor" opacity="0.15" />

        {/* Inter-cardinals — thinner */}
        <g strokeWidth="0.9" opacity="0.75">
          {[45, 135, 225, 315].map((deg) => {
            const a = deg * Math.PI / 180;
            const x = 100 + Math.cos(a) * 68;
            const y = 100 + Math.sin(a) * 68;
            return <path key={deg} d={`M100 100 L ${x} ${y}`} />;
          })}
        </g>

        {/* N marker */}
        <path d="M94 24 L 94 6 L 106 24 L 106 6" strokeWidth="1.2" fill="none" />
      </g>
    </svg>
  );
}

export function PassportStamp({
  label = 'DIU · GUJARAT',
  sub = 'ARABIAN SEA COAST',
  year = '1961',
  className = '',
  ...rest
}) {
  return (
    <svg viewBox="0 0 220 220" className={className} {...rest} aria-hidden="true">
      <defs>
        <path id="stamp-arc-top" d="M110 110 m -80 0 a 80 80 0 1 1 160 0" fill="none" />
        <path id="stamp-arc-bot" d="M110 110 m -80 0 a 80 80 0 1 0 160 0" fill="none" />
      </defs>
      <g stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Slightly rotated for hand-stamped feel */}
        <g transform="rotate(-8 110 110)">
          <circle cx="110" cy="110" r="94" strokeWidth="2" />
          <circle cx="110" cy="110" r="88" strokeWidth="1" />
          <circle cx="110" cy="110" r="60" strokeWidth="1.2" />
          {/* Stars flanking centre */}
          <g fill="currentColor" strokeWidth="0">
            <path d="M56 110 l 3 -6 l 3 6 l 6 1 l -4.5 4 l 1 6 l -5.5 -3 l -5.5 3 l 1 -6 l -4.5 -4 z" opacity="0.75" />
            <path d="M158 110 l 3 -6 l 3 6 l 6 1 l -4.5 4 l 1 6 l -5.5 -3 l -5.5 3 l 1 -6 l -4.5 -4 z" opacity="0.75" />
          </g>
          {/* Central date + year */}
          <text x="110" y="98" textAnchor="middle" fontSize="14" letterSpacing="2" fill="currentColor" stroke="none" fontFamily="Times New Roman, serif" fontWeight="700">EST</text>
          <text x="110" y="128" textAnchor="middle" fontSize="26" letterSpacing="3" fill="currentColor" stroke="none" fontFamily="Times New Roman, serif" fontWeight="700">{year}</text>
          {/* Curved top text */}
          <text fontSize="12" letterSpacing="4" fill="currentColor" stroke="none" fontFamily="Times New Roman, serif" fontWeight="700">
            <textPath href="#stamp-arc-top" startOffset="50%" textAnchor="middle">{label}</textPath>
          </text>
          {/* Curved bottom text */}
          <text fontSize="10" letterSpacing="3" fill="currentColor" stroke="none" fontFamily="Times New Roman, serif">
            <textPath href="#stamp-arc-bot" startOffset="50%" textAnchor="middle">{sub}</textPath>
          </text>
        </g>
      </g>
    </svg>
  );
}

export function SeagullFlock({ className = '', ...rest }) {
  const Gull = ({ x, y, s = 1, dip = 0 }) => (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={`M0 ${dip} Q 8 -6 16 0 M16 0 Q 24 -6 32 ${dip}`} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <path d="M16 0 Q 18 2 20 2" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.6" />
    </g>
  );
  return (
    <svg viewBox="0 0 400 120" className={className} {...rest} aria-hidden="true">
      <Gull x={20} y={40} s={1.1} />
      <Gull x={90} y={22} s={0.85} dip={1} />
      <Gull x={170} y={58} s={1.3} />
      <Gull x={260} y={32} s={0.7} />
      <Gull x={320} y={68} s={0.95} dip={1} />
    </svg>
  );
}

export function WaveDivider({ className = '', flip = false, ...rest }) {
  return (
    <svg
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      className={className}
      style={{ transform: flip ? 'scaleY(-1)' : undefined, ...(rest.style || {}) }}
      aria-hidden="true"
    >
      <g fill="currentColor">
        <path opacity="0.35" d="M0 60 Q 180 20 360 60 T 720 60 T 1080 60 T 1440 60 L 1440 120 L 0 120 Z" />
        <path opacity="0.55" d="M0 80 Q 180 44 360 80 T 720 80 T 1080 80 T 1440 80 L 1440 120 L 0 120 Z" />
        <path opacity="1"    d="M0 100 Q 180 70 360 100 T 720 100 T 1080 100 T 1440 100 L 1440 120 L 0 120 Z" />
      </g>
    </svg>
  );
}

export function WaveDividerLine({ className = '', ...rest }) {
  return (
    <svg viewBox="0 0 400 30" className={className} preserveAspectRatio="none" {...rest} aria-hidden="true">
      <g stroke="currentColor" fill="none" strokeLinecap="round">
        <path d="M0 12 Q 40 2 80 12 T 160 12 T 240 12 T 320 12 T 400 12" strokeWidth="1.4" />
        <path d="M0 22 Q 40 12 80 22 T 160 22 T 240 22 T 320 22 T 400 22" strokeWidth="1" opacity="0.55" />
      </g>
    </svg>
  );
}

export function RopeDivider({ className = '', ...rest }) {
  return (
    <svg viewBox="0 0 400 20" className={className} preserveAspectRatio="none" {...rest} aria-hidden="true">
      <g stroke="currentColor" fill="none" strokeLinecap="round">
        {/* Two intertwined strands */}
        <path d="M0 10 Q 10 2 20 10 T 40 10 T 60 10 T 80 10 T 100 10 T 120 10 T 140 10 T 160 10 T 180 10 T 200 10 T 220 10 T 240 10 T 260 10 T 280 10 T 300 10 T 320 10 T 340 10 T 360 10 T 380 10 T 400 10" strokeWidth="1.4" />
        <path d="M0 10 Q 10 18 20 10 T 40 10 T 60 10 T 80 10 T 100 10 T 120 10 T 140 10 T 160 10 T 180 10 T 200 10 T 220 10 T 240 10 T 260 10 T 280 10 T 300 10 T 320 10 T 340 10 T 360 10 T 380 10 T 400 10" strokeWidth="1.4" opacity="0.75" />
        {/* End caps */}
        <circle cx="4" cy="10" r="3" fill="currentColor" opacity="0.8" />
        <circle cx="396" cy="10" r="3" fill="currentColor" opacity="0.8" />
      </g>
    </svg>
  );
}
