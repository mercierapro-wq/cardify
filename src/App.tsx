import React, { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { Toaster, toast } from 'react-hot-toast'
import { checkSessionExpired } from './utils/authFetch'
import { API_ENDPOINTS, apiCallNoAuth } from './config/api'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import MyCardsPage from './pages/MyCardsPage'
import CreateCardPage from './pages/CreateCardPage'
import CardDetailPage from './pages/CardDetailPage'
import AccountSettingsPage from './pages/AccountSettingsPage'
import PrivacyPage from './pages/PrivacyPage'
import FAQPage from './pages/FAQPage'

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

  useEffect(() => {
    const handleSSGoogleCallback = async () => {
      const fragment = window.location.hash

      if (!fragment.startsWith('#token=')) {
        return
      }

      const token = fragment.substring('#token='.length)

      if (!token) {
        console.warn('[App.SSO] Token fragment found but empty')
        window.history.replaceState(null, '', window.location.pathname)
        return
      }

      console.log('[App.SSO] Token found in URL fragment, processing SSO callback')

      try {
        const userToStore = {
          userId: 'placeholder_sso',
          _id: 'placeholder_sso',
          token: token,
          refreshToken: undefined
        }

        localStorage.setItem('currentUser', JSON.stringify(userToStore))
        console.log('[App.SSO] Token stored in localStorage')

        const response = await apiCallNoAuth(API_ENDPOINTS.GET_USER, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ user_id: userToStore.userId, password: "", user_type: "SSO" }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error('[App.SSO] Failed to get user info:', errorData)
          toast.error('Erreur lors de la récupération des informations utilisateur', {
            duration: 5000,
            position: 'top-center',
          })
          localStorage.removeItem('currentUser')
          window.history.replaceState(null, '', window.location.pathname)
          return
        }

        const data = await response.json()

        if (Array.isArray(data) && data.length > 0) {
          const userData = data[0]
          const { user_id, _id, firstName, lastName } = userData

          const fullUser: User = {
            userId: user_id,
            _id: _id,
            firstName: firstName,
            lastName: lastName,
            token: token,
            refreshToken: undefined
          }

          console.log('[App.SSO] User info retrieved:', { user_id, firstName, lastName })
          localStorage.setItem('currentUser', JSON.stringify(fullUser))
          setCurrentUser(fullUser)

          window.history.replaceState(null, '', window.location.pathname)
          navigate('/my-cards')

          toast.success(`Bienvenue ${firstName || 'utilisateur'}!`, {
            duration: 3000,
            position: 'top-center',
          })
        } else {
          console.error('[App.SSO] Unexpected response format')
          toast.error('Erreur lors de la connexion SSO', {
            duration: 5000,
            position: 'top-center',
          })
          localStorage.removeItem('currentUser')
          window.history.replaceState(null, '', window.location.pathname)
        }
      } catch (error) {
        console.error('[App.SSO] Error processing SSO callback:', error)
        toast.error('Erreur lors de la connexion SSO. Veuillez réessayer.', {
          duration: 5000,
          position: 'top-center',
        })
        localStorage.removeItem('currentUser')
        window.history.replaceState(null, '', window.location.pathname)
      }
    }

    handleSSGoogleCallback()
  }, [navigate])

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
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/faq" element={<FAQPage />} />
        </Routes>
      </Layout>
    </>
  )
}

export default App
