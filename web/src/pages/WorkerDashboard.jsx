import { useState } from 'react'

const C = {
  primary: '#A51C30', accent: '#04052E', bg: '#FFFDFB', surface: '#fff',
  text: '#04052E', muted: 'rgba(4,5,46,0.5)', border: '#04052E',
  success: '#22C55E', warning: '#F59E0B', error: '#EF4444', info: '#3B82F6',
  yellow: '#FFE566',
}

const NB_BORDER = '2.5px solid #04052E'
const NB_SHADOW = '4px 4px 0px #04052E'
const NB_SHADOW_SM = '2px 2px 0px #04052E'

const NAV_ITEMS = [
  { id: 'home', label: 'Dashboard', icon: '🏠' },
  { id: 'policy', label: 'My Policy', icon: '🛡️' },
  { id: 'claims', label: 'Claims', icon: '📋' },
  { id: 'profile', label: 'Profile', icon: '👤' },
]

const mockClaims = [
  { id: 'CLM-4821', type: 'Heavy Rain', date: '18 Mar 2026', zone: 'Chennai South', hours: 4, amount: 175, status: 'paid' },
  { id: 'CLM-4755', type: 'AQI Alert', date: '12 Mar 2026', zone: 'Chennai Central', hours: 6, amount: 263, status: 'paid' },
  { id: 'CLM-4690', type: 'Curfew', date: '2 Mar 2026', zone: 'Chennai North', hours: 3, amount: 131, status: 'paid' },
  { id: 'CLM-4610', type: 'Heavy Rain', date: '21 Feb 2026', zone: 'Chennai South', hours: 5, amount: 219, status: 'under-review' },
]

const Badge = ({ status }) => {
  const config = {
    paid: { bg: '#22C55E', color: '#fff', label: 'Paid' },
    'under-review': { bg: '#FFE566', color: '#04052E', label: 'Under Review' },
    rejected: { bg: '#EF4444', color: '#fff', label: 'Rejected' },
  }[status] || { bg: '#3B82F6', color: '#fff', label: status }
  return (
    <span style={{
      background: config.bg, color: config.color,
      padding: '3px 10px',
      border: '2px solid #04052E',
      fontSize: 11, fontWeight: 800,
      textTransform: 'uppercase', letterSpacing: '0.06em',
    }}>{config.label}</span>
  )
}

const SectionHeading = ({ children }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ fontSize: 18, fontWeight: 800, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'inline-block' }}>
      {children}
    </div>
    <div style={{ height: 3, background: '#A51C30', width: '100%', marginTop: 4 }} />
  </div>
)

