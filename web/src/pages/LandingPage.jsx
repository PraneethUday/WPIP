import { useState } from 'react'

const NB = {
  border: '2.5px solid #04052E',
  shadow: '4px 4px 0px #04052E',
  shadowSm: '2px 2px 0px #04052E',
  shadowLg: '6px 6px 0px #04052E',
}

const Btn = ({ children, variant = 'primary', size = '', onClick, style = {} }) => {
  const [hovered, setHovered] = useState(false)
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: size === 'lg' ? '16px 40px' : '12px 28px',
    borderRadius: 0,
    fontFamily: "'EB Garamond', serif",
    fontSize: size === 'lg' ? 17 : 15,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    cursor: 'pointer',
    border: '2.5px solid #04052E',
    boxShadow: hovered ? NB.shadowSm : NB.shadow,
    transform: hovered ? 'translate(2px,2px)' : 'translate(0,0)',
    transition: 'box-shadow 0.12s, transform 0.12s',
    whiteSpace: 'nowrap',
    ...style
  }
  const variants = {
    primary: { background: '#A51C30', color: '#fff' },
    accent: { background: '#04052E', color: '#fff' },
    yellow: { background: '#FFE566', color: '#04052E' },
    outline: { background: 'transparent', color: '#04052E' },
    ghost: { background: 'rgba(255,255,255,0.15)', color: '#fff', border: '2.5px solid rgba(255,255,255,0.7)', boxShadow: hovered ? '2px 2px 0px rgba(255,255,255,0.5)' : '4px 4px 0px rgba(255,255,255,0.5)' },
    'outline-white': { background: 'transparent', color: '#fff', border: '2.5px solid rgba(255,255,255,0.8)', boxShadow: hovered ? '2px 2px 0px rgba(255,255,255,0.4)' : '4px 4px 0px rgba(255,255,255,0.4)' },
  }
  return (
    <button
      style={{ ...base, ...variants[variant] }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >{children}</button>
  )
}

