import { useState } from 'react'
import './App.css'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import WorkerDashboard from './pages/WorkerDashboard'
import AdminDashboard from './pages/AdminDashboard'

function App() {
  const [page, setPage] = useState('landing')

  const navigate = (target) => {
    setPage(target)
    window.scrollTo(0, 0)
  }

  if (page === 'login') return <LoginPage navigate={navigate} />
  if (page === 'register') return <RegisterPage navigate={navigate} />
  if (page === 'worker-dashboard') return <WorkerDashboard navigate={navigate} />
  if (page === 'admin-dashboard') return <AdminDashboard navigate={navigate} />
  return <LandingPage navigate={navigate} />
}

export default App
