import { useState } from 'react'

const C = {
  primary: '#A51C30', accent: '#04052E', bg: '#FFFDFB', surface: '#fff',
  text: '#04052E', muted: 'rgba(4,5,46,0.5)', border: '#04052E',
  success: '#22C55E', warning: '#F59E0B', error: '#EF4444', info: '#3B82F6',
  yellow: '#FFE566',
}

const NB_BORDER = '2.5px solid #04052E'
const NB_SHADOW = '4px 4px 0px #04052E'

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'policies', label: 'Policies', icon: '📝' },
  { id: 'claims', label: 'Claims Queue', icon: '⚡' },
  { id: 'fraud', label: 'Fraud Detection', icon: '🔍' },
  { id: 'analytics', label: 'Analytics', icon: '📈' },
  { id: 'premium', label: 'Premium Engine', icon: '🤖' },
]

const Badge = ({ status, label }) => {
  const configs = {
    active: { bg: '#22C55E', color: '#fff' },
    paid: { bg: '#22C55E', color: '#fff' },
    processing: { bg: '#3B82F6', color: '#fff' },
    review: { bg: '#FFE566', color: '#04052E' },
    flagged: { bg: '#EF4444', color: '#fff' },
    rejected: { bg: '#EF4444', color: '#fff' },
  }
  const cfg = configs[status] || { bg: 'rgba(4,5,46,0.1)', color: C.muted }
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      padding: '3px 10px',
      border: '2px solid #04052E',
      fontSize: 11, fontWeight: 800,
      textTransform: 'uppercase', letterSpacing: '0.06em',
    }}>{label || status}</span>
  )
}

function BarChart({ data, color = C.primary }) {
  const max = Math.max(...data.map(d => d.value))
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 110 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ fontSize: 10, color: C.muted, fontWeight: 700 }}>₹{(d.value / 1000).toFixed(0)}k</div>
          <div style={{
            width: '100%',
            background: i === data.length - 1 ? '#FFE566' : color,
            border: '2px solid #04052E',
            boxShadow: i === data.length - 1 ? '2px 2px 0px #04052E' : 'none',
            height: `${(d.value / max) * 75}px`,
            transition: 'height 0.4s',
          }} />
          <div style={{ fontSize: 10, color: C.muted, fontWeight: 600 }}>{d.label}</div>
        </div>
      ))}
    </div>
  )
}

