import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { API_ENDPOINTS } from '../config/api'

interface User {
  userId: string // email
  _id: string // MongoDB _id
  firstName?: string
  lastName?: string
}

interface AccountSettingsPageProps {
  currentUser: User | null
  onUserUpdate: (userId: string, _id: string, firstName?: string, lastName?: string) => void
}

const AccountSettingsPage: React.FC<AccountSettingsPageProps> = ({ currentUser, onUserUpdate }) => {
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState(currentUser?.firstName || '')
  const [lastName, setLastName] = useState(currentUser?.lastName || '')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!currentUser) {
      navigate('/') // Redirect to home if not logged in
      return
    }
    setFirstName(currentUser.firstName || '')
    setLastName(currentUser.lastName || '')
  }, [currentUser, navigate])

  if (!currentUser) {
    return null // Or a loading spinner, or redirect
  }

  const hasChanges =
    firstName !== (currentUser.firstName || '') ||
    lastName !== (currentUser.lastName || '')

  const isFormValid = firstName.trim() !== '' && lastName.trim() !== ''

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hasChanges || !isFormValid || isSaving) {
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(API_ENDPOINTS.UPDATE_USER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: currentUser.userId, // Changed userId to user_id
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      const result = await response.json()
      if (result.success) {
        onUserUpdate(currentUser.userId, currentUser._id, firstName.trim(), lastName.trim())
        toast.success('Vos informations ont été mises à jour avec succès. ✅')
      } else {
        throw new Error(result.message || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Erreur lors de la mise à jour du profil.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFirstName(currentUser.firstName || '')
    setLastName(currentUser.lastName || '')
  }

  const userInitial = currentUser.firstName ? currentUser.firstName.charAt(0).toUpperCase() : currentUser.userId.charAt(0).toUpperCase()

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Paramètres du Compte</h1>

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Informations Personnelles</h2>
        <div className="flex items-center mb-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 font-bold text-2xl mr-4">
            {userInitial}
          </div>
          <div>
            <p className="text-lg font-medium text-gray-900">{currentUser.firstName} {currentUser.lastName}</p>
            <p className="text-sm text-gray-500">{currentUser.userId}</p>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                Prénom
              </label>
              <input
                type="text"
                id="firstName"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Votre prénom"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Nom
              </label>
              <input
                type="text"
                id="lastName"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Votre nom"
              />
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              E-mail
            </label>
            <input
              type="email"
              id="email"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm cursor-not-allowed"
              value={currentUser.userId}
              readOnly
              disabled
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!hasChanges || !isFormValid || isSaving}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                !hasChanges || !isFormValid || isSaving
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isSaving ? 'Enregistrement...' : 'Enregistrer les Modifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AccountSettingsPage
