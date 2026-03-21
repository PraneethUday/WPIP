import { useState } from 'react'

const COLORS = { primary: '#A51C30', accent: '#04052E', bg: '#FFFDFB', surface: '#fff', text: '#04052E', border: '#04052E', muted: 'rgba(4,5,46,0.5)' }

const PLATFORMS = [
  { id: 'zomato', name: 'Zomato', emoji: '🍕' },
  { id: 'swiggy', name: 'Swiggy', emoji: '🧡' },
  { id: 'amazon', name: 'Amazon Flex', emoji: '📦' },
  { id: 'blinkit', name: 'Blinkit', emoji: '⚡' },
  { id: 'zepto', name: 'Zepto', emoji: '🟡' },
  { id: 'meesho', name: 'Meesho', emoji: '🛍️' },
  { id: 'porter', name: 'Porter', emoji: '🚚' },
  { id: 'dunzo', name: 'Dunzo', emoji: '🔵' },
]

const CITIES = ['Bengaluru', 'Chennai', 'Delhi', 'Mumbai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Surat']

const STEPS = [
  { num: 1, label: 'Platform' },
  { num: 2, label: 'Personal Info' },
  { num: 3, label: 'Documents' },
  { num: 4, label: 'Coverage' },
]

const nbInput = (focused, name) => ({
  height: 50, padding: '0 16px',
  border: `2.5px solid ${focused === name ? COLORS.primary : COLORS.accent}`,
  borderRadius: 0,
  fontFamily: "'EB Garamond', serif", fontSize: 15, color: COLORS.text,
  background: '#fff', outline: 'none', width: '100%',
  boxShadow: focused === name ? '4px 4px 0px #A51C30' : 'none',
  transition: 'box-shadow 0.12s, border-color 0.12s',
})

const labelStyle = {
  fontSize: 12, fontWeight: 800, color: COLORS.accent,
  letterSpacing: '0.08em', marginBottom: 6, display: 'block',
  textTransform: 'uppercase',
}