const SectionHeading = ({ children, sub }) => (
  <div style={{ marginBottom: sub ? 8 : 20 }}>
    <div style={{ fontSize: 16, fontWeight: 800, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{children}</div>
    <div style={{ height: 3, background: '#A51C30', width: 40, marginTop: 5 }} />
    {sub && <div style={{ color: C.muted, fontSize: 13, marginTop: 8, marginBottom: 16 }}>{sub}</div>}
  </div>
)

function OverviewTab() {
  const kpis = [
    { icon: '👥', label: 'Active Policies', value: '52,340', change: '+8.2% this week', up: true },
    { icon: '💰', label: 'Total Payouts — March', value: '₹18.4L', change: '+12.3% vs last month', up: true },
    { icon: '📋', label: 'Claims This Week', value: '1,843', change: 'Chennai: 892 · Delhi: 512', up: null },
    { icon: '📉', label: 'Loss Ratio — March', value: '68.2%', change: '↓ 3.1% from last month', up: false },
    { icon: '🚨', label: 'Fraud Flags — Active', value: '23', change: '14 auto-rejected, 9 review', up: null },
    { icon: '⚡', label: 'Avg Payout Time', value: '7.4 min', change: 'Target: <10 min ✓', up: null },
  ]

  const weeklyPayouts = [
    { label: 'Mar 9', value: 220000 }, { label: 'Mar 10', value: 180000 }, { label: 'Mar 11', value: 95000 },
    { label: 'Mar 12', value: 310000 }, { label: 'Mar 13', value: 270000 }, { label: 'Mar 14', value: 190000 }, { label: 'Mar 15', value: 415000 },
  ]

  const regionalData = [
    { city: 'Chennai', workers: '12,400', risk: 'High', premium: '₹55/wk', exposure: '84%', pBar: 84 },
    { city: 'Delhi', workers: '9,800', risk: 'High', premium: '₹58/wk', exposure: '76%', pBar: 76 },
    { city: 'Mumbai', workers: '11,200', risk: 'Moderate', premium: '₹48/wk', exposure: '52%', pBar: 52 },
    { city: 'Bengaluru', workers: '8,600', risk: 'Moderate', premium: '₹44/wk', exposure: '48%', pBar: 48 },
    { city: 'Hyderabad', workers: '5,100', risk: 'Low', premium: '₹36/wk', exposure: '28%', pBar: 28 },
    { city: 'Pune', workers: '4,800', risk: 'Low', premium: '₹35/wk', exposure: '24%', pBar: 24 },
  ]

  return (
    <div>
      {/* LIVE ALERT BANNER */}
      <div style={{ background: 'rgba(239,68,68,0.06)', border: '2.5px solid #04052E', borderLeft: '6px solid #EF4444', padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 22 }}>🌧️</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, color: '#dc2626', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>HIGH EXPOSURE EVENT — Chennai Region · Active Now</div>
          <div style={{ color: '#ef4444', fontSize: 13, marginTop: 2, fontWeight: 600 }}>892 workers in scope · Estimated payout: ₹1.56L · All claims auto-queued for validation</div>
        </div>
        <span style={{ background: '#EF4444', color: '#fff', padding: '6px 16px', border: '2px solid #04052E', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Live Event</span>
      </div>

      {/* KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ background: C.surface, border: NB_BORDER, boxShadow: NB_SHADOW, padding: '20px 22px' }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>{k.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: C.accent, lineHeight: 1, marginBottom: 4 }}>{k.value}</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.text, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</div>
            <div style={{ fontSize: 12, color: k.up === true ? '#16a34a' : k.up === false ? C.primary : C.muted, fontWeight: 600 }}>{k.change}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* WEEKLY PAYOUT CHART */}
        <div style={{ background: C.surface, border: NB_BORDER, boxShadow: NB_SHADOW, padding: 24 }}>
          <SectionHeading sub="Total: ₹16.8L across all regions">Daily Payouts — This Week</SectionHeading>
          <BarChart data={weeklyPayouts} />
        </div>

        {/* LOSS RATIO */}
        <div style={{ background: C.surface, border: NB_BORDER, boxShadow: NB_SHADOW, padding: 24 }}>
          <SectionHeading>Loss Ratio by Region</SectionHeading>
          {[
            { city: 'Chennai', ratio: 84, color: '#EF4444' },
            { city: 'Delhi', ratio: 76, color: '#F59E0B' },
            { city: 'Mumbai', ratio: 52, color: '#F59E0B' },
            { city: 'Bengaluru', ratio: 44, color: '#22C55E' },
            { city: 'Hyderabad', ratio: 31, color: '#22C55E' },
          ].map(r => (
            <div key={r.city} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ fontWeight: 700, color: C.text }}>{r.city}</span>
                <span style={{ fontWeight: 800, color: r.color }}>{r.ratio}%</span>
              </div>
              <div style={{ height: 10, background: 'rgba(4,5,46,0.08)', border: '2px solid #04052E', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${r.ratio}%`, background: r.color, transition: 'width 0.4s' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* REGIONAL EXPOSURE TABLE */}
      <div style={{ background: C.surface, border: NB_BORDER, boxShadow: NB_SHADOW, overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px', borderBottom: NB_BORDER, background: '#04052E' }}>
          <div style={{ fontWeight: 800, color: '#FFE566', fontSize: 15, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Regional Exposure & Premium Status</div>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 2 }}>AI-computed premiums for the current week — auto-adjusted based on 7-day weather forecast</div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, fontFamily: "'EB Garamond', serif" }}>
          <thead>
            <tr>
              {['City', 'Active Workers', 'Risk Tier', 'AI Premium', 'Claim Exposure', 'Exposure Bar'].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#FFE566', background: '#04052E', borderBottom: NB_BORDER, fontWeight: 800, borderRight: '1px solid rgba(255,229,102,0.15)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {regionalData.map((r, idx) => (
              <tr key={r.city} style={{ background: r.pBar > 70 ? 'rgba(239,68,68,0.05)' : r.pBar > 50 ? 'rgba(245,158,11,0.04)' : idx % 2 === 1 ? 'rgba(4,5,46,0.02)' : '#fff' }}>
                <td style={{ padding: '14px 16px', fontWeight: 800, color: C.accent, borderBottom: '1.5px solid #04052E', borderRight: '1px solid rgba(4,5,46,0.1)' }}>{r.city}</td>
                <td style={{ padding: '14px 16px', color: C.muted, borderBottom: '1.5px solid #04052E', borderRight: '1px solid rgba(4,5,46,0.1)' }}>{r.workers}</td>
                <td style={{ padding: '14px 16px', borderBottom: '1.5px solid #04052E', borderRight: '1px solid rgba(4,5,46,0.1)' }}>
                  <Badge status={r.risk === 'High' ? 'flagged' : r.risk === 'Moderate' ? 'review' : 'active'} label={r.risk} />
                </td>
                <td style={{ padding: '14px 16px', fontWeight: 800, color: C.accent, borderBottom: '1.5px solid #04052E', borderRight: '1px solid rgba(4,5,46,0.1)' }}>{r.premium}</td>
                <td style={{ padding: '14px 16px', fontWeight: 800, color: r.pBar > 70 ? '#dc2626' : r.pBar > 50 ? '#d97706' : '#16a34a', borderBottom: '1.5px solid #04052E', borderRight: '1px solid rgba(4,5,46,0.1)' }}>{r.exposure}</td>
                <td style={{ padding: '14px 16px', minWidth: 120, borderBottom: '1.5px solid #04052E' }}>
                  <div style={{ height: 10, background: 'rgba(4,5,46,0.08)', border: '2px solid #04052E', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${r.pBar}%`, background: r.pBar > 70 ? '#EF4444' : r.pBar > 50 ? '#F59E0B' : '#22C55E' }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ClaimsQueueTab() {
  const claims = [
    { id: 'CLM-5920', worker: 'Ravi K.', city: 'Chennai', type: 'Heavy Rain', amount: 175, time: '2m ago', status: 'processing', fraud: 0.08 },
    { id: 'CLM-5919', worker: 'Arjun M.', city: 'Chennai', type: 'Heavy Rain', amount: 263, time: '3m ago', status: 'paid', fraud: 0.04 },
    { id: 'CLM-5918', worker: 'Priya S.', city: 'Delhi', type: 'AQI Alert', amount: 210, time: '8m ago', status: 'paid', fraud: 0.06 },
    { id: 'CLM-5917', worker: 'Meera D.', city: 'Mumbai', type: 'Flood Alert', amount: 290, time: '12m ago', status: 'review', fraud: 0.42 },
    { id: 'CLM-5916', worker: 'Suresh P.', city: 'Chennai', type: 'Heavy Rain', amount: 175, time: '15m ago', status: 'flagged', fraud: 0.91 },
    { id: 'CLM-5915', worker: 'Kavya R.', city: 'Bengaluru', type: 'Curfew', amount: 340, time: '18m ago', status: 'paid', fraud: 0.03 },
  ]
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Processing Now', value: '24', icon: '⚡', accent: '#3B82F6' },
          { label: 'Paid Today', value: '1,201', icon: '✅', accent: '#22C55E' },
          { label: 'Manual Review', value: '9', icon: '👁️', accent: '#F59E0B' },
          { label: 'Auto-Rejected', value: '14', icon: '🚫', accent: '#EF4444' },
        ].map((s, i) => (
          <div key={i} style={{ background: C.surface, border: NB_BORDER, boxShadow: NB_SHADOW, padding: '18px 20px' }}>
            <div style={{ fontSize: 26, marginBottom: 10 }}>{s.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.accent, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.surface, border: NB_BORDER, boxShadow: NB_SHADOW, overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px', borderBottom: NB_BORDER, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#04052E' }}>
          <div style={{ fontWeight: 800, color: '#FFE566', fontSize: 15, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Live Claims Feed</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, background: '#22C55E', border: '1.5px solid #fff', display: 'inline-block' }} />
            <span style={{ fontSize: 12, color: '#22C55E', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Live</span>
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, fontFamily: "'EB Garamond', serif" }}>
          <thead>
            <tr>
              {['Claim ID', 'Worker', 'City', 'Trigger', 'Amount', 'Fraud Score', 'Status', 'Time'].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#FFE566', background: '#04052E', borderBottom: NB_BORDER, fontWeight: 800, borderRight: '1px solid rgba(255,229,102,0.15)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {claims.map((c, idx) => (
              <tr key={c.id} style={{ background: idx % 2 === 1 ? 'rgba(4,5,46,0.025)' : '#fff' }}>
                <td style={{ padding: '13px 16px', fontWeight: 800, color: C.primary, borderBottom: '1.5px solid #04052E', borderRight: '1px solid rgba(4,5,46,0.1)' }}>{c.id}</td>
                <td style={{ padding: '13px 16px', fontWeight: 700, borderBottom: '1.5px solid #04052E', borderRight: '1px solid rgba(4,5,46,0.1)' }}>{c.worker}</td>
                <td style={{ padding: '13px 16px', color: C.muted, borderBottom: '1.5px solid #04052E', borderRight: '1px solid rgba(4,5,46,0.1)' }}>{c.city}</td>
                <td style={{ padding: '13px 16px', borderBottom: '1.5px solid #04052E', borderRight: '1px solid rgba(4,5,46,0.1)' }}>{c.type}</td>
                <td style={{ padding: '13px 16px', fontWeight: 800, color: '#16a34a', borderBottom: '1.5px solid #04052E', borderRight: '1px solid rgba(4,5,46,0.1)' }}>₹{c.amount}</td>
                <td style={{ padding: '13px 16px', borderBottom: '1.5px solid #04052E', borderRight: '1px solid rgba(4,5,46,0.1)' }}>
                  <span style={{ fontWeight: 800, color: c.fraud > 0.75 ? '#dc2626' : c.fraud > 0.35 ? '#d97706' : '#16a34a', fontSize: 14 }}>
                    {(c.fraud * 100).toFixed(0)}%
                  </span>
                </td>
                <td style={{ padding: '13px 16px', borderBottom: '1.5px solid #04052E', borderRight: '1px solid rgba(4,5,46,0.1)' }}>
                  <Badge status={c.status} label={c.status === 'processing' ? '⚡ Processing' : c.status === 'paid' ? '✓ Paid' : c.status === 'review' ? '👁 Review' : '🚫 Flagged'} />
                </td>
                <td style={{ padding: '13px 16px', color: C.muted, borderBottom: '1.5px solid #04052E' }}>{c.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FraudTab() {
  const queue = [
    { id: 'CLM-5916', worker: 'Suresh P.', city: 'Chennai', reason: 'GPS mismatch — not in claimed zone at event time', score: 0.91, action: 'auto-rejected' },
    { id: 'CLM-5917', worker: 'Meera D.', city: 'Mumbai', reason: 'Delivery activity detected on Amazon Flex during claimed window', score: 0.42, action: 'manual-review' },
    { id: 'CLM-5811', worker: 'Rohan K.', city: 'Delhi', reason: 'Registered 6 days ago — below minimum eligibility threshold', score: 0.78, action: 'auto-rejected' },
    { id: 'CLM-5790', worker: 'Anita S.', city: 'Bengaluru', reason: 'Abnormal claim frequency — 4x zone peer average', score: 0.65, action: 'manual-review' },
  ]

  return (
    <div>
      <div style={{ background: 'rgba(239,68,68,0.04)', border: '2.5px solid #04052E', borderLeft: '6px solid #EF4444', padding: '16px 20px', marginBottom: 24 }}>
        <div style={{ fontWeight: 800, color: '#dc2626', fontSize: 14, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>🔍 Isolation Forest Fraud Engine — Active</div>
        <div style={{ color: 'rgba(4,5,46,0.7)', fontSize: 14, lineHeight: 1.6 }}>
          Scores above <strong>0.75</strong> are auto-rejected. Scores <strong>0.35–0.75</strong> are queued for manual review.
          Scores below <strong>0.35</strong> pass automatically.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Auto-Rejected (>0.9)', value: '14', desc: 'This week', color: '#EF4444' },
          { label: 'Manual Review (0.35–0.75)', value: '9', desc: 'Pending review', color: '#F59E0B' },
          { label: 'Prevented Payout Fraud', value: '₹48,300', desc: 'Saved this month', color: '#22C55E' },
        ].map((s, i) => (
          <div key={i} style={{ background: C.surface, border: NB_BORDER, boxShadow: NB_SHADOW, padding: '20px 22px' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.accent, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
            <div style={{ fontSize: 12, color: C.muted }}>{s.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.surface, border: NB_BORDER, boxShadow: NB_SHADOW, overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px', borderBottom: NB_BORDER, background: '#04052E' }}>
          <div style={{ fontWeight: 800, color: '#FFE566', fontSize: 15, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Fraud Detection Queue</div>
        </div>
        {queue.map((f, i) => (
          <div key={f.id} style={{
            padding: '18px 22px',
            borderBottom: i < queue.length - 1 ? NB_BORDER : 'none',
            display: 'flex', alignItems: 'center', gap: 16,
            borderLeft: f.action === 'auto-rejected' ? '5px solid #EF4444' : '5px solid #FFE566',
            background: i % 2 === 1 ? 'rgba(4,5,46,0.02)' : '#fff',
          }}>
            <div style={{
              width: 56, height: 56, border: '2.5px solid #04052E',
              background: f.score > 0.75 ? '#EF4444' : '#FFE566',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: f.score > 0.75 ? '#fff' : '#04052E', lineHeight: 1 }}>{(f.score * 100).toFixed(0)}</div>
              <div style={{ fontSize: 9, color: f.score > 0.75 ? 'rgba(255,255,255,0.8)' : '#04052E', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>SCORE</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, color: C.accent, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{f.id} · {f.worker} · {f.city}</div>
              <div style={{ color: C.muted, fontSize: 13, marginTop: 3, lineHeight: 1.5 }}>{f.reason}</div>
            </div>
            <div>
              <Badge status={f.action === 'auto-rejected' ? 'rejected' : 'review'} label={f.action === 'auto-rejected' ? '🚫 Auto-Rejected' : '👁 Manual Review'} />
            </div>
            {f.action === 'manual-review' && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ padding: '7px 14px', background: 'rgba(34,197,94,0.1)', border: '2.5px solid #04052E', color: '#16a34a', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: "'EB Garamond', serif", textTransform: 'uppercase', letterSpacing: '0.06em' }}>Approve</button>
                <button style={{ padding: '7px 14px', background: 'rgba(239,68,68,0.1)', border: '2.5px solid #04052E', color: '#dc2626', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: "'EB Garamond', serif", textTransform: 'uppercase', letterSpacing: '0.06em' }}>Reject</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function AnalyticsTab() {
  const monthlyData = [
    { label: 'Sep', value: 820000 }, { label: 'Oct', value: 1100000 }, { label: 'Nov', value: 950000 },
    { label: 'Dec', value: 1380000 }, { label: 'Jan', value: 1050000 }, { label: 'Feb', value: 1480000 }, { label: 'Mar', value: 1840000 },
  ]
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Premiums — Mar', value: '₹26.9L', change: '52,340 active policies' },
          { label: 'Total Payouts — Mar', value: '₹18.4L', change: 'Loss ratio: 68.2%' },
          { label: 'Net Revenue — Mar', value: '₹8.5L', change: '+18.4% vs Feb' },
          { label: 'Avg Premium / Worker', value: '₹51', change: 'Across all tiers' },
        ].map((s, i) => (
          <div key={i} style={{ background: C.surface, border: NB_BORDER, boxShadow: NB_SHADOW, padding: '20px 22px' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: C.accent, lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.text, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
            <div style={{ fontSize: 12, color: C.muted }}>{s.change}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.surface, border: NB_BORDER, boxShadow: NB_SHADOW, padding: 28, marginBottom: 24 }}>
        <SectionHeading sub="Showing total payout disbursements. Trend driven by monsoon season and policy growth.">Monthly Payout Volume — Last 7 Months</SectionHeading>
        <BarChart data={monthlyData} color={C.primary} />
      </div>

      <div style={{ background: C.surface, border: NB_BORDER, boxShadow: NB_SHADOW, padding: 28 }}>
        <SectionHeading>Coverage Tier Distribution</SectionHeading>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {[
            { tier: 'Basic Shield', count: '14,230', pct: 27, color: '#3B82F6' },
            { tier: 'Standard Guard', count: '28,910', pct: 55, color: C.primary },
            { tier: 'Pro Protect', count: '9,200', pct: 18, color: C.accent },
          ].map(t => (
            <div key={t.tier} style={{ textAlign: 'center', padding: '20px', border: NB_BORDER, background: '#FFFDFB' }}>
              <div style={{ fontSize: 34, fontWeight: 800, color: t.color, lineHeight: 1, marginBottom: 4 }}>{t.pct}%</div>
              <div style={{ fontWeight: 800, color: C.accent, fontSize: 14, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t.tier}</div>
              <div style={{ fontSize: 13, color: C.muted }}>{t.count} workers</div>
              <div style={{ marginTop: 16, height: 10, background: 'rgba(4,5,46,0.08)', border: '2px solid #04052E', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${t.pct * 3}%`, maxWidth: '100%', background: t.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PremiumEngineTab() {
  return (
    <div>
      <div style={{ background: 'rgba(4,5,46,0.04)', border: '2.5px solid #04052E', borderLeft: '6px solid #04052E', padding: '18px 22px', marginBottom: 24 }}>
        <div style={{ fontWeight: 800, color: C.accent, fontSize: 14, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>🤖 XGBoost Premium Model · Weekly Recalibration Active</div>
        <div style={{ color: C.muted, fontSize: 14, lineHeight: 1.6 }}>
          The premium engine recalculates every Monday at 6:00 AM using 7-day weather forecasts, historical claim data, and zone-level exposure. No manual input required.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div style={{ background: C.surface, border: NB_BORDER, boxShadow: NB_SHADOW, padding: 28 }}>
          <SectionHeading>Next Week Premium Forecast</SectionHeading>
          {[
            { city: 'Chennai', premium: '₹55', change: '+10%', reason: '80% rain probability', up: true },
            { city: 'Delhi', premium: '₹58', change: '+16%', reason: 'AQI forecast >350', up: true },
            { city: 'Mumbai', premium: '₹48', change: '+7%', reason: 'Moderate rain risk', up: true },
            { city: 'Bengaluru', premium: '₹44', change: '0%', reason: 'Clear forecast', up: null },
            { city: 'Hyderabad', premium: '₹36', change: '−5%', reason: 'Below-avg risk', up: false },
            { city: 'Pune', premium: '₹35', change: '0%', reason: 'No change', up: null },
          ].map(r => (
            <div key={r.city} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1.5px solid rgba(4,5,46,0.1)', fontSize: 14 }}>
              <div>
                <span style={{ fontWeight: 800, color: C.accent }}>{r.city}</span>
                <span style={{ color: C.muted, fontSize: 12, marginLeft: 8 }}>{r.reason}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontWeight: 800, color: C.accent }}>{r.premium}/wk</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: r.up === true ? '#dc2626' : r.up === false ? '#16a34a' : C.muted }}>{r.change}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: C.surface, border: NB_BORDER, boxShadow: NB_SHADOW, padding: 28 }}>
          <SectionHeading sub="Top features driving this week's premium adjustments (XGBoost importance)">Model Feature Weights</SectionHeading>
          {[
            { feature: 'Weather Forecast (7d)', weight: 92 },
            { feature: 'Regional Exposure Factor', weight: 87 },
            { feature: 'Zone Risk Score', weight: 74 },
            { feature: 'Historical Claim Rate', weight: 68 },
            { feature: 'AQI Forecast (7d)', weight: 61 },
            { feature: 'Worker Earnings Avg', weight: 45 },
            { feature: 'Loyalty Discount', weight: 28 },
          ].map(f => (
            <div key={f.feature} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ fontWeight: 700, color: C.text }}>{f.feature}</span>
                <span style={{ fontWeight: 800, color: C.primary }}>{f.weight}</span>
              </div>
              <div style={{ height: 10, background: 'rgba(4,5,46,0.08)', border: '2px solid #04052E', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${f.weight}%`, background: f.weight > 80 ? '#FFE566' : C.primary, transition: 'width 0.4s' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PoliciesTab() {
  const policies = [
    { id: 'GG-44821', worker: 'Ravi Kumar', city: 'Chennai', tier: 'Standard', platforms: 2, premium: 99, status: 'active', weeks: 8 },
    { id: 'GG-44800', worker: 'Priya Sharma', city: 'Delhi', tier: 'Standard', platforms: 1, premium: 76, status: 'active', weeks: 12 },
    { id: 'GG-44777', worker: 'Arjun Mehta', city: 'Bengaluru', tier: 'Pro', platforms: 2, premium: 115, status: 'active', weeks: 21 },
    { id: 'GG-44760', worker: 'Meera Das', city: 'Mumbai', tier: 'Basic', platforms: 1, premium: 34, status: 'active', weeks: 3 },
    { id: 'GG-44731', worker: 'Suresh Pillai', city: 'Chennai', tier: 'Basic', platforms: 1, premium: 30, status: 'review', weeks: 1 },
  ]
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Active', value: '52,340' }, { label: 'Basic Shield', value: '14,230' },
          { label: 'Standard Guard', value: '28,910' }, { label: 'Pro Protect', value: '9,200' },
        ].map((s, i) => (
          <div key={i} style={{ background: C.surface, border: NB_BORDER, boxShadow: NB_SHADOW, padding: '18px 20px' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: C.accent, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ background: C.surface, border: NB_BORDER, boxShadow: NB_SHADOW, overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px', borderBottom: NB_BORDER, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#04052E' }}>
          <div style={{ fontWeight: 800, color: '#FFE566', fontSize: 15, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Policy Register</div>
          <input
            placeholder="Search policies..."
            style={{
              padding: '8px 16px', border: '2.5px solid rgba(255,229,102,0.5)', background: 'rgba(255,255,255,0.1)',
              fontSize: 13, fontFamily: "'EB Garamond', serif", outline: 'none', width: 200, color: '#fff',
            }}
          />
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, fontFamily: "'EB Garamond', serif" }}>
          <thead>
            <tr>
              {['Policy ID', 'Worker', 'City', 'Tier', 'Platforms', 'Weekly Premium', 'Active Weeks', 'Status'].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#FFE566', background: '#04052E', borderBottom: NB_BORDER, fontWeight: 800, borderRight: '1px solid rgba(255,229,102,0.15)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {policies.map((p, idx) => (
              <tr key={p.id} style={{ background: idx % 2 === 1 ? 'rgba(4,5,46,0.025)' : '#fff' }}>
                <td style={{ padding: '13px 16px', fontWeight: 800, color: C.primary, borderBottom: '1.5px solid #04052E', borderRight: '1px solid rgba(4,5,46,0.1)' }}>{p.id}</td>
                <td style={{ padding: '13px 16px', fontWeight: 700, borderBottom: '1.5px solid #04052E', borderRight: '1px solid rgba(4,5,46,0.1)' }}>{p.worker}</td>
                <td style={{ padding: '13px 16px', color: C.muted, borderBottom: '1.5px solid #04052E', borderRight: '1px solid rgba(4,5,46,0.1)' }}>{p.city}</td>
                <td style={{ padding: '13px 16px', borderBottom: '1.5px solid #04052E', borderRight: '1px solid rgba(4,5,46,0.1)' }}><Badge status={p.tier === 'Pro' ? 'flagged' : p.tier === 'Standard' ? 'processing' : 'active'} label={p.tier} /></td>
                <td style={{ padding: '13px 16px', borderBottom: '1.5px solid #04052E', borderRight: '1px solid rgba(4,5,46,0.1)' }}>{p.platforms}</td>
                <td style={{ padding: '13px 16px', fontWeight: 800, color: C.accent, borderBottom: '1.5px solid #04052E', borderRight: '1px solid rgba(4,5,46,0.1)' }}>₹{p.premium}</td>
                <td style={{ padding: '13px 16px', color: C.muted, borderBottom: '1.5px solid #04052E', borderRight: '1px solid rgba(4,5,46,0.1)' }}>{p.weeks} wks</td>
                <td style={{ padding: '13px 16px', borderBottom: '1.5px solid #04052E' }}><Badge status={p.status} label={p.status === 'active' ? '✓ Active' : '⏳ Review'} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function AdminDashboard({ navigate }) {
  const [activeTab, setActiveTab] = useState('overview')

  const tabMap = {
    overview: <OverviewTab />,
    policies: <PoliciesTab />,
    claims: <ClaimsQueueTab />,
    fraud: <FraudTab />,
    analytics: <AnalyticsTab />,
    premium: <PremiumEngineTab />,
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'EB Garamond', Georgia, serif", display: 'flex', flexDirection: 'column' }}>

      {/* HEADER */}
      <header style={{ background: '#04052E', padding: '0 32px', height: 66, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '4px solid #A51C30' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, background: '#FFE566', border: '2.5px solid #FFE566', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#04052E', letterSpacing: '0.05em' }}>GG</div>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>GigGuard</span>
          <span style={{ marginLeft: 8, background: '#A51C30', color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px 12px', border: '2px solid #FFE566', letterSpacing: '0.1em', textTransform: 'uppercase' }}>ADMIN</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>admin@gigguard.in</span>
          <button
            onClick={() => navigate('landing')}
            style={{ background: 'transparent', border: '2.5px solid rgba(255,255,255,0.6)', color: '#fff', padding: '7px 16px', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: "'EB Garamond', serif", boxShadow: '3px 3px 0px rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', transition: 'box-shadow 0.12s, transform 0.12s' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '1px 1px 0px rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'translate(2px,2px)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '3px 3px 0px rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'translate(0,0)' }}
          >Logout</button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* SIDEBAR */}
        <aside style={{ width: 228, background: '#fff', borderRight: '4px solid #04052E', padding: '24px 0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '0 20px 16px', borderBottom: '2px solid #04052E', marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Insurer Dashboard</div>
            <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>● Live monitoring active</div>
          </div>
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', width: '100%',
              background: activeTab === item.id ? '#FFE566' : 'transparent',
              border: 'none',
              borderLeft: activeTab === item.id ? '4px solid #A51C30' : '4px solid transparent',
              color: '#04052E',
              fontWeight: activeTab === item.id ? 800 : 600,
              fontSize: 14, cursor: 'pointer', fontFamily: "'EB Garamond', serif", textAlign: 'left',
              textTransform: 'uppercase', letterSpacing: '0.04em',
              borderBottom: '1px solid rgba(4,5,46,0.08)',
            }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </aside>

        {/* MAIN */}
        <main style={{ flex: 1, padding: 32, overflowY: 'auto', background: '#FFFDFB' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ marginBottom: 28, borderBottom: '3px solid #04052E', paddingBottom: 16 }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: C.accent, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {NAV_ITEMS.find(n => n.id === activeTab)?.label}
              </h1>
              <p style={{ color: C.muted, fontSize: 14 }}>
                {activeTab === 'overview' && 'Live metrics for GigGuard operations · Updated every 60 seconds'}
                {activeTab === 'claims' && 'Real-time claim processing feed · AI-validated automatic payouts'}
                {activeTab === 'fraud' && 'Isolation Forest anomaly detection · Active fraud prevention'}
                {activeTab === 'analytics' && 'Business intelligence and performance metrics'}
                {activeTab === 'premium' && 'XGBoost ML model · Weekly recalibration every Monday'}
                {activeTab === 'policies' && 'All registered policies across India'}
              </p>
            </div>
            {tabMap[activeTab]}
          </div>
        </main>
      </div>
    </div>
  )
}
