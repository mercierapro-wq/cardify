import React, { useState } from 'react'
import { X, Loader2, LogIn, UserPlus } from 'lucide-react' // Import UserPlus for create account icon
import { API_ENDPOINTS } from '../config/api'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onLoginSuccess: (userId: string, _id: string) => void
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('') // New state for confirm password
  const [firstName, setFirstName] = useState('') // New state for first name
  const [lastName, setLastName] = useState('') // New state for last name
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCreatingAccount, setIsCreatingAccount] = useState(false) // State to switch between login/create account

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setFirstName('') // Reset first name
    setLastName('') // Reset last name
    setError(null)
    setLoading(false)
  }

  const handleClose = () => {
    resetForm()
    setIsCreatingAccount(false) // Reset to login view on close
    onClose()
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!email || !password) {
      setError('Veuillez remplir tous les champs.')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(API_ENDPOINTS.GET_USER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: email, password: password }),
      })

      if (!response.ok) {
        throw new Error('Erreur réseau ou serveur.')
      }

      const data = await response.json()

      if (data.result === true) {
        onLoginSuccess(data.user_id, data._id)
        handleClose() // Close modal on success
      } else if (data.result === false) {
        setError('Adresse Mail ou Mot de Passe incorrect.')
      } else {
        setError('Erreur Serveur: Réponse inattendue.')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Erreur Serveur. Veuillez réessayer plus tard.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!email || !password || !confirmPassword || !firstName || !lastName) {
      setError('Veuillez remplir tous les champs.')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(API_ENDPOINTS.INSERT_USER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: email, password: password, firstName: firstName, lastName: lastName }),
      })

      if (!response.ok) {
        throw new Error('Erreur réseau ou serveur.')
      }

      const data = await response.json()

      if (data.result === 'true') {
        // Assuming _id is returned on successful creation, if not, we might need another call or a default
        // For now, we'll use a placeholder if _id is not directly returned by InsertUser
        onLoginSuccess(email, data._id || 'new_user_id_placeholder') // Store user_id and a placeholder _id
        handleClose() // Close modal on success
      } else if (data.result === 'KO' && data.cause === 'email already exists') {
        setError('Cette adresse mail est déjà utilisée. Veuillez vous connecter ou utiliser une autre adresse.')
      } else {
        setError('Erreur Serveur: Réponse inattendue lors de la création de compte.')
      }
    } catch (err) {
      console.error('Create account error:', err)
      setError('Erreur Serveur. Veuillez réessayer plus tard.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            {isCreatingAccount ? (
              <UserPlus className="w-6 h-6 mr-2 text-indigo-600" />
            ) : (
              <LogIn className="w-6 h-6 mr-2 text-indigo-600" />
            )}
            {isCreatingAccount ? 'Créer un compte' : 'Connexion'}
          </h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={isCreatingAccount ? handleCreateAccountSubmit : handleLoginSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm" role="alert">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Adresse Mail
            </label>
            <input
              type="email"
              id="email"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
              maxLength={60}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {isCreatingAccount && (
            <>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Nom
                </label>
                <input
                  type="text"
                  id="lastName"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                  maxLength={30}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  Prénom
                </label>
                <input
                  type="text"
                  id="firstName"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                  maxLength={30}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
            </>
          )}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Mot de Passe
            </label>
            <input
              type="password"
              id="password"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
              maxLength={60}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {isCreatingAccount && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Répéter votre mot de passe
              </label>
              <input
                type="password"
                id="confirmPassword"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                maxLength={60}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
            ) : isCreatingAccount ? (
              <UserPlus className="h-5 w-5 mr-2" />
            ) : (
              <LogIn className="h-5 w-5 mr-2" />
            )}
            {isCreatingAccount ? 'Confirmer' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-4 text-center">
          {isCreatingAccount ? (
            <button
              onClick={() => { setIsCreatingAccount(false); resetForm(); }}
              className="text-sm text-gray-600 hover:text-indigo-600 focus:outline-none"
            >
              Annuler
            </button>
          ) : (
            <button
              onClick={() => { setIsCreatingAccount(true); resetForm(); }}
              className="text-sm text-indigo-600 hover:text-indigo-800 focus:outline-none"
            >
              Pas encore de compte ? Créer un compte
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default LoginModal
