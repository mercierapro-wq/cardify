import React, { useState, useEffect } from 'react'
import { X, Mail, Loader2, Link as LinkIcon, Check, Users } from 'lucide-react'
import { API_ENDPOINTS } from '../config/api'
import ParticipantList from './ParticipantList' // Reusing the existing ParticipantList

interface User {
  userId: string
  _id: string
  firstName?: string
  lastName?: string
}

interface UlinkCardProps {
  _id: string
  user_id: string
  card_id: string
  role: 'admin' | 'contributor' | 'beneficiary'
  updatedAt: string
  createdAt: string
  firstName?: string
  lastName?: string
}

interface ManageParticipantsModalProps {
  isOpen: boolean
  onClose: () => void
  cardId: string
  cardTitle: string // Added cardTitle
  cardDescription: string // Added cardDescription
  currentUser: User | null
  isAdmin: boolean
  participants: UlinkCardProps[]
  onParticipantsUpdated: () => void // Callback to refresh participants in parent
  onDeleteParticipant: (ulinkCardId: string, participantEmail: string) => void
}

const ManageParticipantsModal: React.FC<ManageParticipantsModalProps> = ({
  isOpen,
  onClose,
  cardId,
  cardTitle, // Destructure cardTitle
  cardDescription, // Destructure cardDescription
  currentUser,
  isAdmin,
  participants,
  onParticipantsUpdated,
  onDeleteParticipant,
}) => {
  const [emailsInput, setEmailsInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState<string | null>(null)

  const cardLink = `${window.location.origin}/card/${cardId}`

  useEffect(() => {
    if (!isOpen) {
      // Reset states when modal closes
      setEmailsInput('')
      setError(null)
      setSuccessMessage(null)
      setCopySuccess(null)
    }
  }, [isOpen])

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
    const existingParticipantEmails = new Set(participants.map(p => p.user_id));

    const results = await Promise.all(emails.map(async (email) => {
      // RG 1: Check if participant is already present
      if (existingParticipantEmails.has(email)) {
        return { email, status: 'skipped', message: 'Ce participant est déjà dans la liste' };
      }

      try {
        // 1. Insert/Check User
        let userResponse = await fetch(API_ENDPOINTS.INSERT_USER, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email }),
        })

        if (!userResponse.ok) {
          console.warn(`User creation/check for ${email} failed or user exists. Proceeding to link.`, await userResponse.json());
        }

        // 2. Link User to Card
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

        // 3. RG 2: Send email notification
        const emailResponse = await fetch(API_ENDPOINTS.SEND_EMAIL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            send_to: email,
            send_content: `Vous êtes invités à participer à la carte : ${cardDescription}`,
            send_subject: `[CARDIFY] Vous êtes invités à participer à la carte : ${cardTitle}`,
            card_link: cardLink,
          }),
        });

        if (!emailResponse.ok) {
          const emailErrorData = await emailResponse.json();
          console.warn(`Failed to send email to ${email}:`, emailErrorData);
          // Don't throw error here, just log and continue, as linking was successful
          return { email, status: 'success_no_email', message: 'Participant ajouté, mais échec de l\'envoi de l\'e-mail.' };
        }

        const emailResult = await emailResponse.json();
        if (emailResult && emailResult.labelIds && emailResult.labelIds.includes('SENT')) {
          return { email, status: 'success' };
        } else {
          console.warn(`Email to ${email} not marked as SENT:`, emailResult);
          return { email, status: 'success_no_email', message: 'Participant ajouté, mais e-mail non confirmé.' };
        }

      } catch (innerError) {
        console.error(`Failed to invite ${email}:`, innerError)
        return { email, status: 'error', message: (innerError as Error).message }
      }
    }))

    const successfulInvites = results.filter(r => r.status === 'success').length
    const successfulInvitesNoEmail = results.filter(r => r.status === 'success_no_email').length
    const failedInvites = results.filter(r => r.status === 'error')
    const skippedInvites = results.filter(r => r.status === 'skipped')

    let finalSuccessMessages: string[] = [];
    let finalErrorMessages: string[] = [];

    if (successfulInvites > 0) {
      finalSuccessMessages.push(`${successfulInvites} invitation(s) envoyée(s) avec succès (lien et e-mail).`);
      onParticipantsUpdated(); // Notify parent to refresh participant list
      setEmailsInput('');
    }
    if (successfulInvitesNoEmail > 0) {
      finalSuccessMessages.push(`${successfulInvitesNoEmail} participant(s) ajouté(s), mais l'e-mail n'a pas pu être envoyé.`);
      onParticipantsUpdated(); // Notify parent to refresh participant list
      setEmailsInput('');
    }
    if (skippedInvites.length > 0) {
      // Updated message as per user request
      finalErrorMessages.push("Ce participant est déjà dans la liste.");
    }
    if (failedInvites.length > 0) {
      finalErrorMessages.push(`Échec de l'envoi pour ${failedInvites.map(f => f.email).join(', ')}. Raisons: ${failedInvites.map(f => f.message).join('; ')}`);
    }

    if (finalSuccessMessages.length > 0) {
      setSuccessMessage(finalSuccessMessages.join(' '));
    }
    if (finalErrorMessages.length > 0) {
      setError(finalErrorMessages.join(' '));
    }
    if (successfulInvites === 0 && successfulInvitesNoEmail === 0 && failedInvites.length > 0 && skippedInvites.length === 0) {
      setError("Aucune invitation n'a pu être envoyée.");
    }


    setIsSubmitting(false)
  }

  const handleCopyLink = async () => {
    setCopySuccess(null) // Clear previous messages
    try {
      await navigator.clipboard.writeText(cardLink)
      setCopySuccess('Lien copié !')
    } catch (err) {
      console.error('Failed to copy link using navigator.clipboard:', err)
      try {
        const textarea = document.createElement('textarea')
        textarea.value = cardLink
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        setCopySuccess('Lien copié ! (via fallback)')
      } catch (fallbackErr) {
        console.error('Failed to copy link using document.execCommand:', fallbackErr)
        setCopySuccess('Échec de la copie.')
      }
    } finally {
      setTimeout(() => setCopySuccess(null), 2000)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-auto relative max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Users className="w-6 h-6 mr-2 text-indigo-600" />
            Gestion des Participants
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

        {/* Section for copying card link */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <label htmlFor="cardLink" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <LinkIcon className="w-4 h-4 mr-1 text-gray-500" />
            Lien direct vers la carte :
          </label>
          <div className="flex items-center space-x-2">
            <input
              id="cardLink"
              type="text"
              readOnly
              value={cardLink}
              className="flex-grow p-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm truncate"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              onClick={handleCopyLink}
              className="px-3 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-200 flex items-center text-sm"
            >
              {copySuccess && copySuccess.includes('Lien copié') ? <Check className="w-4 h-4 mr-1" /> : <LinkIcon className="w-4 h-4 mr-1" />}
              {copySuccess || 'Copier'}
            </button>
          </div>
          {copySuccess && (
            <p className={`mt-2 text-sm ${copySuccess.includes('Échec') ? 'text-red-500' : 'text-green-600'}`}>
              {copySuccess}
            </p>
          )}
        </div>

        {/* Partie Supérieure: Ajout d'Invités */}
        {isAdmin && ( // Only admin can invite
          <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center">
              <Mail className="w-5 h-5 mr-2" /> Inviter de nouveaux participants
            </h3>
            <div className="mb-4">
              <label htmlFor="emailsInput" className="block text-sm font-medium text-gray-700 mb-2">
                Adresses e-mail (séparées par des virgules ou retours à la ligne) :
              </label>
              <textarea
                id="emailsInput"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 resize-y"
                rows={4}
                placeholder="email1@example.com, email2@example.com"
                value={emailsInput}
                onChange={(e) => setEmailsInput(e.target.value)}
                disabled={isSubmitting}
              ></textarea>
            </div>
            <div className="flex justify-end">
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
        )}

        {/* Partie Inférieure: Liste et Gestion des Participants */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" /> Liste et Gestion des Participants
          </h3>
          <ParticipantList
            participants={participants.filter(p => p.role !== 'removed')}
            currentUserEmail={currentUser?.userId}
            isAdmin={isAdmin}
            onDeleteParticipant={onDeleteParticipant}
          />
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

export default ManageParticipantsModal