export default function LandingPage({ navigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div style={{ fontFamily: "'EB Garamond', Georgia, serif", background: '#FFFDFB', color: '#04052E' }}>

      {/* NAVBAR */}
      <nav style={{ background: '#FFFFFF', borderBottom: '4px solid #04052E', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 48px', height: 70, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, background: '#04052E', border: '2.5px solid #04052E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#FFE566', letterSpacing: '0.05em' }}>GG</div>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#04052E', textTransform: 'uppercase', letterSpacing: '0.06em' }}>GigGuard</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
          {['How It Works', 'Coverage', 'Pricing', 'For Insurers'].map(l => (
            <span key={l} style={{ color: '#04052E', fontSize: 14, fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l}</span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Btn variant="ghost" onClick={() => navigate('login')}>Login</Btn>
          <Btn variant="outline" onClick={() => navigate('admin-dashboard')}>Admin</Btn>
          <Btn variant="primary" onClick={() => navigate('register')}>Get Protected</Btn>
        </div>
      </nav>

      {/* HERO — Split Layout */}
      <section style={{ display: 'flex', minHeight: 600, borderBottom: '4px solid #04052E' }}>
        {/* LEFT: Red panel */}
        <div style={{ flex: 1, background: '#A51C30', padding: '80px 64px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '4px solid #04052E' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#04052E', border: '2.5px solid #FFE566', padding: '6px 16px', marginBottom: 28, width: 'fit-content' }}>
            <span style={{ width: 8, height: 8, background: '#22C55E', display: 'inline-block' }} />
            <span style={{ fontSize: 12, color: '#FFE566', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>AI-Powered Parametric Insurance · India's Gig Economy</span>
          </div>
          <h1 style={{ fontSize: 56, fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1, marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            Protecting your <span style={{ color: '#FFE566' }}>hustle</span>,<br />rain or shine.
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.85)', lineHeight: 1.65, marginBottom: 40, maxWidth: 480 }}>
            GigGuard gives India's delivery partners automatic income protection from extreme weather, severe pollution, and sudden curfews — with zero paperwork.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Btn variant="yellow" size="lg" onClick={() => navigate('register')}>Join as a Partner →</Btn>
            <Btn variant="outline-white" size="lg" onClick={() => navigate('login')}>Sign In</Btn>
          </div>
        </div>
        {/* RIGHT: Yellow panel with live payout card */}
        <div style={{ flex: 1, background: '#FFE566', padding: '80px 64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#04052E', border: '2.5px solid #04052E', boxShadow: '8px 8px 0px #A51C30', padding: 28, width: 320 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#FFE566', marginBottom: 18, borderBottom: '1.5px solid rgba(255,229,102,0.3)', paddingBottom: 12 }}>Live Payout Activity</div>
            {[
              { name: 'Ravi K.', city: 'Chennai', reason: 'Heavy Rain', amount: '₹175', time: '2m ago' },
              { name: 'Priya S.', city: 'Delhi', reason: 'AQI Alert', amount: '₹210', time: '8m ago' },
              { name: 'Arjun M.', city: 'Bengaluru', reason: 'Curfew', amount: '₹340', time: '15m ago' },
              { name: 'Meera D.', city: 'Mumbai', reason: 'Flood Alert', amount: '₹290', time: '23m ago' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < 3 ? '1px solid rgba(255,229,102,0.15)' : 'none' }}>
                <div>
                  <div style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>{item.name} · {item.city}</div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 }}>{item.reason} · {item.time}</div>
                </div>
                <span style={{ background: '#22C55E', color: '#fff', fontSize: 12, fontWeight: 800, padding: '4px 10px', border: '2px solid #04052E' }}>{item.amount}</span>
              </div>
            ))}
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1.5px solid rgba(255,229,102,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Today's payouts</span>
              <span style={{ color: '#22C55E', fontSize: 16, fontWeight: 800 }}>₹42,800</span>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <div style={{ background: '#04052E', padding: '32px 80px', display: 'flex', justifyContent: 'space-around', gap: 24, borderBottom: '4px solid #04052E' }}>
        {[
          { num: '50,000+', desc: 'Delivery Partners Protected' },
          { num: '₹2.1 Cr+', desc: 'Total Payouts Disbursed' },
          { num: '<10 min', desc: 'Average Payout Time' },
          { num: '5 Types', desc: 'Disruption Triggers Covered' },
          { num: '98.2%', desc: 'Claim Auto-Approval Rate' },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center', borderRight: i < 4 ? '1.5px solid rgba(255,255,255,0.15)' : 'none', paddingRight: i < 4 ? 32 : 0 }}>
            <span style={{ fontSize: 30, fontWeight: 800, color: '#FFE566', display: 'block', letterSpacing: '0.02em' }}>{s.num}</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.desc}</span>
          </div>
        ))}
      </div>

      {/* HOW IT WORKS */}
      <section style={{ padding: '80px 80px', borderBottom: '4px solid #04052E' }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#A51C30', marginBottom: 12 }}>Process</div>
        <h2 style={{ fontSize: 40, fontWeight: 800, color: '#04052E', lineHeight: 1.1, marginBottom: 16, textTransform: 'uppercase' }}>How GigGuard Works</h2>
        <p style={{ fontSize: 17, color: 'rgba(4,5,46,0.65)', lineHeight: 1.65, maxWidth: 560, marginBottom: 48 }}>From registration to payout — fully automated with zero manual filing required.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {[
            { n: '1', title: 'Register & Verify', text: 'Connect your delivery platforms (Zomato, Swiggy, Amazon, etc.). Our AI verifies your work history and generates your risk profile.' },
            { n: '2', title: 'Pay Weekly Premium', text: 'Our ML model computes your personalised weekly premium based on your earnings, location risk, and weather forecasts. Auto-debit from your payout.' },
            { n: '3', title: 'Disruption Detected', text: 'We monitor weather, AQI, and government alerts every 15 minutes. When a threshold is crossed in your zone, a claim is automatically triggered.' },
            { n: '4', title: 'AI Validates Claim', text: 'Our fraud engine cross-checks your GPS location, platform activity across all registered apps, and duplicate claim history.' },
            { n: '5', title: 'Instant Payout', text: 'Verified payouts land in your UPI/bank account in under 10 minutes. No forms, no calls, no waiting.' },
            { n: '6', title: 'Stay Protected', text: 'Your coverage renews every week. Loyalty discounts grow with every uninterrupted payment — up to 15% off.' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', border: '2.5px solid #04052E', boxShadow: '4px 4px 0px #04052E', padding: 32 }}>
              <div style={{ width: 48, height: 48, background: '#A51C30', border: '2.5px solid #04052E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 18 }}>{s.n}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#04052E', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.title}</div>
              <p style={{ fontSize: 15, color: 'rgba(4,5,46,0.7)', lineHeight: 1.65 }}>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* COVERAGE TRIGGERS */}
      <section style={{ padding: '80px 80px', background: '#FFFDFB', borderBottom: '4px solid #04052E' }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#A51C30', marginBottom: 12 }}>Coverage</div>
        <h2 style={{ fontSize: 40, fontWeight: 800, color: '#04052E', lineHeight: 1.1, marginBottom: 16, textTransform: 'uppercase' }}>What We Cover</h2>
        <p style={{ fontSize: 17, color: 'rgba(4,5,46,0.65)', lineHeight: 1.65, maxWidth: 560, marginBottom: 48 }}>GigGuard covers income loss from measurable external disruptions only. No forms, no subjectivity — just data.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {[
            { icon: '🌧️', title: 'Heavy Rainfall', color: '#3B82F6', borderLeft: '4px solid #3B82F6', threshold: 'Rainfall > 64.5mm/24h', source: 'OpenWeatherMap / IMD API', text: 'When IMD issues a Red Alert and rainfall crosses the Red Alert threshold in your zone, GigGuard automatically creates and processes your claim.' },
            { icon: '🌫️', title: 'Severe Air Pollution', color: '#F59E0B', borderLeft: '4px solid #F59E0B', threshold: 'AQI > 400 (Severe)', source: 'CPCB AQI / OpenAQ API', text: 'When Delhi GRAP or state advisories restrict two-wheeler movement due to AQI crossing the Severe category, your coverage activates automatically.' },
            { icon: '🚫', title: 'Curfew / Section 144', color: '#EF4444', borderLeft: '4px solid #EF4444', threshold: 'Official Order Detected', source: 'Govt. RSS / News API', text: 'Sudden curfews or Section 144 orders in your registered delivery zone are detected via government notification feeds within minutes of issuance.' },
            { icon: '🌊', title: 'Flood / Waterlogging', color: '#6366F1', borderLeft: '4px solid #6366F1', threshold: 'Zone Tagged as Flooded', source: 'OpenWeatherMap + Google Maps', text: 'When road closures and waterlogging are detected in your delivery zone through traffic data and weather APIs, your claim is initiated automatically.' },
            { icon: '🔥', title: 'Extreme Heat', color: '#EC4899', borderLeft: '4px solid #EC4899', threshold: 'Temp > 45°C + Heat Index > 54°C', source: 'OpenWeatherMap API', text: 'Dangerous heat events that make outdoor delivery impossible — measured by both air temperature and heat index to ensure accuracy.' },
            { icon: '🤖', title: 'AI Fraud Shield', color: '#22C55E', borderLeft: '4px solid #22C55E', threshold: 'Always Active', source: 'Isolation Forest + GPS Validation', text: 'Every claim passes GPS validation, multi-platform activity cross-check, and anomaly detection before payout. Your payouts are protected from fraud too.' },
          ].map((t, i) => (
            <div key={i} style={{ background: '#fff', border: '2.5px solid #04052E', borderLeft: t.borderLeft, boxShadow: '4px 4px 0px #04052E', padding: 28 }}>
              <span style={{ fontSize: 36, marginBottom: 14, display: 'block' }}>{t.icon}</span>
              <div style={{ fontSize: 17, fontWeight: 800, color: t.color, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t.title}</div>
              <span style={{ background: '#04052E', color: '#FFE566', fontSize: 11, fontWeight: 800, padding: '4px 10px', display: 'inline-block', marginBottom: 14, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{t.threshold}</span>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: 'rgba(4,5,46,0.75)', marginBottom: 16 }}>{t.text}</p>
              <div style={{ fontSize: 12, color: 'rgba(4,5,46,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>📡 {t.source}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section style={{ padding: '80px 80px', borderBottom: '4px solid #04052E' }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#A51C30', marginBottom: 12 }}>Pricing</div>
        <h2 style={{ fontSize: 40, fontWeight: 800, color: '#04052E', lineHeight: 1.1, marginBottom: 16, textTransform: 'uppercase' }}>Weekly Plans That Fit Your Earnings</h2>
        <p style={{ fontSize: 17, color: 'rgba(4,5,46,0.65)', lineHeight: 1.65, maxWidth: 560, marginBottom: 48 }}>Premiums computed every Monday by our AI — no flat rates, no surprises. Pay less as your loyalty grows.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {[
            {
              tier: 'Basic Shield', earnings: '₹800 – ₹1,500 / week', price: '₹20–40', payout: '₹500 max payout', best: 'Part-time & weekend workers',
              features: ['Rain & AQI triggers', 'Single platform support', 'UPI payout', 'Basic fraud protection', 'App notifications'],
              highlight: false
            },
            {
              tier: 'Standard Guard', earnings: '₹1,500 – ₹3,000 / week', price: '₹40–80', payout: '₹1,200 max payout', best: 'Full-time single-platform riders',
              features: ['All 5 trigger types', 'Multi-platform support', 'UPI + bank payout', 'Advanced fraud shield', 'Loyalty discounts up to 15%', 'AutoPay 5% discount'],
              highlight: true, badge: 'Most Popular'
            },
            {
              tier: 'Pro Protect', earnings: '₹3,000 – ₹5,000+ / week', price: '₹80–130', payout: '₹2,500 max payout', best: 'High-earners & multi-platform riders',
              features: ['All 5 trigger types', 'Unlimited platform support', 'Priority payout (<5 min)', 'GPS spoofing detection', 'Loyalty discounts up to 15%', 'AutoPay 5% discount', 'Premium support'],
              highlight: false
            },
          ].map((p, i) => (
            <div key={i} style={{
              background: p.highlight ? '#A51C30' : '#fff',
              border: '2.5px solid #04052E',
              boxShadow: p.highlight ? '6px 6px 0px #04052E' : '4px 4px 0px #04052E',
              padding: 32,
              position: 'relative',
            }}>
              {p.badge && (
                <div style={{ position: 'absolute', top: -14, left: 24, background: '#FFE566', color: '#04052E', fontSize: 11, fontWeight: 800, padding: '4px 14px', border: '2px solid #04052E', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {p.badge}
                </div>
              )}
              <div style={{ fontSize: 20, fontWeight: 800, color: p.highlight ? '#fff' : '#04052E', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{p.tier}</div>
              <div style={{ fontSize: 13, color: p.highlight ? 'rgba(255,255,255,0.65)' : 'rgba(4,5,46,0.55)', marginBottom: 24 }}>{p.earnings}</div>
              <div style={{ fontSize: 44, fontWeight: 800, color: p.highlight ? '#FFE566' : '#04052E', lineHeight: 1 }}>{p.price}</div>
              <div style={{ fontSize: 14, color: p.highlight ? 'rgba(255,255,255,0.6)' : 'rgba(4,5,46,0.55)', marginBottom: 28 }}>per week · {p.payout}</div>
              <div style={{ height: 3, background: p.highlight ? 'rgba(255,255,255,0.2)' : '#04052E', marginBottom: 24 }} />
              {p.features.map((f, j) => (
                <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, fontSize: 14, color: p.highlight ? 'rgba(255,255,255,0.85)' : 'rgba(4,5,46,0.8)' }}>
                  <span style={{ color: '#22C55E', fontWeight: 800, fontSize: 16 }}>✓</span>
                  {f}
                </div>
              ))}
              <div style={{ marginTop: 28 }}>
                <Btn
                  variant={p.highlight ? 'yellow' : 'outline'}
                  style={{ width: '100%' }}
                  onClick={() => navigate('register')}
                >
                  Get Started
                </Btn>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PLATFORMS */}
      <section style={{ padding: '80px 80px', textAlign: 'center', background: '#04052E', borderBottom: '4px solid #04052E' }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#FFE566', marginBottom: 12 }}>Supported Platforms</div>
        <h2 style={{ fontSize: 40, fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1, marginBottom: 16, textTransform: 'uppercase' }}>Works With Every Major Platform</h2>
        <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.65)', lineHeight: 1.65, maxWidth: 560, margin: '0 auto 40px' }}>
          GigGuard seamlessly integrates with all leading gig delivery platforms. Register once, protect your earnings across all of them.
        </p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginTop: 16 }}>
          {['Zomato', 'Swiggy', 'Amazon Flex', 'Blinkit', 'Zepto', 'Meesho', 'Porter', 'Dunzo'].map(p => (
            <div key={p} style={{ background: '#FFE566', border: '2.5px solid #04052E', boxShadow: '3px 3px 0px #A51C30', padding: '12px 22px', fontSize: 14, fontWeight: 800, color: '#04052E', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{p}</div>
          ))}
        </div>
        <p style={{ marginTop: 32, fontSize: 14, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Multi-platform workers covered across all registered apps simultaneously
        </p>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: '80px 80px', borderBottom: '4px solid #04052E' }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#A51C30', marginBottom: 12 }}>Stories</div>
        <h2 style={{ fontSize: 40, fontWeight: 800, color: '#04052E', lineHeight: 1.1, marginBottom: 40, textTransform: 'uppercase' }}>From Our Delivery Partners</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {[
            { name: 'Ravi Kumar', city: 'Chennai · Zomato Partner', text: 'Last monsoon I lost 3 days of income. With GigGuard, I got ₹175 credited before I even had my morning chai. Zero forms, just a notification.', stars: 5 },
            { name: 'Priya Sharma', city: 'Delhi · Swiggy Partner', text: 'GRAP restrictions were killing us. GigGuard credited my account automatically when AQI crossed 400. I didn\'t file anything. It just worked.', stars: 5 },
            { name: 'Arjun Mehta', city: 'Bengaluru · Multi-Platform', text: 'I deliver on both Swiggy and Amazon Flex. GigGuard tracked both accounts during the curfew night and still gave me the right payout. Brilliant.', stars: 5 },
          ].map((t, i) => (
            <div key={i} style={{ background: '#fff', border: '2.5px solid #04052E', borderTop: '4px solid #FFE566', boxShadow: '4px 4px 0px #04052E', padding: 28 }}>
              <div style={{ color: '#FFE566', fontSize: 20, marginBottom: 14, textShadow: '1px 1px 0 #04052E' }}>{'★'.repeat(t.stars)}</div>
              <p style={{ fontSize: 15, lineHeight: 1.65, color: 'rgba(4,5,46,0.8)', marginBottom: 20, fontStyle: 'italic' }}>"{t.text}"</p>
              <div style={{ fontWeight: 800, color: '#04052E', fontSize: 15, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t.name}</div>
              <div style={{ fontSize: 13, color: 'rgba(4,5,46,0.5)', marginTop: 3 }}>{t.city}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <section style={{ background: '#04052E', padding: '80px 80px', textAlign: 'center', borderBottom: '4px solid #A51C30' }}>
        <h2 style={{ fontSize: 44, fontWeight: 800, color: '#FFE566', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Ready to protect your income?</h2>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', marginBottom: 40, maxWidth: 560, margin: '0 auto 40px' }}>Join 50,000+ delivery partners who earn with confidence — in every weather condition.</p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <Btn variant="primary" size="lg" onClick={() => navigate('register')}>Start for Free →</Btn>
          <Btn variant="outline-white" size="lg" onClick={() => navigate('login')}>Sign In</Btn>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#04052E', padding: '48px 80px 28px', color: 'rgba(255,255,255,0.6)', borderTop: '4px solid #A51C30' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 40 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#FFE566', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>GigGuard</div>
            <p style={{ fontSize: 14, lineHeight: 1.65, maxWidth: 260 }}>AI-powered parametric insurance for India's gig delivery workforce. Protecting income, not vehicles.</p>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#FFE566', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Product</div>
            {['How It Works', 'Coverage Types', 'Pricing', 'Supported Platforms', 'FAQ'].map(l => <span key={l} style={{ display: 'block', fontSize: 14, color: 'rgba(255,255,255,0.55)', marginBottom: 10, cursor: 'pointer' }}>{l}</span>)}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#FFE566', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Company</div>
            {['About Us', 'Careers', 'Press', 'Blog', 'Contact'].map(l => <span key={l} style={{ display: 'block', fontSize: 14, color: 'rgba(255,255,255,0.55)', marginBottom: 10, cursor: 'pointer' }}>{l}</span>)}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#FFE566', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Legal</div>
            {['Privacy Policy', 'Terms of Service', 'IRDAI Compliance', 'Claims Policy'].map(l => <span key={l} style={{ display: 'block', fontSize: 14, color: 'rgba(255,255,255,0.55)', marginBottom: 10, cursor: 'pointer' }}>{l}</span>)}
          </div>
        </div>
        <div style={{ borderTop: '2px solid rgba(255,255,255,0.12)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
          <span>© 2026 GigGuard Technologies Pvt. Ltd. All rights reserved.</span>
          <span>Regulated by IRDAI · CIN: U66010MH2026PTC000001</span>
        </div>
      </footer>
    </div>
  )
}
