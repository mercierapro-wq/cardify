import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Image, Mail, Save, XCircle, DollarSign, UserPlus, Sparkles, Upload } from 'lucide-react'
import { API_ENDPOINTS } from '../config/api'
import AIMessageModal from '../components/AIMessageModal' // Import AIMessageModal
import { authFetch } from '../utils/authFetch' // ✅ IMPORT ADDED

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
  const [selectedCoverImageFile, setSelectedCoverImageFile] = useState<File | null>(null) // For uploaded image
  const [generatedCoverImageBase64, setGeneratedCoverImageBase64] = useState<string | null>(null) // For AI generated image
  const [sharedToEmails, setSharedToEmails] = useState('')
  const [beneficiaryEmail, setBeneficiaryEmail] = useState('')
  const [moneyPotLink, setMoneyPotLink] = useState('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isAIMessageModalOpen, setIsAIMessageModalOpen] = useState(false) // State for AI modal
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for file input

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate('/my-cards') // Redirect to my-cards which will prompt login
    }
  }, [currentUser, navigate])

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMessage(null)
    setErrorMessage(null)

    if (!currentUser) {
      setErrorMessage('Vous devez être connecté pour créer une carte.')
      return
    }

    // --- Validation ---
    if (!title.trim()) {
      setErrorMessage('Le titre de la carte ne peut pas être vide.')
      return
    }
    if (title.trim().length > 100) { // Updated max length
      setErrorMessage('Le titre de la carte ne peut pas dépasser 100 caractères.')
      return
    }

    if (!description.trim()) {
      setErrorMessage('La description de la carte ne peut pas être vide.')
      return
    }
    if (description.trim().length > 1000) { // Updated max length
      setErrorMessage('La description de la carte ne peut pas dépasser 1000 caractères.')
      return
    }

    let coverImageBase64: string | null = null
    if (generatedCoverImageBase64) {
      coverImageBase64 = generatedCoverImageBase64
    } else if (selectedCoverImageFile) {
      if (selectedCoverImageFile.size > 2 * 1024 * 1024) { // 2MB limit
        setErrorMessage('L\'image de couverture ne doit pas dépasser 2 Mo.')
        return
      }
      try {
        coverImageBase64 = await convertFileToBase64(selectedCoverImageFile)
      } catch (error) {
        setErrorMessage('Erreur lors de la conversion de l\'image de couverture.')
        console.error('Image conversion error:', error)
        return
      }
    } else {
      setErrorMessage('Veuillez sélectionner ou générer une image de couverture.')
      return
    }

    if (beneficiaryEmail.trim() && beneficiaryEmail.trim() === currentUser.userId) {
      setErrorMessage('Le bénéficiaire ne peut pas être le créateur de la carte.')
      return
    }
    // --- End Validation ---

    const now = new Date().toISOString()

    const allParticipantsEmails = new Set<string>()
    allParticipantsEmails.add(currentUser.userId) // Creator is always admin

    // Add shared emails
    sharedToEmails
      .split(',')
      .map((email) => email.trim())
      .filter(Boolean)
      .forEach((email) => allParticipantsEmails.add(email))

    // Add beneficiary email if provided
    if (beneficiaryEmail.trim()) {
      allParticipantsEmails.add(beneficiaryEmail.trim())
    }

    const cardData = {
      title: title.trim(),
      description: description.trim(),
      cover: coverImageBase64, // Use base64 image
      messages: '', // This field is not part of the form anymore, but still sent to backend
      createdBy: currentUser.userId, // This field is not part of the form anymore, but still sent to backend
      updatedAt: now,
      createdAt: now,
      moneyPotLink: moneyPotLink.trim(),
      status: 'draft',
    }

    try {
      // 1. Insert the card
      const cardResponse = await authFetch(API_ENDPOINTS.INSERT_CARD, {
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
      const cardId = cardResult.card_id

      if (!cardId) {
        throw new Error("Impossible de récupérer l'ID de la carte après la création.")
      }

      // 2. Link users to the card with appropriate roles and send emails
      const linkingResults = await Promise.all(Array.from(allParticipantsEmails).map(async (email) => {
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

        try {
          const ulinkResponse = await authFetch(API_ENDPOINTS.INSERT_ULINK_CARD, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(ulinkCardData),
          })

          if (!ulinkResponse.ok) {
            const errorData = await ulinkResponse.json()
            console.error(`Erreur lors de la liaison de l'utilisateur ${email} à la carte:`, errorData)
            return { success: false, email, error: errorData.message || 'Erreur inconnue' }
          }

          // Send email notification to contributors (not to admin creator or beneficiary)
          if (email !== currentUser.userId && email !== beneficiaryEmail.trim()) {
            const cardLink = `${window.location.origin}/card/${cardId}`;
            const emailResponse = await authFetch(API_ENDPOINTS.SEND_EMAIL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                send_to: email,
                send_content: `Vous êtes invités à participer à la carte : ${description.trim()}`,
                send_subject: `[CARDIFY] Vous êtes invités à participer à la carte : ${title.trim()}`,
                card_link: cardLink,
              }),
            });

            if (!emailResponse.ok) {
              const emailErrorData = await emailResponse.json();
              console.warn(`Failed to send email to ${email}:`, emailErrorData);
              return { success: true, email, message: 'Participant ajouté, mais échec de l\'envoi de l\'e-mail.' };
            }
            const emailResult = await emailResponse.json();
            if (emailResult && emailResult.labelIds && emailResult.labelIds.includes('SENT')) {
              return { success: true, email };
            } else {
              console.warn(`Email to ${email} not marked as SENT:`, emailResult);
              return { success: true, email, message: 'Participant ajouté, mais e-mail non confirmé.' };
            }
          }
          return { success: true, email } // Creator or no email needed
        } catch (innerError) {
          console.error(`Failed to link or send email to ${email}:`, innerError)
          return { success: false, email, error: (innerError as Error).message || 'Erreur inconnue' }
        }
      }))

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

  const handleInsertAIImage = (type: 'image', content: string) => {
    if (type === 'image') {
      setGeneratedCoverImageBase64(content)
      setSelectedCoverImageFile(null) // Clear manual selection if AI image is used
    }
    setIsAIMessageModalOpen(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    setSelectedCoverImageFile(file);
    setGeneratedCoverImageBase64(null); // Clear AI generated image if user selects a file
  };

  const displayCoverImage = generatedCoverImageBase64 || (selectedCoverImageFile && URL.createObjectURL(selectedCoverImageFile));

  const isSaveButtonDisabled = !title.trim() || !description.trim() || (!selectedCoverImageFile && !generatedCoverImageBase64) || !currentUser

  if (!currentUser) {
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
            maxLength={100} // Updated max length
            required
          />
          <p className="mt-1 text-xs text-gray-500 text-right">{title.length}/100 caractères</p>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            rows={3}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Ajoutez une petite description pour la carte..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000} // Updated max length
            required
          ></textarea>
          <p className="mt-1 text-xs text-gray-500 text-right">{description.length}/1000 caractères</p>
        </div>

        <div>
          <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700 mb-1">
            Image de couverture <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setIsAIMessageModalOpen(true)}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Générer avec l'IA
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
            >
              <Upload className="w-5 h-5 mr-2" />
              Importer une image
            </button>
            <input
              type="file"
              id="coverImage"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">Taille maximale: 2 Mo.</p>

          {displayCoverImage && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Aperçu de l'image de couverture:</p>
              <img src={displayCoverImage} alt="Aperçu de la couverture" className="max-h-48 w-auto rounded-md shadow-md object-cover" />
              <button
                type="button"
                onClick={() => {
                  setSelectedCoverImageFile(null);
                  setGeneratedCoverImageBase64(null);
                  if (fileInputRef.current) fileInputRef.current.value = ''; // Clear file input
                }}
                className="mt-2 px-3 py-1 bg-red-500 text-white text-xs rounded-md hover:bg-red-600 transition-colors duration-200"
              >
                Supprimer l'image
              </button>
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
            Email du Bénéficiaire
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
            Partagé à 
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

      {/* AI Message Modal for Cover Image */}
      <AIMessageModal
        isOpen={isAIMessageModalOpen}
        onClose={() => setIsAIMessageModalOpen(false)}
        onInsertContent={handleInsertAIImage}
        cardTitle={title || "Nouvelle carte"}
        cardDescription={description || "Description de la carte"}
        imageOnlyMode={true} 
      />
    </div>
  )
}

export default CreateCardPage
