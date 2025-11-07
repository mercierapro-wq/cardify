import React, { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast' // Import Toaster
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import MyCardsPage from './pages/MyCardsPage'
import CreateCardPage from './pages/CreateCardPage'
import CardDetailPage from './pages/CardDetailPage'
import AccountSettingsPage from './pages/AccountSettingsPage' // Import AccountSettingsPage

interface User {
  userId: string // email
  _id: string // MongoDB _id
  firstName?: string // Added firstName
  lastName?: string // Added lastName
}

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser')
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser))
    }
  }, [])

  const handleUserUpdate = (userId: string, _id: string, firstName?: string, lastName?: string) => {
    const user = { userId, _id, firstName, lastName }
    setCurrentUser(user)
    localStorage.setItem('currentUser', JSON.stringify(user))
    // No navigation here, as update happens on settings page
  }

  const handleLoginSuccess = (userId: string, _id: string, firstName?: string, lastName?: string) => {
    const user = { userId, _id, firstName, lastName }
    setCurrentUser(user)
    localStorage.setItem('currentUser', JSON.stringify(user))
    navigate('/my-cards') // Navigate to /my-cards after successful login
  }

  const handleLogout = () => {
    setCurrentUser(null)
    localStorage.removeItem('currentUser')
    navigate('/') // Navigate to home page after logout
  }

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} /> {/* Add Toaster component */}
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
