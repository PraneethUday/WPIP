import { useState } from 'react'

const NB = {
  border: '2.5px solid #04052E',
  shadow: '4px 4px 0px #04052E',
  shadowSm: '2px 2px 0px #04052E',
  shadowLg: '6px 6px 0px #04052E',
}

export default function LoginPage({ navigate }) {
  const [tab, setTab] = useState('worker')
  const [form, setForm] = useState({ email: '', password: '' })
  const [focused, setFocused] = useState('')

  const inputStyle = (name) => ({
    height: 50,
    padding: '0 16px',
    border: focused === name ? '2.5px solid #A51C30' : '2.5px solid #04052E',
    borderRadius: 0,
    fontFamily: "'EB Garamond', serif",
    fontSize: 15,
    color: '#04052E',
    background: '#fff',
    outline: 'none',
    width: '100%',
    boxShadow: focused === name ? '4px 4px 0px #A51C30' : 'none',
    transition: 'box-shadow 0.12s, border-color 0.12s',
  })

  const handleLogin = () => {
    if (tab === 'worker') navigate('worker-dashboard')
    else navigate('admin-dashboard')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FFFDFB', fontFamily: "'EB Garamond', Georgia, serif", display: 'flex', flexDirection: 'column' }}>

      {/* NAV */}
      <nav style={{ background: '#FFFFFF', padding: '0 48px', height: 66, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '4px solid #04052E' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => navigate('landing')}>
          <div style={{ width: 38, height: 38, background: '#04052E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#FFE566', letterSpacing: '0.05em' }}>GG</div>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#04052E', textTransform: 'uppercase', letterSpacing: '0.06em' }}>GigGuard</span>
        </div>
        <span style={{ fontSize: 14, color: '#04052E', fontWeight: 600 }}>
          No account?{' '}
          <span style={{ color: '#A51C30', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('register')}>
            Register as a Partner
          </span>
        </span>
      </nav>

      {/* CONTENT */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{
          display: 'flex', gap: 0, background: '#fff',
          border: '2.5px solid #04052E',
          boxShadow: '6px 6px 0px #04052E',
          width: '100%', maxWidth: 900, minHeight: 560,
          overflow: 'hidden',
        }}>

          {/* LEFT PANEL */}
          <div style={{ flex: 1, background: '#A51C30', padding: 48, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: '2.5px solid #04052E' }}>
            <div>
              <div style={{ fontSize: 34, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Welcome back to GigGuard</div>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', lineHeight: 1.65 }}>Your income is protected every week. Sign in to check your coverage, claims, and payouts.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { icon: '⚡', text: 'Automatic payouts in under 10 minutes' },
                { icon: '🤖', text: 'AI-validated claims — zero paperwork' },
                { icon: '🛡️', text: 'Coverage across all your platforms' },
                { icon: '📊', text: 'Live alerts for your delivery zone' },
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
                  <div style={{ width: 32, height: 32, background: '#04052E', border: '2px solid rgba(255,229,102,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{f.icon}</div>
                  <span style={{ fontWeight: 600 }}>{f.text}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              IRDAI Registered · Your data is secure & encrypted
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div style={{ flex: 1, padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#04052E', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Sign In</div>
            <div style={{ fontSize: 15, color: 'rgba(4,5,46,0.55)', marginBottom: 32 }}>Welcome back. Enter your credentials to continue.</div>

            {/* TABS */}
            <div style={{ display: 'flex', border: '2.5px solid #04052E', marginBottom: 28 }}>
              <button
                onClick={() => setTab('worker')}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 0, fontSize: 14, fontWeight: 800,
                  cursor: 'pointer', textAlign: 'center', border: 'none',
                  fontFamily: "'EB Garamond', serif",
                  background: tab === 'worker' ? '#FFE566' : 'transparent',
                  color: '#04052E',
                  borderRight: '2px solid #04052E',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}
              >🛵 Delivery Partner</button>
              <button
                onClick={() => setTab('admin')}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 0, fontSize: 14, fontWeight: 800,
                  cursor: 'pointer', textAlign: 'center', border: 'none',
                  fontFamily: "'EB Garamond', serif",
                  background: tab === 'admin' ? '#FFE566' : 'transparent',
                  color: '#04052E',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}
              >📊 Insurer Admin</button>
            </div>

            {/* FORM */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#04052E', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {tab === 'worker' ? 'Email / Phone Number' : 'Admin Email'}
                </label>
                <input
                  style={inputStyle('email')}
                  type="email"
                  placeholder={tab === 'worker' ? 'ravi@gigworker.in' : 'admin@gigguard.in'}
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused('')}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#04052E', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Password</label>
                <input
                  style={inputStyle('password')}
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused('')}
                />
              </div>
              <span style={{ alignSelf: 'flex-end', fontSize: 13, color: '#A51C30', fontWeight: 800, cursor: 'pointer', marginBottom: 24, marginTop: -8, textDecoration: 'underline', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Forgot password?</span>
              <button
                onClick={handleLogin}
                style={{
                  height: 52, background: '#A51C30', color: '#fff', border: '2.5px solid #04052E',
                  borderRadius: 0, fontSize: 15, fontWeight: 800, cursor: 'pointer',
                  fontFamily: "'EB Garamond', serif", boxShadow: '4px 4px 0px #04052E',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  transition: 'box-shadow 0.12s, transform 0.12s',
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '2px 2px 0px #04052E'; e.currentTarget.style.transform = 'translate(2px,2px)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '4px 4px 0px #04052E'; e.currentTarget.style.transform = 'translate(0,0)' }}
              >
                {tab === 'worker' ? 'Sign In to My Account' : 'Sign In to Admin Portal'}
              </button>
            </div>

            {/* DIVIDER */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
              <div style={{ flex: 1, height: 2, background: '#04052E' }} />
              <span style={{ fontSize: 12, color: '#04052E', fontWeight: 800, letterSpacing: '0.1em' }}>OR</span>
              <div style={{ flex: 1, height: 2, background: '#04052E' }} />
            </div>

            <button
              style={{
                height: 52, background: '#04052E', color: '#FFE566', border: '2.5px solid #04052E',
                borderRadius: 0, fontSize: 15, fontWeight: 800, cursor: 'pointer',
                fontFamily: "'EB Garamond', serif", boxShadow: '4px 4px 0px #A51C30',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                transition: 'box-shadow 0.12s, transform 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '2px 2px 0px #A51C30'; e.currentTarget.style.transform = 'translate(2px,2px)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '4px 4px 0px #A51C30'; e.currentTarget.style.transform = 'translate(0,0)' }}
            >
              🔢 Sign in with OTP
            </button>

            <div style={{ textAlign: 'center', fontSize: 14, color: 'rgba(4,5,46,0.6)', marginTop: 24 }}>
              New to GigGuard?{' '}
              <span style={{ color: '#A51C30', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('register')}>Register as a Partner</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
