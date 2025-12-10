import React, { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { Toaster, toast } from 'react-hot-toast'
import { checkSessionExpired } from './utils/authFetch'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import MyCardsPage from './pages/MyCardsPage'
import CreateCardPage from './pages/CreateCardPage'
import CardDetailPage from './pages/CardDetailPage'
import AccountSettingsPage from './pages/AccountSettingsPage'

interface User {
  userId: string
  _id: string
  firstName?: string
  lastName?: string
  token?: string
  refreshToken?: string
}

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Check if session expired (after 401 redirect)
    if (checkSessionExpired()) {
      toast.error('Votre session a expiré. Veuillez vous reconnecter.', {
        duration: 5000,
        position: 'top-center',
        style: {
          background: '#FEE2E2',
          color: '#991B1B',
          fontWeight: '500',
        },
      });
    }

    // Load user from localStorage
    const storedUser = localStorage.getItem('currentUser')
    if (storedUser) {
      try {
        const user: User = JSON.parse(storedUser)
        console.log('[App] Loading user from localStorage:', user)
        setCurrentUser(user)
      } catch (error) {
        console.error('Error parsing stored user:', error)
        localStorage.removeItem('currentUser')
      }
    }
  }, [])

  const handleUserUpdate = (userId: string, _id: string, firstName?: string, lastName?: string) => {
    // CRITICAL: Preserve existing token and refreshToken when updating user
    const existingUser = localStorage.getItem('currentUser')
    let token: string | undefined
    let refreshToken: string | undefined
    
    if (existingUser) {
      try {
        const parsed = JSON.parse(existingUser)
        token = parsed.token
        refreshToken = parsed.refreshToken
        console.log('[App.handleUserUpdate] Preserving existing token:', !!token)
      } catch (error) {
        console.error('[App.handleUserUpdate] Error parsing existing user:', error)
      }
    }

    const user: User = { 
      userId, 
      _id, 
      firstName, 
      lastName,
      token,
      refreshToken
    }
    
    console.log('[App.handleUserUpdate] Updating user with:', user)
    setCurrentUser(user)
    localStorage.setItem('currentUser', JSON.stringify(user))
  }

  const handleLoginSuccess = (userId: string, _id: string, firstName?: string, lastName?: string) => {
    // CRITICAL: Read the FULL user object from localStorage (which includes token)
    // LoginModal has already stored the complete user with token
    const storedUser = localStorage.getItem('currentUser')
    
    if (storedUser) {
      try {
        const user: User = JSON.parse(storedUser)
        console.log('[App.handleLoginSuccess] Using stored user from localStorage:', user)
        console.log('[App.handleLoginSuccess] Token present:', !!user.token)
        setCurrentUser(user)
        // DO NOT overwrite localStorage - it already has the complete user with token
      } catch (error) {
        console.error('[App.handleLoginSuccess] Error parsing stored user:', error)
        // Fallback: create user without token (will need to re-login)
        const user: User = { userId, _id, firstName, lastName }
        setCurrentUser(user)
        localStorage.setItem('currentUser', JSON.stringify(user))
      }
    } else {
      // Fallback: create user without token (will need to re-login)
      console.warn('[App.handleLoginSuccess] No stored user found, creating without token')
      const user: User = { userId, _id, firstName, lastName }
      setCurrentUser(user)
      localStorage.setItem('currentUser', JSON.stringify(user))
    }
    
    navigate('/my-cards')
  }

  const handleLogout = () => {
    console.log('[App.handleLogout] Logging out user')
    setCurrentUser(null)
    localStorage.removeItem('currentUser')
    navigate('/')
  }

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <Layout currentUser={currentUser} onLoginSuccess={handleLoginSuccess} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<HomePage currentUser={currentUser} />} />
          <Route path="/my-cards" element={<MyCardsPage currentUser={currentUser} onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/create-card" element={<CreateCardPage currentUser={currentUser} />} />
          <Route path="/card/:cardId" element={<CardDetailPage currentUser={currentUser} />} />
          <Route
            path="/settings"
            element={<AccountSettingsPage currentUser={currentUser} onUserUpdate={handleUserUpdate} />}
          />
        </Routes>
      </Layout>
    </>
  )
}

export default App
