import React, { useState } from 'react'
import { X, Loader2, LogIn } from 'lucide-react' // Removed UserPlus
import { API_ENDPOINTS } from '../config/api'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onLoginSuccess: (userId: string, _id: string, firstName?: string, lastName?: string) => void
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showEmailLoginForm, setShowEmailLoginForm] = useState(false) // State to show/hide email form

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setError(null)
    setLoading(false)
  }

  const handleClose = () => {
    resetForm()
    setShowEmailLoginForm(false) // Reset to initial view on close
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
        onLoginSuccess(data.user_id, data._id, data.firstName, data.lastName)
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

  // Placeholder for Google SSO login
  const handleGoogleLogin = () => {
    setError(null)
    setLoading(true)
    // In a real application, this would redirect to Google's OAuth endpoint
    console.log('Initiating Google SSO login...')
    // Simulate a delay and then an error or success
    setTimeout(() => {
      setLoading(false)
      setError('La connexion Google n\'est pas encore implémentée.')
      // For a real implementation, you'd handle the OAuth flow here.
      // On success: onLoginSuccess(googleUserId, google_id, firstName, lastName); handleClose();
    }, 1500)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-auto"> {/* max-w-md is approx 448px, close to 400px */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Connectez-vous à Cardify</h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-7 h-7" />
          </button>
        </div>

        <p className="text-gray-600 text-lg mb-8">Accédez à toutes vos cartes de vœux collaboratives.</p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm mb-4" role="alert">
            {error}
          </div>
        )}

        {!showEmailLoginForm ? (
          <>
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="animate-spin h-5 w-5 mr-3" />
              ) : (
                <img src="https://www.svgrepo.com/show/355037/google.svg" alt="Google logo" className="h-5 w-5 mr-3" />
              )}
              Continuer avec Google
            </button>

            <div className="relative flex items-center justify-center my-6">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink mx-4 text-gray-500 text-sm">ou</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <button
              onClick={() => { setShowEmailLoginForm(true); resetForm(); }}
              className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <LogIn className="h-5 w-5 mr-2 text-gray-600" />
              Continuer avec l'E-mail
            </button>
          </>
        ) : (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
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
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
              ) : (
                <LogIn className="h-5 w-5 mr-2" />
              )}
              Se connecter
            </button>
            <div className="mt-4 text-center">
              <button
                onClick={() => { setShowEmailLoginForm(false); resetForm(); }}
                className="text-sm text-gray-600 hover:text-indigo-600 focus:outline-none"
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default LoginModal
