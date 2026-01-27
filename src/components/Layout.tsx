import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Home, Gift, PlusCircle, LogIn } from 'lucide-react'
import LoginModal from './LoginModal'
import UserMenu from './UserMenu' // Import the new UserMenu component
import CookieBanner from './CookieBanner'
import Footer from './Footer'

interface User {
  userId: string
  _id: string
  firstName?: string // Added firstName
  lastName?: string // Added lastName
}

interface LayoutProps {
  children: React.ReactNode
  currentUser: User | null
  onLoginSuccess: (userId: string, _id: string, firstName?: string, lastName?: string) => void
  onLogout: () => void
}

const Layout: React.FC<LayoutProps> = ({ children, currentUser, onLoginSuccess, onLogout }) => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  const openLoginModal = () => setIsLoginModalOpen(true)
  const closeLoginModal = () => setIsLoginModalOpen(false)

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex-grow flex flex-col">
        <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-indigo-600 mr-8">
              Cardify
            </Link>
            <nav className="hidden md:block">
              <ul className="flex space-x-6">
                <li>
                  <Link to="/" className="text-gray-600 hover:text-indigo-600 flex items-center">
                    <Home className="w-5 h-5 mr-1" /> Accueil
                  </Link>
                </li>
                <li>
                  <Link to="/my-cards" className="text-gray-600 hover:text-indigo-600 flex items-center">
                    <Gift className="w-5 h-5 mr-1" /> Mes Cartes
                  </Link>
                </li>
                {currentUser && ( // Only show "Créer une carte" if logged in
                  <li>
                    <Link to="/create-card" className="text-gray-600 hover:text-indigo-600 flex items-center">
                      <PlusCircle className="w-5 h-5 mr-1" /> Créer une carte
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <UserMenu currentUser={currentUser} onLogout={onLogout} /> // Use the new UserMenu component
            ) : (
              <button
                onClick={openLoginModal}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <LogIn className="w-5 h-5 mr-2" /> Connexion
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 flex-grow">
        {children}
      </main>
    </div>

    <Footer />

      <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} onLoginSuccess={onLoginSuccess} />
      <CookieBanner />
    </div>
  )
}

export default Layout
