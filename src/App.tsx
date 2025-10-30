import React, { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import MyCardsPage from './pages/MyCardsPage'
import CreateCardPage from './pages/CreateCardPage'
import CardDetailPage from './pages/CardDetailPage'

interface User {
  userId: string // email
  _id: string // MongoDB _id
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

  const handleLoginSuccess = (userId: string, _id: string) => {
    const user = { userId, _id }
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
    <Layout currentUser={currentUser} onLoginSuccess={handleLoginSuccess} onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<HomePage currentUser={currentUser} />} />
        <Route path="/my-cards" element={<MyCardsPage currentUser={currentUser} onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/create-card" element={<CreateCardPage currentUser={currentUser} />} />
        <Route path="/card/:cardId" element={<CardDetailPage currentUser={currentUser} />} />
      </Routes>
    </Layout>
  )
}

export default App
