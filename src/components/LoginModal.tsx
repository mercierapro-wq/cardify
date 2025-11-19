import React, { useState } from 'react'
import { X, Loader2, LogIn, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { API_ENDPOINTS } from '../config/api'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onLoginSuccess: (userId: string, _id: string, firstName?: string, lastName?: string) => void
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isLoginView, setIsLoginView] = useState(true) // true for login, false for register
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setFirstName('')
    setLastName('')
    setError(null)
    setLoading(false)
    setShowPassword(false)
  }

  const handleClose = () => {
    resetForm()
    setIsLoginView(true) // Reset to login view on close
    onClose()
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  // Password strength criteria
  const passwordCriteria = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasDigit: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*?_.]/.test(password),
  }

  const allPasswordCriteriaMet = Object.values(passwordCriteria).every(Boolean)
  const passwordsMatch = password === confirmPassword && password.length > 0

  const isRegisterButtonDisabled =
    !allPasswordCriteriaMet || !passwordsMatch || !firstName || !lastName || !email || loading

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
        handleClose()
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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError('Veuillez remplir tous les champs.')
      setLoading(false)
      return
    }

    if (!allPasswordCriteriaMet) {
      setError('Le mot de passe ne respecte pas tous les critères de sécurité.')
      setLoading(false)
      return
    }

    if (!passwordsMatch) {
      setError('Les mots de passe ne correspondent pas.')
      setLoading(false)
      return
    }

    try {
      // Placeholder for registration API call
      // In a real app, you would send this data to your registration endpoint
      const response = await fetch('/api/register', { // Replace with actual registration endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ firstName, lastName, email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erreur lors de l\'inscription.')
      }

      const data = await response.json()
      // Assuming registration success also logs the user in or provides necessary info
      onLoginSuccess(data.user_id, data._id, data.firstName, data.lastName) // Adjust based on actual API response
      handleClose()
    } catch (err: any) {
      console.error('Registration error:', err)
      setError(err.message || 'Erreur Serveur. Veuillez réessayer plus tard.')
    } finally {
      setLoading(false)
    }
  }

  // Placeholder for Google SSO login
  const handleGoogleLogin = () => {
    setError(null)
    setLoading(true)
    console.log('Initiating Google SSO login...')
    setTimeout(() => {
      setLoading(false)
      setError('La connexion Google n\'est pas encore implémentée.')
    }, 1500)
  }

  if (!isOpen) return null

  const modalTitle = isLoginView ? 'Bon retour parmi nous !' : 'Créez votre compte Cardify'

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">{modalTitle}</h2>
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

        {isLoginView ? (
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
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 pr-10"
                    maxLength={60}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
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
            </form>
            <div className="mt-6 text-center text-gray-600">
              Pas encore de compte ?{' '}
              <button
                onClick={() => { setIsLoginView(false); resetForm(); }}
                className="text-indigo-600 hover:text-indigo-800 font-medium focus:outline-none"
              >
                Créer un compte
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  Prénom
                </label>
                <input
                  type="text"
                  id="firstName"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                  maxLength={60}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Nom
                </label>
                <input
                  type="text"
                  id="lastName"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                  maxLength={60}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Adresse E-mail
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
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 pr-10"
                  maxLength={60}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="mt-2 text-sm text-gray-600 space-y-1">
                <p className={`flex items-center ${passwordCriteria.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                  <CheckCircle className={`h-4 w-4 mr-2 ${passwordCriteria.minLength ? 'text-green-500' : 'text-gray-400'}`} />
                  Au moins 8 caractères
                </p>
                <p className={`flex items-center ${passwordCriteria.hasUpperCase ? 'text-green-600' : 'text-gray-500'}`}>
                  <CheckCircle className={`h-4 w-4 mr-2 ${passwordCriteria.hasUpperCase ? 'text-green-500' : 'text-gray-400'}`} />
                  Une lettre majuscule
                </p>
                <p className={`flex items-center ${passwordCriteria.hasDigit ? 'text-green-600' : 'text-gray-500'}`}>
                  <CheckCircle className={`h-4 w-4 mr-2 ${passwordCriteria.hasDigit ? 'text-green-500' : 'text-gray-400'}`} />
                  Un chiffre
                </p>
                <p className={`flex items-center ${passwordCriteria.hasSpecialChar ? 'text-green-600' : 'text-gray-500'}`}>
                  <CheckCircle className={`h-4 w-4 mr-2 ${passwordCriteria.hasSpecialChar ? 'text-green-500' : 'text-gray-400'}`} />
                  Un caractère spécial (@$!%*?&_.)
                </p>
              </div>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmer le mot de Passe
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm p-2 ${
                  confirmPassword.length > 0 && !passwordsMatch
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
                maxLength={60}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="mt-1 text-sm text-red-600">Les mots de passe ne correspondent pas.</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isRegisterButtonDisabled}
            >
              {loading ? (
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
              ) : (
                <LogIn className="h-5 w-5 mr-2" />
              )}
              S'inscrire
            </button>
            <div className="mt-6 text-center text-gray-600">
              Déjà membre ?{' '}
              <button
                onClick={() => { setIsLoginView(true); resetForm(); }}
                className="text-indigo-600 hover:text-indigo-800 font-medium focus:outline-none"
              >
                Se connecter
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default LoginModal
