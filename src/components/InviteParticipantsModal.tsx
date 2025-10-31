import React, { useState } from 'react'
import { X, Mail, Loader2 } from 'lucide-react'
import { API_ENDPOINTS } from '../config/api'

interface InviteParticipantsModalProps {
  isOpen: boolean
  onClose: () => void
  cardId: string
  onInvitationsSent: () => void
}

const InviteParticipantsModal: React.FC<InviteParticipantsModalProps> = ({ isOpen, onClose, cardId, onInvitationsSent }) => {
  const [emailsInput, setEmailsInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleInvite = async () => {
    setError(null)
    setSuccessMessage(null)
    if (!emailsInput.trim()) {
      setError("Veuillez entrer au moins une adresse e-mail.")
      return
    }

    const emails = emailsInput.split(/[\s,;]+/).map(email => email.trim()).filter(email => email !== '')
    if (emails.length === 0) {
      setError("Veuillez entrer au moins une adresse e-mail valide.")
      return
    }

    setIsSubmitting(true)

    try {
      const results = await Promise.all(emails.map(async (email) => {
        try {
          // First, ensure the user exists or create them
          let userResponse = await fetch(API_ENDPOINTS.INSERT_USER, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email }),
          })

          if (!userResponse.ok) {
            // If user already exists, the API might return a 409 or similar,
            // but we still want to proceed with linking.
            // For simplicity, we'll assume if it's not 2xx, it's an error unless it's a known "already exists" case.
            // A more robust API would return the existing user on conflict.
            // For now, we'll just log and try to link.
            console.warn(`User creation/check for ${email} failed or user exists. Proceeding to link.`, await userResponse.json());
          }

          // Then, link the user to the card as a contributor
          const linkResponse = await fetch(API_ENDPOINTS.INSERT_ULINK_CARD, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              card_id: cardId,
              user_id: email,
              role: 'contributor',
            }),
          })

          if (!linkResponse.ok) {
            const errorData = await linkResponse.json()
            throw new Error(errorData.message || `Erreur lors de l'invitation de ${email}.`)
          }
          return { email, status: 'success' }
        } catch (innerError) {
          console.error(`Failed to invite ${email}:`, innerError)
          return { email, status: 'error', message: (innerError as Error).message }
        }
      }))

      const successfulInvites = results.filter(r => r.status === 'success').length
      const failedInvites = results.filter(r => r.status === 'error')

      if (successfulInvites > 0) {
        setSuccessMessage(`${successfulInvites} invitation(s) envoyée(s) avec succès.`)
        onInvitationsSent() // Notify parent to refresh participants
        setEmailsInput('') // Clear input on success
      }
      if (failedInvites.length > 0) {
        setError(`Échec de l'envoi pour ${failedInvites.map(f => f.email).join(', ')}.`)
      }
      if (successfulInvites === 0 && failedInvites.length > 0) {
        setError("Aucune invitation n'a pu être envoyée.")
      }

    } catch (err) {
      console.error('Overall invitation process failed:', err)
      setError((err as Error).message || "Une erreur inattendue est survenue lors de l'envoi des invitations.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-auto relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Mail className="w-6 h-6 mr-2 text-indigo-600" />
            Inviter des Participants
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm" role="alert">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 text-sm" role="alert">
            {successMessage}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="emailsInput" className="block text-sm font-medium text-gray-700 mb-2">
            Adresses e-mail (séparées par des virgules ou retours à la ligne) :
          </label>
          <textarea
            id="emailsInput"
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 resize-y"
            rows={5}
            placeholder="email1@example.com, email2@example.com"
            value={emailsInput}
            onChange={(e) => setEmailsInput(e.target.value)}
            disabled={isSubmitting}
          ></textarea>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
            disabled={isSubmitting}
          >
            Annuler
          </button>
          <button
            onClick={handleInvite}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : null}
            Envoyer les Invitations
          </button>
        </div>
      </div>
    </div>
  )
}

export default InviteParticipantsModal
