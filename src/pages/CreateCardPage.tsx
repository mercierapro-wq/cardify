import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Image, Mail, MessageSquareText, Save, XCircle, DollarSign, UserPlus } from 'lucide-react' // Added UserPlus icon
import { API_ENDPOINTS } from '../config/api'

interface User {
  userId: string
  _id: string
}

interface CreateCardPageProps {
  currentUser: User | null
}

const CreateCardPage: React.FC<CreateCardPageProps> = ({ currentUser }) => {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [sharedToEmails, setSharedToEmails] = useState('')
  const [beneficiaryEmail, setBeneficiaryEmail] = useState('') // New state for beneficiary
  const [moneyPotLink, setMoneyPotLink] = useState('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate('/my-cards') // Redirect to my-cards which will prompt login
    }
  }, [currentUser, navigate])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMessage(null)
    setErrorMessage(null)

    if (!currentUser) {
      setErrorMessage('Vous devez être connecté pour créer une carte.')
      return
    }

    if (!title.trim()) {
      setErrorMessage('Le titre de la carte ne peut pas être vide.')
      return
    }

    const now = new Date().toISOString()

    const allParticipantsEmails = new Set<string>()
    allParticipantsEmails.add(currentUser.userId) // Creator is always admin

    // Add shared emails
    sharedToEmails
      .split(',')
      .map((email) => email.trim())
      .filter(Boolean)
      .forEach((email) => allParticipantsEmails.add(email))

    // Add beneficiary email if provided and different from creator
    if (beneficiaryEmail.trim() && beneficiaryEmail.trim() !== currentUser.userId) {
      allParticipantsEmails.add(beneficiaryEmail.trim())
    } else if (beneficiaryEmail.trim() === currentUser.userId) {
      setErrorMessage('Le bénéficiaire ne peut pas être le créateur de la carte.')
      return
    }

    const cardData = {
      title: title.trim(),
      description: description.trim(),
      cover: coverImageUrl.trim(),
      messages: '', // This field is not used for actual messages, kept for schema compatibility
      // shareAt: Array.from(allParticipantsEmails).join(','), // REMOVED: No longer used
      createdBy: currentUser.userId, // Use logged-in user's email
      updatedAt: now,
      createdAt: now,
      moneyPotLink: moneyPotLink.trim(),
      status: 'draft', // New: Initialize card status as 'draft'
    }

    try {
      // 1. Insert the card
      const cardResponse = await fetch(API_ENDPOINTS.INSERT_CARD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cardData),
      })

      if (!cardResponse.ok) {
        const errorData = await cardResponse.json()
        throw new Error(errorData.message || "Erreur lors de l'enregistrement de la carte.")
      }

      const cardResult = await cardResponse.json()
      const cardId = cardResult.card_id // Correctly retrieve card_id from the API response

      if (!cardId) {
        throw new Error("Impossible de récupérer l'ID de la carte après la création.")
      }

      // 2. Link users to the card with appropriate roles
      const linkingPromises = Array.from(allParticipantsEmails).map(async (email) => {
        let role: 'admin' | 'contributor' | 'beneficiary'
        if (email === currentUser.userId) {
          role = 'admin'
        } else if (email === beneficiaryEmail.trim()) {
          role = 'beneficiary'
        } else {
          role = 'contributor'
        }

        const ulinkCardData = {
          user_id: email,
          card_id: cardId,
          role: role,
          updatedAt: now,
          createdAt: now,
        }

        const ulinkResponse = await fetch(API_ENDPOINTS.INSERT_ULINK_CARD, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(ulinkCardData),
        })

        if (!ulinkResponse.ok) {
          const errorData = await ulinkResponse.json()
          console.error(`Erreur lors de la liaison de l'utilisateur ${email} à la carte:`, errorData)
          // Don't throw here to allow other links to proceed, but log the error
          return { success: false, email, error: errorData.message || 'Erreur inconnue' }
        }
        return { success: true, email }
      })

      const linkingResults = await Promise.all(linkingPromises)

      const failedLinks = linkingResults.filter(result => !result.success)
      if (failedLinks.length > 0) {
        setErrorMessage(`Carte créée, mais des erreurs sont survenues lors de la liaison de certains participants: ${failedLinks.map(f => f.email).join(', ')}.`)
      } else {
        setSuccessMessage('Votre Carte a été enregistrée avec succès et les participants ont été liés !')
      }
      
      setTimeout(() => {
        navigate('/my-cards')
      }, 2000)
    } catch (error) {
      console.error("Erreur lors de l'enregistrement ou de la liaison de la carte:", error)
      setErrorMessage((error as Error).message || 'Une erreur inattendue est survenue.')
    }
  }

  const handleCancel = () => {
    navigate('/my-cards')
  }

  const isSaveButtonDisabled = !title.trim() || !currentUser // Disable if not logged in

  if (!currentUser) {
    // Optionally render a loading state or a message while redirecting
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg text-gray-700">Redirection vers la page de connexion...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-200">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Créer une nouvelle carte</h1>

      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Titre de la carte <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Ex: Joyeux Anniversaire Sophie !"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Ajoutez une petite description pour la carte..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>

        <div>
          <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700 mb-1">
            Image de couverture (URL)
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
              <Image className="w-5 h-5" />
            </span>
            <input
              type="url"
              id="coverImage"
              className="flex-1 block w-full px-4 py-2 border border-gray-300 rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Ex: https://images.unsplash.com/photo-..."
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
            />
          </div>
          {coverImageUrl && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Aperçu de l'image de couverture:</p>
              <img src={coverImageUrl} alt="Aperçu de la couverture" className="max-h-48 w-auto rounded-md shadow-md object-cover" />
            </div>
          )}
        </div>

        <div>
          <label htmlFor="moneyPotLink" className="block text-sm font-medium text-gray-700 mb-1">
            Lien de la cagnotte (URL)
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
              <DollarSign className="w-5 h-5" />
            </span>
            <input
              type="url"
              id="moneyPotLink"
              className="flex-1 block w-full px-4 py-2 border border-gray-300 rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Ex: https://www.leetchi.com/c/mon-anniversaire"
              value={moneyPotLink}
              onChange={(e) => setMoneyPotLink(e.target.value)}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">Lien vers une cagnotte en ligne (facultatif).</p>
        </div>

        <div>
          <label htmlFor="beneficiaryEmail" className="block text-sm font-medium text-gray-700 mb-1">
            Email du Bénéficiaire (facultatif)
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
              <UserPlus className="w-5 h-5" />
            </span>
            <input
              type="email"
              id="beneficiaryEmail"
              className="flex-1 block w-full px-4 py-2 border border-gray-300 rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="beneficiaire@example.com"
              value={beneficiaryEmail}
              onChange={(e) => setBeneficiaryEmail(e.target.value)}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">L'email de la personne qui recevra la carte. Elle ne pourra la voir qu'une fois envoyée par l'admin.</p>
        </div>

        <div>
          <label htmlFor="sharedTo" className="block text-sm font-medium text-gray-700 mb-1">
            Partagé à (adresses email séparées par des virgules, facultatif)
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
              <Mail className="w-5 h-5" />
            </span>
            <textarea
              id="sharedTo"
              rows={2}
              className="flex-1 block w-full px-4 py-2 border border-gray-300 rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="email1@example.com, email2@example.com"
              value={sharedToEmails}
              onChange={(e) => setSharedToEmails(e.target.value)}
            ></textarea>
          </div>
          <p className="mt-2 text-xs text-gray-500">Séparez les adresses email par des virgules. Ces personnes pourront contribuer à la carte.</p>
        </div>

        <div>
          <label htmlFor="messages" className="block text-sm font-medium text-gray-700 mb-1">
            Messages (à venir plus tard)
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
              <MessageSquareText className="w-5 h-5" />
            </span>
            <input
              type="text"
              id="messages"
              className="flex-1 block w-full px-4 py-2 border border-gray-300 rounded-r-md bg-gray-50 text-gray-500 sm:text-sm cursor-not-allowed"
              value="Fonctionnalité à implémenter"
              disabled
            />
          </div>
        </div>

        <div>
          <label htmlFor="createdBy" className="block text-sm font-medium text-gray-700 mb-1">
            Créée par
          </label>
          <input
            type="email"
            id="createdBy"
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-600 sm:text-sm cursor-not-allowed"
            value={currentUser?.userId || ''} // Display current user's email
            disabled
          />
        </div>

        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Erreur:</strong>
            <span className="block sm:inline"> {errorMessage}</span>
          </div>
        )}

        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            <XCircle className="w-5 h-5 mr-2" />
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSaveButtonDisabled}
            className={`inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-sm font-medium rounded-md text-white transition-colors duration-200 ${
              isSaveButtonDisabled
                ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            }`}
          >
            <Save className="w-5 h-5 mr-2" />
            Enregistrer la carte
          </button>
        </div>

        {successMessage && (
          <div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative text-center" role="alert">
            <span className="block sm:inline">{successMessage}</span>
          </div>
        )}
      </form>
    </div>
  )
}

export default CreateCardPage