export default function RegisterPage({ navigate }) {
  const [step, setStep] = useState(1)
  const [focused, setFocused] = useState('')
  const [form, setForm] = useState({
    platforms: [],
    name: '', age: '', phone: '', email: '',
    pan: '', aadhaar: '', city: '', area: '',
    deliveryId: '', consent: false, autopay: false,
    tier: 'standard',
  })

  const update = (key, val) => setForm(p => ({ ...p, [key]: val }))
  const togglePlatform = (id) => {
    setForm(p => ({ ...p, platforms: p.platforms.includes(id) ? p.platforms.filter(x => x !== id) : [...p.platforms, id] }))
  }

  const nextStep = () => setStep(s => Math.min(s + 1, 4))
  const prevStep = () => setStep(s => Math.max(s - 1, 1))

  const handleSubmit = () => navigate('worker-dashboard')

  const weeklyPremium = form.tier === 'basic' ? 30 : form.tier === 'standard' ? 60 : 105
  const maxPayout = form.tier === 'basic' ? 500 : form.tier === 'standard' ? 1200 : 2500

  const btnHover = (e, enter) => {
    e.currentTarget.style.boxShadow = enter ? '2px 2px 0px #04052E' : '4px 4px 0px #04052E'
    e.currentTarget.style.transform = enter ? 'translate(2px,2px)' : 'translate(0,0)'
  }

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, fontFamily: "'EB Garamond', Georgia, serif" }}>

      {/* NAV */}
      <nav style={{ background: '#FFFFFF', padding: '0 48px', height: 66, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '4px solid #04052E' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => navigate('landing')}>
          <div style={{ width: 38, height: 38, background: '#04052E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#FFE566', letterSpacing: '0.05em' }}>GG</div>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#04052E', textTransform: 'uppercase', letterSpacing: '0.06em' }}>GigGuard</span>
        </div>
        <span style={{ fontSize: 14, color: '#04052E', fontWeight: 600 }}>
          Already a partner?{' '}
          <span style={{ color: '#A51C30', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('login')}>Sign In</span>
        </span>
      </nav>

      {/* PROGRESS STEPPER */}
      <div style={{ background: '#fff', borderBottom: '3px solid #04052E', padding: '24px 0' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
          {STEPS.map((s, i) => (
            <div key={s.num} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2.5px solid #04052E',
                  background: step > s.num ? '#FFE566' : step === s.num ? COLORS.primary : 'transparent',
                  color: step === s.num ? '#fff' : '#04052E',
                  fontSize: 15, fontWeight: 800,
                  boxShadow: step === s.num ? '3px 3px 0px #04052E' : 'none',
                }}>
                  {step > s.num ? '✓' : s.num}
                </div>
                <span style={{ fontSize: 12, fontWeight: step === s.num ? 800 : 600, color: step === s.num ? COLORS.primary : COLORS.muted, whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ width: 80, height: 3, background: step > s.num ? '#04052E' : 'rgba(4,5,46,0.15)', margin: '0 8px', marginBottom: 28 }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* MAIN */}
      <div style={{ maxWidth: 760, margin: '40px auto', padding: '0 24px 80px' }}>

        {/* STEP 1: Platform Selection */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 30, fontWeight: 800, color: COLORS.accent, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Choose Your Platforms</h2>
            <p style={{ color: COLORS.muted, fontSize: 16, marginBottom: 32, lineHeight: 1.6 }}>
              Select all the delivery platforms you work with. GigGuard protects your income across all of them simultaneously.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 32 }}>
              {PLATFORMS.map(p => {
                const selected = form.platforms.includes(p.id)
                return (
                  <div key={p.id} onClick={() => togglePlatform(p.id)} style={{
                    background: selected ? '#04052E' : '#fff',
                    border: '2.5px solid #04052E',
                    padding: '20px 16px', textAlign: 'center', cursor: 'pointer',
                    boxShadow: selected ? '4px 4px 0px #A51C30' : '3px 3px 0px #04052E',
                    transition: 'box-shadow 0.12s, transform 0.12s',
                  }}>
                    <div style={{ fontSize: 28, marginBottom: 10 }}>{p.emoji}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: selected ? '#FFE566' : COLORS.text, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{p.name}</div>
                    {selected && <div style={{ fontSize: 11, color: '#FFE566', marginTop: 6, fontWeight: 800 }}>✓ Selected</div>}
                  </div>
                )
              })}
            </div>

            {form.platforms.length > 0 && (
              <div style={{ background: 'rgba(34,197,94,0.08)', border: '2.5px solid #04052E', borderLeft: '5px solid #22C55E', padding: '14px 18px', marginBottom: 24 }}>
                <div style={{ color: '#04052E', fontWeight: 800, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  ✓ {form.platforms.length} platform{form.platforms.length > 1 ? 's' : ''} selected
                  {form.platforms.length > 1 && ' · Multi-platform discount applied'}
                </div>
              </div>
            )}

            <div style={{ background: 'rgba(59,130,246,0.06)', border: '2.5px solid #04052E', borderLeft: '5px solid #3B82F6', padding: '16px 18px', marginBottom: 32 }}>
              <div style={{ fontWeight: 800, color: '#04052E', fontSize: 13, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>ℹ️ Minimum Eligibility Requirement</div>
              <p style={{ color: 'rgba(4,5,46,0.75)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                You must have at least <strong>2 weeks of verified delivery activity</strong> on at least one platform.
                If you're new, you can pre-register — coverage activates automatically once your 2-week history is verified.
              </p>
            </div>

            <button
              disabled={form.platforms.length === 0}
              onClick={nextStep}
              onMouseEnter={e => form.platforms.length > 0 && btnHover(e, true)}
              onMouseLeave={e => form.platforms.length > 0 && btnHover(e, false)}
              style={{
                height: 52, width: '100%',
                background: form.platforms.length > 0 ? COLORS.primary : 'rgba(4,5,46,0.1)',
                color: form.platforms.length > 0 ? '#fff' : COLORS.muted,
                border: '2.5px solid #04052E',
                borderRadius: 0, fontSize: 15, fontWeight: 800,
                cursor: form.platforms.length > 0 ? 'pointer' : 'not-allowed',
                fontFamily: "'EB Garamond', serif",
                boxShadow: form.platforms.length > 0 ? '4px 4px 0px #04052E' : 'none',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                transition: 'box-shadow 0.12s, transform 0.12s',
              }}
            >
              Continue to Personal Information →
            </button>
          </div>
        )}

        {/* STEP 2: Personal Info */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: 30, fontWeight: 800, color: COLORS.accent, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Personal Information</h2>
            <p style={{ color: COLORS.muted, fontSize: 16, marginBottom: 32, lineHeight: 1.6 }}>
              Your details are used to verify your identity and deliver payouts to the right account.
            </p>

            <div style={{ background: '#fff', border: '2.5px solid #04052E', boxShadow: '4px 4px 0px #04052E', padding: 32, marginBottom: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Full Name (as on Aadhaar)</label>
                  <input style={nbInput(focused, 'name')} placeholder="Ravi Kumar" value={form.name} onFocus={() => setFocused('name')} onBlur={() => setFocused('')} onChange={e => update('name', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Age</label>
                  <input style={nbInput(focused, 'age')} placeholder="28" value={form.age} onFocus={() => setFocused('age')} onBlur={() => setFocused('')} onChange={e => update('age', e.target.value)} type="number" />
                </div>
                <div>
                  <label style={labelStyle}>Phone Number</label>
                  <input style={nbInput(focused, 'phone')} placeholder="+91 98765 43210" value={form.phone} onFocus={() => setFocused('phone')} onBlur={() => setFocused('')} onChange={e => update('phone', e.target.value)} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Email Address</label>
                  <input style={nbInput(focused, 'email')} placeholder="ravi@gmail.com" value={form.email} onFocus={() => setFocused('email')} onBlur={() => setFocused('')} onChange={e => update('email', e.target.value)} type="email" />
                </div>
                <div>
                  <label style={labelStyle}>City of Service</label>
                  <select style={{ ...nbInput(focused, 'city'), cursor: 'pointer' }} value={form.city} onFocus={() => setFocused('city')} onBlur={() => setFocused('')} onChange={e => update('city', e.target.value)}>
                    <option value="">Select City</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Delivery Area / Zone</label>
                  <input style={nbInput(focused, 'area')} placeholder="e.g. Koramangala, South Zone" value={form.area} onFocus={() => setFocused('area')} onBlur={() => setFocused('')} onChange={e => update('area', e.target.value)} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Primary Delivery Partner ID</label>
                  <input style={nbInput(focused, 'deliveryId')} placeholder="e.g. ZOM-4829134" value={form.deliveryId} onFocus={() => setFocused('deliveryId')} onBlur={() => setFocused('')} onChange={e => update('deliveryId', e.target.value)} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={prevStep}
                onMouseEnter={e => btnHover(e, true)}
                onMouseLeave={e => btnHover(e, false)}
                style={{ flex: 1, height: 52, background: 'transparent', color: COLORS.accent, border: '2.5px solid #04052E', borderRadius: 0, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: "'EB Garamond', serif", boxShadow: '4px 4px 0px #04052E', textTransform: 'uppercase', letterSpacing: '0.06em', transition: 'box-shadow 0.12s, transform 0.12s' }}>
                ← Back
              </button>
              <button
                onClick={nextStep}
                onMouseEnter={e => btnHover(e, true)}
                onMouseLeave={e => btnHover(e, false)}
                style={{ flex: 2, height: 52, background: COLORS.primary, color: '#fff', border: '2.5px solid #04052E', borderRadius: 0, fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: "'EB Garamond', serif", boxShadow: '4px 4px 0px #04052E', textTransform: 'uppercase', letterSpacing: '0.08em', transition: 'box-shadow 0.12s, transform 0.12s' }}>
                Continue to Documents →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Documents */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: 30, fontWeight: 800, color: COLORS.accent, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Identity Documents</h2>
            <p style={{ color: COLORS.muted, fontSize: 16, marginBottom: 32, lineHeight: 1.6 }}>
              Required for IRDAI compliance and payout verification. Your data is encrypted and never shared.
            </p>

            <div style={{ background: '#fff', border: '2.5px solid #04052E', boxShadow: '4px 4px 0px #04052E', padding: 32, marginBottom: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <label style={labelStyle}>PAN Card Number</label>
                  <input style={nbInput(focused, 'pan')} placeholder="ABCDE1234F" value={form.pan} onFocus={() => setFocused('pan')} onBlur={() => setFocused('')} onChange={e => update('pan', e.target.value.toUpperCase())} maxLength={10} />
                  <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>10-digit alphanumeric</div>
                </div>
                <div>
                  <label style={labelStyle}>Aadhaar Number</label>
                  <input style={nbInput(focused, 'aadhaar')} placeholder="XXXX XXXX XXXX" value={form.aadhaar} onFocus={() => setFocused('aadhaar')} onBlur={() => setFocused('')} onChange={e => update('aadhaar', e.target.value)} maxLength={12} />
                  <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>12-digit number</div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>UPI ID (for payouts)</label>
                  <input style={nbInput(focused, 'upi')} placeholder="ravi@upi or 98765@paytm" onFocus={() => setFocused('upi')} onBlur={() => setFocused('')} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Bank Account (optional)</label>
                  <input style={nbInput(focused, 'bank')} placeholder="IFSC Code + Account Number" onFocus={() => setFocused('bank')} onBlur={() => setFocused('')} />
                </div>
              </div>

              <div style={{ marginTop: 28 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.accent, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '2px solid #04052E', paddingBottom: 8 }}>Consent & Authorisations</div>
                {[
                  { key: 'consent', label: 'I authorise GigGuard to monitor weather and disruption data in my registered delivery zone for the purpose of parametric insurance claims.' },
                  { key: 'gpsConsent', label: 'I authorise GigGuard to validate my GPS location during active disruption events for fraud prevention.' },
                  { key: 'autopay', label: 'Enable AutoPay — Automatically deduct my weekly premium from my platform payout (5% discount applied).' },
                ].map(item => (
                  <label key={item.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', marginBottom: 14 }}>
                    <input type="checkbox" checked={!!form[item.key]} onChange={e => update(item.key, e.target.checked)} style={{ width: 18, height: 18, accentColor: COLORS.primary, cursor: 'pointer', marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: COLORS.text, lineHeight: 1.55 }}>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={prevStep}
                onMouseEnter={e => btnHover(e, true)}
                onMouseLeave={e => btnHover(e, false)}
                style={{ flex: 1, height: 52, background: 'transparent', color: COLORS.accent, border: '2.5px solid #04052E', borderRadius: 0, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: "'EB Garamond', serif", boxShadow: '4px 4px 0px #04052E', textTransform: 'uppercase', letterSpacing: '0.06em', transition: 'box-shadow 0.12s, transform 0.12s' }}>← Back</button>
              <button
                onClick={nextStep}
                onMouseEnter={e => btnHover(e, true)}
                onMouseLeave={e => btnHover(e, false)}
                style={{ flex: 2, height: 52, background: COLORS.primary, color: '#fff', border: '2.5px solid #04052E', borderRadius: 0, fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: "'EB Garamond', serif", boxShadow: '4px 4px 0px #04052E', textTransform: 'uppercase', letterSpacing: '0.08em', transition: 'box-shadow 0.12s, transform 0.12s' }}>
                Review Coverage →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Coverage Summary */}
        {step === 4 && (
          <div>
            <h2 style={{ fontSize: 30, fontWeight: 800, color: COLORS.accent, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Choose Your Coverage</h2>
            <p style={{ color: COLORS.muted, fontSize: 16, marginBottom: 32, lineHeight: 1.6 }}>
              Our AI has recommended a plan based on your earnings and zone. You can adjust it below.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
              {[
                { id: 'basic', tier: 'Basic Shield', price: '₹20–40', payout: '₹500', for: 'Part-time riders' },
                { id: 'standard', tier: 'Standard Guard', price: '₹40–80', payout: '₹1,200', for: 'Full-time riders', recommended: true },
                { id: 'pro', tier: 'Pro Protect', price: '₹80–130', payout: '₹2,500', for: 'High earners' },
              ].map(t => (
                <div key={t.id} onClick={() => update('tier', t.id)} style={{
                  background: form.tier === t.id ? COLORS.primary : '#fff',
                  border: '2.5px solid #04052E',
                  padding: 24, cursor: 'pointer', position: 'relative',
                  boxShadow: form.tier === t.id ? '4px 4px 0px #04052E' : '3px 3px 0px #04052E',
                  transition: 'box-shadow 0.12s, transform 0.12s',
                }}>
                  {t.recommended && (
                    <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#FFE566', color: '#04052E', fontSize: 10, fontWeight: 800, padding: '4px 12px', border: '2px solid #04052E', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      AI RECOMMENDED
                    </div>
                  )}
                  <div style={{ fontSize: 14, fontWeight: 800, color: form.tier === t.id ? '#FFE566' : COLORS.accent, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t.tier}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: form.tier === t.id ? '#fff' : COLORS.accent, marginBottom: 2 }}>{t.price}</div>
                  <div style={{ fontSize: 12, color: form.tier === t.id ? 'rgba(255,255,255,0.6)' : COLORS.muted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>per week</div>
                  <div style={{ fontSize: 13, color: form.tier === t.id ? 'rgba(255,255,255,0.75)' : COLORS.muted }}>Max payout: <strong style={{ color: form.tier === t.id ? '#FFE566' : COLORS.text }}>{t.payout}</strong></div>
                </div>
              ))}
            </div>

            <div style={{ background: '#fff', border: '2.5px solid #04052E', boxShadow: '4px 4px 0px #04052E', padding: 28, marginBottom: 24 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.accent, marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '2px solid #04052E', paddingBottom: 10 }}>Coverage Summary</div>
              {[
                ['Selected Platforms', form.platforms.length > 0 ? form.platforms.map(id => PLATFORMS.find(p => p.id === id)?.name).join(', ') : '—'],
                ['Weekly Premium (estimated)', `₹${weeklyPremium}`],
                ['Maximum Weekly Payout', `₹${maxPayout}`],
                ['AutoPay Discount', form.autopay ? '5% applied' : 'Not enabled'],
                ['Multi-Platform Discount', form.platforms.length > 1 ? 'Applied' : 'N/A'],
                ['Coverage Start', 'After 2-week activity verification'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(4,5,46,0.1)', fontSize: 14 }}>
                  <span style={{ color: COLORS.muted }}>{k}</span>
                  <span style={{ fontWeight: 800, color: COLORS.accent }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ background: 'rgba(34,197,94,0.08)', border: '2.5px solid #04052E', borderLeft: '5px solid #22C55E', padding: '14px 18px', marginBottom: 24 }}>
              <div style={{ color: '#04052E', fontWeight: 800, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                ✓ Zero manual claims. Your payouts happen automatically when a trigger fires in your zone.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={prevStep}
                onMouseEnter={e => btnHover(e, true)}
                onMouseLeave={e => btnHover(e, false)}
                style={{ flex: 1, height: 52, background: 'transparent', color: COLORS.accent, border: '2.5px solid #04052E', borderRadius: 0, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: "'EB Garamond', serif", boxShadow: '4px 4px 0px #04052E', textTransform: 'uppercase', letterSpacing: '0.06em', transition: 'box-shadow 0.12s, transform 0.12s' }}>← Back</button>
              <button
                onClick={handleSubmit}
                onMouseEnter={e => btnHover(e, true)}
                onMouseLeave={e => btnHover(e, false)}
                style={{ flex: 2, height: 52, background: COLORS.primary, color: '#fff', border: '2.5px solid #04052E', borderRadius: 0, fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: "'EB Garamond', serif", boxShadow: '4px 4px 0px #04052E', textTransform: 'uppercase', letterSpacing: '0.08em', transition: 'box-shadow 0.12s, transform 0.12s' }}>
                Confirm & Get Protected →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