function HomeTab() {
  return (
    <div>
      {/* LIVE ALERT */}
      <div style={{ background: 'rgba(59,130,246,0.06)', border: '2.5px solid #04052E', borderLeft: '6px solid #3B82F6', padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 44, height: 44, background: '#3B82F6', border: '2.5px solid #04052E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🌧️</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, color: '#04052E', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Rain Alert Active — Chennai South Zone</div>
          <div style={{ color: '#3b82f6', fontSize: 13, marginTop: 2, fontWeight: 600 }}>Rainfall at 72mm/24h · Red Alert threshold exceeded · Auto-claim being processed</div>
        </div>
        <div style={{ background: '#3B82F6', color: '#fff', padding: '6px 16px', border: '2px solid #04052E', fontSize: 12, fontWeight: 800, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Live</div>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { icon: '💰', label: 'Total Claimed', value: '₹4,200', sub: 'Lifetime payouts' },
          { icon: '✅', label: 'Claims Approved', value: '3', sub: 'This month' },
          { icon: '🗓️', label: 'Active Since', value: '8 Weeks', sub: 'Loyalty discount: 8%' },
          { icon: '⚡', label: 'This Week\'s Premium', value: '₹99', sub: 'AutoPay on · -5%' },
        ].map((s, i) => (
          <div key={i} style={{ background: C.surface, border: NB_BORDER, boxShadow: NB_SHADOW, padding: '20px 22px' }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: C.accent, lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.text, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
            <div style={{ fontSize: 12, color: C.muted }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ACTIVE POLICY */}
      <div style={{ background: '#A51C30', border: NB_BORDER, boxShadow: NB_SHADOW, padding: 28, marginBottom: 24, color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Active Policy</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Standard Guard · Chennai South</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', marginBottom: 20 }}>Policy #GG-2026-44821 · Valid until 31 Dec 2026</div>
            <div style={{ display: 'flex', gap: 28 }}>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Weekly Premium</div>
                <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>₹99</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Max Payout</div>
                <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>₹1,200</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Platforms</div>
                <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>2 Active</div>
              </div>
            </div>
          </div>
          <div style={{ background: '#22C55E', color: '#fff', padding: '8px 18px', border: '2.5px solid #04052E', fontSize: 12, fontWeight: 800, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Protected ✓</div>
        </div>
      </div>

      {/* RECENT CLAIMS */}
      <div style={{ background: C.surface, border: NB_BORDER, boxShadow: NB_SHADOW, overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px', borderBottom: NB_BORDER, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#04052E' }}>
          <div style={{ fontWeight: 800, color: '#FFE566', fontSize: 15, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recent Claims</div>
          <div style={{ fontSize: 13, color: '#FFE566', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>View All →</div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, fontFamily: "'EB Garamond', serif" }}>
          <thead>
            <tr>
              {['Claim ID', 'Trigger', 'Date', 'Hours', 'Amount', 'Status'].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#FFE566', background: '#04052E', borderBottom: NB_BORDER, fontWeight: 800, borderRight: '1px solid rgba(255,229,102,0.15)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockClaims.slice(0, 3).map((c, idx) => (
              <tr key={c.id} style={{ background: idx % 2 === 1 ? 'rgba(4,5,46,0.025)' : '#fff' }}>
                <td style={{ padding: '14px 16px', fontWeight: 800, color: C.primary, borderBottom: '1.5px solid #04052E', borderRight: '1px solid rgba(4,5,46,0.1)' }}>{c.id}</td>
                <td style={{ padding: '14px 16px', borderBottom: '1.5px solid #04052E', borderRight: '1px solid rgba(4,5,46,0.1)' }}>{c.type}</td>
                <td style={{ padding: '14px 16px', color: C.muted, borderBottom: '1.5px solid #04052E', borderRight: '1px solid rgba(4,5,46,0.1)' }}>{c.date}</td>
                <td style={{ padding: '14px 16px', borderBottom: '1.5px solid #04052E', borderRight: '1px solid rgba(4,5,46,0.1)' }}>{c.hours}h</td>
                <td style={{ padding: '14px 16px', fontWeight: 800, color: '#16a34a', borderBottom: '1.5px solid #04052E', borderRight: '1px solid rgba(4,5,46,0.1)' }}>₹{c.amount}</td>
                <td style={{ padding: '14px 16px', borderBottom: '1.5px solid #04052E' }}><Badge status={c.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PolicyTab() {
  const premiumFactors = [
    { label: 'Base Premium (3.5% × ₹2,800 avg)', value: '₹98' },
    { label: 'Zone Risk Multiplier (Moderate)', value: '×1.05' },
    { label: 'Weather Forecast Multiplier', value: '×1.10' },
    { label: 'Loyalty Discount (8 weeks)', value: '−8%' },
    { label: 'AutoPay Discount', value: '−5%' },
    { label: 'Final Weekly Premium', value: '₹99', bold: true },
  ]
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div style={{ background: C.surface, border: NB_BORDER, boxShadow: NB_SHADOW, padding: 28 }}>
          <SectionHeading>Policy Details</SectionHeading>
          {[
            ['Policy Number', 'GG-2026-44821'],
            ['Coverage Tier', 'Standard Guard'],
            ['Status', 'Active'],
            ['Coverage Start', '20 Jan 2026'],
            ['Valid Until', '31 Dec 2026'],
            ['Registered Zone', 'Chennai South'],
            ['Platforms Covered', 'Zomato, Amazon Flex'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1.5px solid rgba(4,5,46,0.1)', fontSize: 14 }}>
              <span style={{ color: C.muted }}>{k}</span>
              <span style={{ fontWeight: 700, color: C.accent }}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{ background: C.surface, border: NB_BORDER, boxShadow: NB_SHADOW, padding: 28 }}>
          <SectionHeading>Premium Breakdown</SectionHeading>
          {premiumFactors.map((f, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: i < premiumFactors.length - 1 ? '1.5px solid rgba(4,5,46,0.1)' : 'none', fontSize: 14 }}>
              <span style={{ color: C.muted }}>{f.label}</span>
              <span style={{ fontWeight: f.bold ? 800 : 600, color: f.bold ? C.primary : C.accent, fontSize: f.bold ? 16 : 14 }}>{f.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: C.surface, border: NB_BORDER, boxShadow: NB_SHADOW, padding: 28, marginBottom: 24 }}>
        <SectionHeading>Active Trigger Coverage</SectionHeading>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { icon: '🌧️', title: 'Heavy Rainfall', threshold: '>64.5mm / 24h', status: 'active' },
            { icon: '🌫️', title: 'Air Pollution (AQI)', threshold: '>400 Severe', status: 'active' },
            { icon: '🚫', title: 'Curfew / Section 144', threshold: 'Official Order', status: 'active' },
            { icon: '🌊', title: 'Flood / Waterlogging', threshold: 'Zone Tagged', status: 'active' },
            { icon: '🔥', title: 'Extreme Heat', threshold: '>45°C + HI >54°C', status: 'active' },
          ].map((t, i) => (
            <div key={i} style={{ background: '#FFFDFB', border: NB_BORDER, padding: '16px' }}>
              <span style={{ fontSize: 24 }}>{t.icon}</span>
              <div style={{ fontWeight: 800, color: C.accent, fontSize: 13, marginTop: 8, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t.title}</div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>{t.threshold}</div>
              <span style={{ background: '#22C55E', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 10px', border: '2px solid #04052E', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: C.surface, border: NB_BORDER, boxShadow: NB_SHADOW, padding: 28 }}>
        <SectionHeading>Loyalty Discount Progress</SectionHeading>
        <div style={{ color: C.muted, fontSize: 14, marginBottom: 20 }}>Pay consistently every week to unlock up to 15% off your premium</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
          <span style={{ color: C.muted }}>8 weeks completed</span>
          <span style={{ fontWeight: 800, color: C.primary }}>8% discount active</span>
        </div>
        <div style={{ height: 12, background: 'rgba(4,5,46,0.08)', border: '2px solid #04052E', overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ height: '100%', width: '53%', background: C.primary, transition: 'width 0.4s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.muted }}>
          <span>0 weeks</span>
          <span style={{ color: C.accent, fontWeight: 700 }}>15 weeks → 15% max discount</span>
        </div>
      </div>
    </div>
  )
}

function ClaimsTab() {
  const [filter, setFilter] = useState('all')
  const filtered = filter === 'all' ? mockClaims : mockClaims.filter(c => c.status === filter)
  return (
    <div>
      <div style={{ background: '#04052E', border: NB_BORDER, boxShadow: NB_SHADOW, padding: '20px 24px', marginBottom: 24, display: 'flex', gap: 40 }}>
        {[
          { label: 'Total Claims', value: '4', color: '#FFE566' },
          { label: 'Approved & Paid', value: '3', color: '#22C55E' },
          { label: 'Total Received', value: '₹4,200', color: '#FFE566' },
          { label: 'Under Review', value: '1', color: '#F59E0B' },
        ].map((s, i) => (
          <div key={i}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 0, marginBottom: 20, border: NB_BORDER, width: 'fit-content' }}>
        {['all', 'paid', 'under-review'].map((f, i) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '10px 20px', borderRadius: 0, fontSize: 12, fontWeight: 800, cursor: 'pointer',
            background: filter === f ? '#FFE566' : '#fff',
            color: '#04052E', border: 'none',
            borderRight: i < 2 ? '2px solid #04052E' : 'none',
            fontFamily: "'EB Garamond', serif",
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            {f === 'all' ? 'All Claims' : f === 'paid' ? '✓ Paid' : '⏳ Under Review'}
          </button>
        ))}
      </div>

      <div style={{ background: C.surface, border: NB_BORDER, boxShadow: NB_SHADOW, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, fontFamily: "'EB Garamond', serif" }}>
          <thead>
            <tr>
              {['Claim ID', 'Trigger Type', 'Date', 'Zone', 'Disrupted Hours', 'Payout', 'Status'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#FFE566', background: '#04052E', borderBottom: NB_BORDER, fontWeight: 800, borderRight: '1px solid rgba(255,229,102,0.15)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, idx) => (
              <tr key={c.id} style={{ background: idx % 2 === 1 ? 'rgba(4,5,46,0.025)' : '#fff' }}>
                <td style={{ padding: '14px 16px', fontWeight: 800, color: C.primary, borderBottom: '1.5px solid #04052E', borderRight: '1px solid rgba(4,5,46,0.1)' }}>{c.id}</td>
                <td style={{ padding: '14px 16px', fontWeight: 600, borderBottom: '1.5px solid #04052E', borderRight: '1px solid rgba(4,5,46,0.1)' }}>{c.type}</td>
                <td style={{ padding: '14px 16px', color: C.muted, borderBottom: '1.5px solid #04052E', borderRight: '1px solid rgba(4,5,46,0.1)' }}>{c.date}</td>
                <td style={{ padding: '14px 16px', color: C.muted, borderBottom: '1.5px solid #04052E', borderRight: '1px solid rgba(4,5,46,0.1)' }}>{c.zone}</td>
                <td style={{ padding: '14px 16px', borderBottom: '1.5px solid #04052E', borderRight: '1px solid rgba(4,5,46,0.1)' }}>{c.hours} hours</td>
                <td style={{ padding: '14px 16px', fontWeight: 800, color: '#16a34a', borderBottom: '1.5px solid #04052E', borderRight: '1px solid rgba(4,5,46,0.1)' }}>₹{c.amount}</td>
                <td style={{ padding: '14px 16px', borderBottom: '1.5px solid #04052E' }}><Badge status={c.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: C.muted, fontSize: 15 }}>No claims found for this filter.</div>
        )}
      </div>

      <div style={{ background: 'rgba(59,130,246,0.06)', border: '2.5px solid #04052E', borderLeft: '6px solid #3B82F6', padding: '14px 18px', marginTop: 20 }}>
        <div style={{ fontWeight: 800, color: '#04052E', fontSize: 13, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>ℹ️ Fully Automated Claims</div>
        <p style={{ color: 'rgba(4,5,46,0.7)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
          GigGuard claims are triggered automatically when your zone's data crosses a threshold. You never need to file a claim manually.
          All claims are validated by our AI engine across your GPS data and all registered platform activity.
        </p>
      </div>
    </div>
  )
}

function ProfileTab() {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div style={{ background: C.surface, border: NB_BORDER, boxShadow: NB_SHADOW, padding: 28 }}>
          <SectionHeading>Personal Information</SectionHeading>
          {[
            ['Full Name', 'Ravi Kumar'],
            ['Age', '28'],
            ['Phone', '+91 98765 43210'],
            ['Email', 'ravi@gmail.com'],
            ['PAN', 'ABCDE1234F'],
            ['Aadhaar', 'XXXX XXXX 4567'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1.5px solid rgba(4,5,46,0.1)', fontSize: 14 }}>
              <span style={{ color: C.muted }}>{k}</span>
              <span style={{ fontWeight: 700, color: C.accent }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ background: C.surface, border: NB_BORDER, boxShadow: NB_SHADOW, padding: 28 }}>
          <SectionHeading>Connected Platforms</SectionHeading>
          {[
            { name: 'Zomato', id: 'ZOM-4829134', status: 'verified', earnings: '₹1,600/wk avg' },
            { name: 'Amazon Flex', id: 'AMZ-7821039', status: 'verified', earnings: '₹1,200/wk avg' },
          ].map(p => (
            <div key={p.name} style={{ background: '#FFFDFB', border: NB_BORDER, padding: '16px', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 800, color: C.accent, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{p.name}</div>
                  <div style={{ color: C.muted, fontSize: 13, marginTop: 2 }}>ID: {p.id}</div>
                  <div style={{ color: C.muted, fontSize: 13 }}>{p.earnings}</div>
                </div>
                <span style={{ background: '#22C55E', color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px 10px', border: '2px solid #04052E', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Verified ✓</span>
              </div>
            </div>
          ))}
          <button style={{ width: '100%', padding: '12px', background: 'transparent', border: '2.5px dashed #04052E', color: C.primary, fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: "'EB Garamond', serif", marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            + Add Another Platform
          </button>
        </div>
      </div>

      <div style={{ background: C.surface, border: NB_BORDER, boxShadow: NB_SHADOW, padding: 28 }}>
        <SectionHeading>Payment Settings</SectionHeading>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.accent, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>UPI ID (for payouts)</div>
            <div style={{ background: '#FFFDFB', border: NB_BORDER, padding: '12px 16px', fontSize: 14, color: C.accent, fontWeight: 600 }}>ravi@upi</div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.accent, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>AutoPay Status</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(34,197,94,0.08)', border: '2.5px solid #04052E', borderLeft: '5px solid #22C55E', padding: '12px 16px' }}>
              <span style={{ fontSize: 16 }}>✅</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#04052E', textTransform: 'uppercase', letterSpacing: '0.04em' }}>AutoPay Enabled · 5% Discount Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function WorkerDashboard({ navigate }) {
  const [activeTab, setActiveTab] = useState('home')

  const tabContent = { home: <HomeTab />, policy: <PolicyTab />, claims: <ClaimsTab />, profile: <ProfileTab /> }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'EB Garamond', Georgia, serif", display: 'flex', flexDirection: 'column' }}>

      {/* TOP HEADER */}
      <header style={{ background: '#FFFFFF', padding: '0 32px', height: 66, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '4px solid #04052E' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, background: '#04052E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#FFE566', letterSpacing: '0.05em' }}>GG</div>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#04052E', textTransform: 'uppercase', letterSpacing: '0.06em' }}>GigGuard</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ position: 'relative', cursor: 'pointer' }}>
            <span style={{ fontSize: 20, color: '#04052E' }}>🔔</span>
            <span style={{ position: 'absolute', top: -3, right: -3, width: 10, height: 10, background: '#22C55E', border: '2px solid #fff' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <div style={{ width: 34, height: 34, border: '2.5px solid #04052E', background: 'rgba(4,5,46,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>👤</div>
            <span style={{ color: '#04052E', fontWeight: 800, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Ravi Kumar</span>
          </div>
          <button
            onClick={() => navigate('landing')}
            style={{ background: 'transparent', border: '2.5px solid #04052E', color: '#04052E', padding: '7px 16px', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: "'EB Garamond', serif", boxShadow: '3px 3px 0px #04052E', textTransform: 'uppercase', letterSpacing: '0.06em', transition: 'box-shadow 0.12s, transform 0.12s' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '1px 1px 0px #04052E'; e.currentTarget.style.transform = 'translate(2px,2px)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '3px 3px 0px #04052E'; e.currentTarget.style.transform = 'translate(0,0)' }}
          >Logout</button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* SIDEBAR */}
        <aside style={{ width: 228, background: '#fff', borderRight: '4px solid #04052E', padding: '28px 0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '0 20px 20px', borderBottom: '2px solid #04052E', marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Worker Portal</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, background: '#22C55E', display: 'inline-block', border: '1.5px solid #04052E' }} />
              <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Protected</span>
            </div>
          </div>
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', width: '100%',
              background: activeTab === item.id ? '#FFE566' : 'transparent',
              border: 'none',
              borderLeft: activeTab === item.id ? '4px solid #A51C30' : '4px solid transparent',
              color: '#04052E',
              fontWeight: activeTab === item.id ? 800 : 600,
              fontSize: 14, cursor: 'pointer', fontFamily: "'EB Garamond', serif", textAlign: 'left',
              textTransform: 'uppercase', letterSpacing: '0.04em',
              borderBottom: '1px solid rgba(4,5,46,0.1)',
            }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}

          <div style={{ marginTop: 'auto', padding: '16px 20px', borderTop: '2px solid #04052E' }}>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
              <div style={{ fontWeight: 800, color: C.accent, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 11 }}>Zone: Chennai South</div>
              <div>AQI: 95 (Moderate)</div>
              <div>Rain: 12mm / 24h</div>
              <div style={{ color: '#16a34a', marginTop: 4, fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>✓ No active alerts</div>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main style={{ flex: 1, padding: 32, overflowY: 'auto', background: '#FFFDFB' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ marginBottom: 28, borderBottom: '3px solid #04052E', paddingBottom: 16 }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: C.accent, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {NAV_ITEMS.find(n => n.id === activeTab)?.label}
              </h1>
              {activeTab === 'home' && <p style={{ color: C.muted, fontSize: 15 }}>Good morning, Ravi. Your income is protected today.</p>}
            </div>
            {tabContent[activeTab]}
          </div>
        </main>
      </div>
    </div>
  )
}
