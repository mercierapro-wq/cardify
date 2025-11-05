import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Send, Image, Video, Mic, Type, Pencil, Mail, Play, Sparkles, Users, Trash2 } from 'lucide-react' // Added Trash2 icon
import { API_ENDPOINTS } from '../config/api'
import AIMessageModal from '../components/AIMessageModal'
import InviteParticipantsModal from '../components/InviteParticipantsModal' // Import new modal
import ParticipantList from '../components/ParticipantList' // Import new component
import DeleteConfirmationModal from '../components/DeleteConfirmationModal' // Import DeleteConfirmationModal

interface User {
  userId: string
  _id: string
  firstName?: string
  lastName?: string
}

interface CardProps {
  _id: string
  title: string
  description: string
  cover: string
  createdBy: string
  createdAt: string
  updatedAt: string
  moneyPotLink?: string
  status: 'draft' | 'sent' | 'upcoming'
}

interface MessageProps {
  _id: string
  card_id: string
  user_id: string
  firstName?: string
  lastName?: string
  message_type: 'text' | 'image' | 'video' | 'audio'
  content: string
  createdAt: string
  updatedAt: string
}

interface UlinkCardProps {
  _id: string
  user_id: string
  card_id: string
  role: 'admin' | 'contributor' | 'beneficiary'
  updatedAt: string
  createdAt: string
  // Added for enriched participant data
  firstName?: string
  lastName?: string
}

interface CardDetailPageProps {
  currentUser: User | null
}

// Utility function to extract YouTube video ID
const getYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([\w-]{11})(?:\S+)?/i,
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com)\/shorts\/([\w-]{11})(?:\S+)?/i, // For YouTube Shorts
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
};

// YouTube Embed Component
const YouTubeEmbed: React.FC<{ videoId: string }> = ({ videoId }) => {
  const [showEmbed, setShowEmbed] = useState(false);
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;

  return (
    <div className="relative w-full pb-[56.25%] h-0 rounded-lg overflow-hidden shadow-md border border-gray-200"> {/* 16:9 Aspect Ratio */}
      {!showEmbed ? (
        <div
          className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setShowEmbed(true)}
        >
          <img
            src={thumbnailUrl}
            alt="YouTube Thumbnail"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 hover:bg-opacity-60 transition-opacity duration-200">
            <Play className="w-16 h-16 text-white opacity-80" fill="white" />
          </div>
        </div>
      ) : (
        <iframe
          className="absolute inset-0 w-full h-full"
          src={embedUrl}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="YouTube video player"
        ></iframe>
      )}
    </div>
  );
};


const CardDetailPage: React.FC<CardDetailPageProps> = ({ currentUser }) => {
  const { cardId } = useParams<{ cardId: string }>()
  const [card, setCard] = useState<CardProps | null>(null)
  const [messages, setMessages] = useState<MessageProps[]>([])
  const [loadingCard, setLoadingCard] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Message creation states
  const [selectedMessageType, setSelectedMessageType] = useState<'text' | 'image' | 'video' | 'audio'>('text')
  const [textMessageContent, setTextMessageContent] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [generatedImageContent, setGeneratedImageContent] = useState<string | null>(null) // New state for generated image

  const [isSubmittingMessage, setIsSubmittingMessage] = useState(false)
  const [messageError, setMessageError] = useState<string | null>(null)
  const [isAIMessageModalOpen, setIsAIMessageModalOpen] = useState(false) // State for AI modal

  // Cagnotte states
  const [isMoneyPotActive, setIsMoneyPotActive] = useState(false)
  const [isEditingMoneyPot, setIsEditingMoneyPot] = useState(false)
  const [moneyPotLinkInput, setMoneyPotLinkInput] = useState('')
  const [isUpdatingCard, setIsUpdatingCard] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  // Beneficiary states
  const [beneficiaryEmail, setBeneficiaryEmail] = useState<string | null>(null)
  const [isEditingBeneficiary, setIsEditingBeneficiary] = useState(false)
  const [beneficiaryEmailInput, setBeneficiaryEmailInput] = useState('')
  const [isUpdatingBeneficiary, setIsUpdatingBeneficiary] = useState(false)
  const [beneficiaryUpdateError, setBeneficiaryUpdateError] = useState<string | null>(null)

  // Participant states
  const [participants, setParticipants] = useState<UlinkCardProps[]>([])
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [loadingParticipants, setLoadingParticipants] = useState(true)

  // Message deletion states
  const [isDeleteMessageModalOpen, setIsDeleteMessageModalOpen] = useState(false)
  const [messageToDelete, setMessageToDelete] = useState<MessageProps | null>(null)


  // User role on this card
  const [userRole, setUserRole] = useState<'admin' | 'contributor' | 'beneficiary' | null>(null)

  // Determine if current user is the admin of the card
  const isAdmin = currentUser && card && currentUser.userId === card.createdBy
  const isBeneficiary = currentUser && userRole === 'beneficiary'
  const isCardSent = card?.status === 'sent'

  const fetchCardDetails = async () => {
    if (!cardId) {
      setError("Aucun ID de carte fourni.")
      setLoadingCard(false)
      return
    }

    try {
      setLoadingCard(true)
      setError(null)

      const response = await fetch(API_ENDPOINTS.GET_CARDS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ _ids: [cardId] }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erreur lors de la récupération des détails de la carte.')
      }

      const data: CardProps[] = await response.json()

      if (data && data.length > 0) {
        setCard(data[0])
      } else {
        setError("Carte non trouvée.")
      }
    } catch (err) {
      console.error('Failed to fetch card details:', err)
      setError((err as Error).message || 'Impossible de charger les détails de la carte. Veuillez réessayer plus tard.')
    } finally {
      setLoadingCard(false)
    }
  }

  const fetchParticipantsAndRole = async () => {
    if (!cardId) {
      setParticipants([])
      setUserRole(null)
      setBeneficiaryEmail(null)
      setLoadingParticipants(false)
      return
    }

    try {
      setLoadingParticipants(true)
      const response = await fetch(API_ENDPOINTS.GET_USERS_BY_CARD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ card_id: cardId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erreur lors de la récupération des rôles des utilisateurs.')
      }

      const ulinkCards: UlinkCardProps[] = await response.json()

      // Fetch user details for each participant
      const uniqueUserIds = Array.from(new Set(ulinkCards.map(ul => ul.user_id)))
      const userDetailsPromises = uniqueUserIds.map(async (userId) => {
        const userResponse = await fetch(API_ENDPOINTS.GET_USER, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userId }),
        })
        if (userResponse.ok) {
          const userData = await userResponse.json()
          return { userId, firstName: userData.firstName, lastName: userData.lastName }
        }
        return { userId, firstName: undefined, lastName: undefined }
      })

      const allUserDetails = await Promise.all(userDetailsPromises)
      const userDetailsMap = new Map(allUserDetails.map(u => [u.userId, { firstName: u.firstName, lastName: u.lastName }]))

      const enrichedParticipants: UlinkCardProps[] = ulinkCards.map(ul => ({
        ...ul,
        firstName: userDetailsMap.get(ul.user_id)?.firstName,
        lastName: userDetailsMap.get(ul.user_id)?.lastName,
      }))

      setParticipants(enrichedParticipants)

      // Determine current user's role
      if (currentUser) {
        const currentUserLink = enrichedParticipants.find(link => link.user_id === currentUser.userId)
        if (currentUserLink) {
          setUserRole(currentUserLink.role)
        } else {
          setUserRole(null)
        }
      } else {
        setUserRole(null)
      }

      // Find beneficiary email
      const beneficiaryLink = enrichedParticipants.find(link => link.role === 'beneficiary')
      if (beneficiaryLink) {
        setBeneficiaryEmail(beneficiaryLink.user_id)
        setBeneficiaryEmailInput(beneficiaryLink.user_id)
      } else {
        setBeneficiaryEmail(null)
        setBeneficiaryEmailInput('')
      }

    } catch (err) {
      console.error('Failed to fetch participants, user role or beneficiary:', err)
      setUserRole(null)
      setBeneficiaryEmail(null)
      setParticipants([])
    } finally {
      setLoadingParticipants(false)
    }
  }

  useEffect(() => {
    fetchCardDetails()
  }, [cardId])

  useEffect(() => {
    fetchParticipantsAndRole()
  }, [cardId, currentUser]) // Re-fetch if cardId or currentUser changes

  useEffect(() => {
    const fetchMessages = async () => {
      if (!cardId) {
        setLoadingMessages(false)
        return
      }

      // Only fetch messages if the card is sent or if the user is an admin/contributor
      if (isBeneficiary && !isCardSent) {
        setMessages([]) // Clear messages if beneficiary and card not sent
        setLoadingMessages(false)
        return
      }

      try {
        setLoadingMessages(true)
        setMessageError(null)

        const response = await fetch(API_ENDPOINTS.READ_MESSAGES, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ cardId: cardId }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Erreur lors de la récupération des messages.')
        }

        const data: MessageProps[] = await response.json()
        setMessages(data)

      } catch (err) {
        console.error('Failed to fetch messages:', err)
        setMessageError((err as Error).message || 'Impossible de charger les messages. Veuillez réessayer plus tard.')
      } finally {
        setLoadingMessages(false)
      }
    }

    if (cardId && (isCardSent || !isBeneficiary)) { // Fetch messages if card is sent OR user is not a beneficiary
      fetchMessages()
    } else if (cardId && isBeneficiary && !isCardSent) {
      setMessages([]) // Ensure messages are cleared if beneficiary and card not sent
      setLoadingMessages(false)
    }
  }, [cardId, isCardSent, isBeneficiary])

  // Initialize money pot states when card data is loaded
  useEffect(() => {
    if (card) {
      setIsMoneyPotActive(!!card.moneyPotLink)
      setMoneyPotLinkInput(card.moneyPotLink || '')
    }
  }, [card])

  const updateCardField = async (field: keyof CardProps, value: any) => {
    if (!card || !currentUser || !isAdmin) {
      setUpdateError("Vous n'avez pas la permission de modifier cette carte.")
      return
    }

    setIsUpdatingCard(true)
    setUpdateError(null)

    try {
      const response = await fetch(API_ENDPOINTS.UPDATE_CARD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          _id: card._id,
          [field]: value,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Erreur lors de la mise à jour du champ ${field}.`)
      }

      const updatedCard = await response.json()
      // Merge the updated fields into the existing card state
      setCard(prevCard => {
        const newCardState = { ...prevCard!, ...updatedCard };
        // Explicitly ensure moneyPotLink is updated with the value sent,
        // in case the API response doesn't reflect it immediately or correctly.
        if (field === 'moneyPotLink') {
          newCardState.moneyPotLink = value;
        }
        if (field === 'status') {
          newCardState.status = value;
        }
        return newCardState;
      });
      
      // Also update local states derived from card
      if (field === 'moneyPotLink') {
        setIsMoneyPotActive(!!value)
        setMoneyPotLinkInput(value || '')
      }
    } catch (err) {
      console.error(`Failed to update card field ${field}:`, err)
      setUpdateError((err as Error).message || `Impossible de mettre à jour le champ ${field}.`)
    } finally {
      setIsUpdatingCard(false)
    }
  }

  const handleToggleMoneyPot = async () => {
    if (!isAdmin) return
    const newStatus = !isMoneyPotActive
    setIsMoneyPotActive(newStatus) // Update local state immediately

    if (!newStatus) {
      // If deactivating, clear the link in the database
      await updateCardField('moneyPotLink', '')
      setIsEditingMoneyPot(false) // Hide edit input if deactivated
      setMoneyPotLinkInput('') // Clear local input state
    }
    // If activating, do nothing here. The link will be set when explicitly saved.
  }

  const handleSaveMoneyPotLink = async () => {
    if (!isAdmin) return
    await updateCardField('moneyPotLink', moneyPotLinkInput)
    setIsEditingMoneyPot(false)
  }

  const handleSendCard = async () => {
    if (!isAdmin || !card || card.status === 'sent') return
    
    setUpdateError(null); // Clear previous errors
    setIsUpdatingCard(true); // Indicate loading

    if (!beneficiaryEmail) {
      setUpdateError("Impossible d'envoyer la carte : aucun bénéficiaire n'est défini.");
      setIsUpdatingCard(false);
      return;
    }

    try {
      const cardLink = `${window.location.origin}/card/${card._id}`;

      // RG 1: Call SendEmail endpoint
      const sendEmailResponse = await fetch(API_ENDPOINTS.SEND_EMAIL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          send_to: beneficiaryEmail,
          send_content: card.title,
          send_subject: card.description,
          card_link: cardLink,
        }),
      });

      if (!sendEmailResponse.ok) {
        const errorData = await sendEmailResponse.json();
        throw new Error(errorData.message || "Erreur lors de l'envoi de l'e-mail.");
      }

      const emailResult = await sendEmailResponse.json();
      // Check if the email was successfully sent (RG 1 success condition)
      // The API returns an object like {"id":"...", "threadId":"...", "labelIds":["SENT"]}
      const isEmailSent = emailResult && emailResult.labelIds && emailResult.labelIds.includes('SENT');

      if (!isEmailSent) {
        throw new Error("L'e-mail n'a pas pu être envoyé. Veuillez vérifier les détails.");
      }

      // RG 2: Update card status to "Envoyé"
      await updateCardField('status', 'sent');
      // RG 3: Card becomes visible for the beneficiary (handled by useEffect)

      setUpdateError(null); // Clear any errors if successful
    } catch (err) {
      console.error('Failed to send card:', err);
      setUpdateError((err as Error).message || 'Impossible d\'envoyer la carte. Veuillez réessayer.');
    } finally {
      setIsUpdatingCard(false);
    }
  }

  const handleSaveBeneficiaryEmail = async () => {
    if (!isAdmin || !cardId || !beneficiaryEmailInput.trim()) {
      setBeneficiaryUpdateError("Vous n'avez pas la permission ou l'email est invalide.")
      return
    }

    setIsUpdatingBeneficiary(true)
    setBeneficiaryUpdateError(null)

    try {
      const response = await fetch(API_ENDPOINTS.UPDATE_ULINK_CARD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          card_id: cardId,
          user_id: beneficiaryEmailInput.trim(),
          role: 'beneficiary',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erreur lors de la mise à jour du bénéficiaire.')
      }

      // Assuming the API returns the updated ulink card or a success message
      // We can update the local state with the new beneficiary email
      setBeneficiaryEmail(beneficiaryEmailInput.trim())
      setIsEditingBeneficiary(false)
      fetchParticipantsAndRole() // Refresh participants to show updated beneficiary
    } catch (err) {
      console.error('Failed to update beneficiary email:', err)
      setBeneficiaryUpdateError((err as Error).message || 'Impossible de mettre à jour le bénéficiaire.')
    } finally {
      setIsUpdatingBeneficiary(false)
    }
  }

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  const handleInsertAIContent = (type: 'text' | 'image' | 'video' | 'audio', content: string) => {
    setSelectedMessageType(type);
    if (type === 'text') {
      setTextMessageContent(content);
      setImageFile(null);
      setGeneratedImageContent(null);
      setVideoUrl('');
      setAudioFile(null);
    } else if (type === 'image') {
      setGeneratedImageContent(content); // This content is already base64 prefixed
      setImageFile(null); // Clear manual file selection
      setTextMessageContent('');
      setVideoUrl('');
      setAudioFile(null);
    } else if (type === 'video') {
      setVideoUrl(content);
      setTextMessageContent('');
      setImageFile(null);
      setGeneratedImageContent(null);
      setAudioFile(null);
    } else if (type === 'audio') {
      // TEMPORARY: Using videoUrl for AI-generated audio URL, as discussed in AIMessageModal
      setVideoUrl(content);
      setAudioFile(null);
      setTextMessageContent('');
      setImageFile(null);
      setGeneratedImageContent(null);
    }
    setIsAIMessageModalOpen(false);
  };


  const handleMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || !cardId) {
      setMessageError("Veuillez vous connecter pour écrire un message.")
      return
    }
    if (isBeneficiary && !isCardSent) {
      setMessageError("Vous ne pouvez pas écrire de message tant que la carte n'est pas envoyée.")
      return
    }

    let contentToSend = ''
    let typeToSend: 'text' | 'image' | 'video' | 'audio' = selectedMessageType

    if (selectedMessageType === 'text') {
      if (!textMessageContent.trim()) {
        setMessageError("Veuillez écrire un message.")
        return
      }
      contentToSend = textMessageContent.trim()
    } else if (selectedMessageType === 'image') {
      if (generatedImageContent) { // Use generated image if available
        contentToSend = generatedImageContent;
      } else if (imageFile) { // Otherwise, use manually selected file
        try {
          contentToSend = await convertFileToBase64(imageFile);
        } catch (err) {
          setMessageError("Erreur lors de la conversion de l'image.")
          console.error('Image conversion error:', err)
          return
        }
      } else {
        setMessageError("Veuillez sélectionner une image ou en générer une.")
        return
      }
    } else if (selectedMessageType === 'video') {
      if (!videoUrl.trim()) {
        setMessageError("Veuillez entrer un lien vidéo.")
        return
      }
      contentToSend = videoUrl.trim()
    } else if (selectedMessageType === 'audio') {
      if (!audioFile) {
        setMessageError("Veuillez sélectionner un fichier audio.")
        return
      }
      try {
        contentToSend = await convertFileToBase64(audioFile);
      } catch (err) {
        setMessageError("Erreur lors de la conversion de l'audio.")
        console.error('Audio conversion error:', err)
        return
      }
    }

    setIsSubmittingMessage(true)
    setMessageError(null)

    try {
      const response = await fetch(API_ENDPOINTS.INSERT_MESSAGE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardId: cardId,
          type: typeToSend,
          content: contentToSend,
          createdBy: currentUser.userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erreur lors de l\'envoi du message.')
      }

      const responseData = await response.json()
      const newMessage: MessageProps = responseData[0] 
      
      const messageWithUserNames: MessageProps = {
        ...newMessage,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
      };

      setMessages((prevMessages) => [...prevMessages, messageWithUserNames])
      
      // Clear input fields after successful submission
      setTextMessageContent('')
      setImageFile(null)
      setVideoUrl('')
      setAudioFile(null)
      setGeneratedImageContent(null) // Clear generated image
      setSelectedMessageType('text') // Reset to text input
    } catch (err) {
      console.error('Failed to send message:', err)
      setMessageError((err as Error).message || 'Impossible d\'envoyer le message. Veuillez réessayer.')
    } finally {
      setIsSubmittingMessage(false)
    }
  }

  const renderMessageContent = (message: MessageProps) => {
    const messageContent = message.content || ''; // Ensure content is a string
    
    // Check for YouTube link first if it's a text message
    if (message.message_type === 'text' || message.message_type === 'video') {
      const youtubeId = getYouTubeId(messageContent);
      if (youtubeId) {
        return <YouTubeEmbed videoId={youtubeId} />;
      }
    }

    switch (message.message_type) {
      case 'text':
        return <p className="text-gray-800">{messageContent}</p>
      case 'image':
        // Ensure the image content has the data URI prefix for display
        const imageSrc = messageContent.startsWith('data:image/') ? messageContent : `data:image/png;base64,${messageContent}`;
        return (
          <img 
            src={imageSrc} 
            alt="Message image" 
            className="max-w-full h-auto rounded-lg shadow-md" 
            style={{ maxHeight: '200px', objectFit: 'contain' }} // Limit height for tile display
          />
        )
      case 'video':
        // If it's a video type but not a YouTube link (e.g., a direct video file URL or other platform)
        return (
          <a href={messageContent} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center">
            <Video className="w-4 h-4 mr-1" /> Voir la vidéo
          </a>
        )
      case 'audio':
        // Ensure the audio content has the data URI prefix for display if it's base64
        const audioSrc = messageContent.startsWith('data:audio/') ? messageContent : `data:audio/mpeg;base64,${messageContent}`;
        return (
          <audio controls src={audioSrc} className="w-full">
            Votre navigateur ne supporte pas l'élément audio.
          </audio>
        );
      default:
        // Fallback for unknown types, or if type is 'text' but content is image
        if (typeof messageContent === 'string' && messageContent.startsWith('data:image/')) {
          return (
            <img 
              src={messageContent} 
              alt="Message image (auto-detected)" 
              className="max-w-full h-auto rounded-lg shadow-md" 
              style={{ maxHeight: '200px', objectFit: 'contain' }}
            />
          )
        }
        return <p className="text-gray-800">{messageContent}</p>
    }
  }

  const isSubmitDisabled = isSubmittingMessage || (
    (selectedMessageType === 'text' && !textMessageContent.trim()) ||
    (selectedMessageType === 'image' && !imageFile && !generatedImageContent) || // Check for generated image too
    (selectedMessageType === 'video' && !videoUrl.trim()) ||
    (selectedMessageType === 'audio' && !audioFile)
  )

  // Participant Management Handlers
  const handleOpenInviteModal = () => setIsInviteModalOpen(true)
  const handleCloseInviteModal = () => setIsInviteModalOpen(false)
  const handleInvitationsSent = () => {
    fetchParticipantsAndRole() // Refresh participant list after invitations
    handleCloseInviteModal()
  }

  const handleDeleteParticipant = async (ulinkCardId: string, participantEmail: string) => {
    if (!isAdmin || !cardId) {
      setUpdateError("Vous n'avez pas la permission de supprimer des participants.")
      return
    }

    setUpdateError(null)

    try {
      const response = await fetch(API_ENDPOINTS.DELETE_ULINK_CARD, {
        method: 'POST', // Assuming POST for deletion as per API spec
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          card_id: cardId,
          user_id: participantEmail,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Erreur lors de la suppression du participant ${participantEmail}.`)
      }

      const responseData = await response.json();
      // The server returns [{"deletedCount":1}] for a successful deletion.
      // We check if deletedCount is at least 1.
      if (responseData && responseData.length > 0 && responseData[0].deletedCount >= 1) {
        // Successfully deleted, refresh the participant list
        fetchParticipantsAndRole();
      } else {
        throw new Error(`La suppression du participant ${participantEmail} n'a pas été confirmée par le serveur.`);
      }

    } catch (err) {
      console.error('Failed to delete participant:', err)
      setUpdateError((err as Error).message || 'Impossible de supprimer le participant. Veuillez réessayer.')
    }
  }

  // Message Deletion Handlers
  const handleOpenDeleteMessageModal = (message: MessageProps) => {
    setMessageToDelete(message)
    setIsDeleteMessageModalOpen(true)
  }

  const handleCloseDeleteMessageModal = () => {
    setIsDeleteMessageModalOpen(false)
    setMessageToDelete(null)
  }

  const handleConfirmDeleteMessage = async () => {
    if (!messageToDelete || !currentUser || !cardId) {
      setMessageError("Impossible de supprimer le message : informations manquantes.")
      return
    }

    // RG 1: Check if current user is the author or an admin
    const isAuthor = currentUser.userId === messageToDelete.user_id
    if (!isAuthor && !isAdmin) {
      setMessageError("Vous n'avez pas la permission de supprimer ce message.")
      return
    }

    setIsSubmittingMessage(true) // Use this to disable buttons during deletion
    setMessageError(null)

    try {
      const response = await fetch(API_ENDPOINTS.DELETE_MESSAGE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ _id: messageToDelete._id }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erreur lors de la suppression du message.')
      }

      const data = await response.json()
      if (data && data.length > 0 && data[0].deletedCount === 1) {
        setMessages(prevMessages => prevMessages.filter(msg => msg._id !== messageToDelete._id))
        handleCloseDeleteMessageModal()
      } else {
        throw new Error("La suppression du message n'a pas été confirmée par le serveur.")
      }
    } catch (err) {
      console.error('Failed to delete message:', err)
      setMessageError((err as Error).message || 'Impossible de supprimer le message. Veuillez réessayer.')
    } finally {
      setIsSubmittingMessage(false)
    }
  }


  if (loadingCard || loadingParticipants) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg text-gray-700">Chargement des détails de la carte...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-center" role="alert">
          <strong className="font-bold">Erreur:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    )
  }

  if (!card) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg text-gray-700">Aucune carte à afficher.</p>
      </div>
    )
  }

  // Conditional rendering for beneficiaries if card is not sent
  if (isBeneficiary && !isCardSent) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link to="/my-cards" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour à mes cartes
          </Link>
        </div>
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 p-8 text-center">
          <Mail className="w-16 h-16 text-indigo-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Carte en attente d'envoi</h2>
          <p className="text-lg text-gray-600 mb-6">
            Cette carte n'a pas encore été envoyée par l'administrateur. Vous pourrez la consulter une fois qu'elle sera disponible.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex justify-between items-center">
        <Link to="/my-cards" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour à mes cartes
        </Link>
        {isAdmin && card.status !== 'sent' && (
          <button
            onClick={handleSendCard}
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isUpdatingCard}
          >
            {isUpdatingCard ? 'Envoi...' : 'Envoyer la carte'}
            <Send className="w-5 h-5 ml-2" />
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="relative h-96">
          <img src={card.cover} alt={card.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-6 flex items-end">
            <h1 className="text-4xl font-bold text-white">{card.title}</h1>
          </div>
        </div>

        <div className="p-6">
          <p className="text-gray-700 text-lg mb-4">{card.description}</p>
          
          <div className="flex flex-col md:flex-row md:space-x-8">
            <div className="md:w-1/2 mb-6 md:mb-0">
              {(isAdmin || beneficiaryEmail !== null) && ( // RG 1: Always show for admin, or if beneficiary is set
                <div className="text-gray-600 text-sm mb-2">
                  <span className="font-semibold">Bénéficiaire:</span>{' '}
                  <div className="inline-flex items-center space-x-2">
                    {isEditingBeneficiary && isAdmin ? ( // RG 4: Only admins can modify
                      <input
                        type="email"
                        value={beneficiaryEmailInput}
                        onChange={(e) => setBeneficiaryEmailInput(e.target.value)}
                        className="p-1 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder="Email du bénéficiaire"
                        disabled={isUpdatingBeneficiary}
                      />
                    ) : (
                      <span>{beneficiaryEmail || (isAdmin ? 'Non défini' : 'Chargement...')}</span> // Show placeholder for admin if not set
                    )}
                    {isAdmin && ( // RG 4: Only admins can modify
                      <button
                        type="button"
                        onClick={() => {
                          if (isEditingBeneficiary) {
                            handleSaveBeneficiaryEmail();
                          } else {
                            setIsEditingBeneficiary(true);
                          }
                        }}
                        className="p-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isUpdatingBeneficiary}
                        title={isEditingBeneficiary ? "Sauvegarder l'email" : "Modifier l'email du bénéficiaire"}
                      >
                        {isEditingBeneficiary ? 'Sauver' : <Pencil className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                  {beneficiaryUpdateError && (
                    <p className="text-red-500 text-xs mt-1">{beneficiaryUpdateError}</p>
                  )}
                  {isUpdatingBeneficiary && <p className="text-indigo-600 text-xs mt-1">Mise à jour du bénéficiaire...</p>}
                </div>
              )}
              <p className="text-gray-600 text-sm mb-2">
                <span className="font-semibold">Créée par:</span> {card.createdBy}
              </p>
              <p className="text-gray-600 text-sm mb-2">
                <span className="font-semibold">Statut:</span>{' '}
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${card.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {card.status === 'sent' ? 'Envoyée' : 'Brouillon'}
                </span>
              </p>
            </div>

            <div className="md:w-1/2">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Cagnotte</h2>
              {updateError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                  <strong className="font-bold">Erreur:</strong>
                  <span className="block sm:inline"> {updateError}</span>
                </div>
              )}
              {/* RG 1: Un bénéficiaire ne peux pas modifier la cagnotte, il ne voit pas le toggle de la cagnotte */}
              {!isBeneficiary && (
                <div className="flex items-center justify-between mb-4">
                  <label htmlFor="moneyPotToggle" className="flex items-center cursor-pointer">
                    <span className="mr-3 text-lg font-semibold text-gray-900">Activer la Cagnotte</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        id="moneyPotToggle"
                        className="sr-only"
                        checked={isMoneyPotActive}
                        onChange={handleToggleMoneyPot}
                        disabled={!isAdmin || isUpdatingCard}
                      />
                      <div
                        className={`block w-10 h-6 rounded-full transition-colors duration-200 ease-in-out ${
                          isMoneyPotActive ? 'bg-indigo-600' : 'bg-gray-300'
                        }`}
                      ></div>
                      <div
                        className={`dot absolute left-0.5 top-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-200 ease-in-out ${
                          isMoneyPotActive ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      ></div>
                    </div>
                  </label>
                  {isUpdatingCard && <p className="text-indigo-600 text-sm ml-4">Mise à jour...</p>}
                </div>
              )}

              {/* RG 1: il voit uniquement le lien de la cagnotte s’il existe */}
              {isMoneyPotActive && card.moneyPotLink && (
                <div className="mb-4">
                  <p className="text-gray-600 text-sm mb-2">
                    <span className="font-semibold">Lien Cagnotte:</span>{' '}
                  </p>
                  <div className="flex items-center space-x-2">
                    {isEditingMoneyPot && isAdmin ? ( // RG 1: Only admins can modify
                      <input
                        type="url"
                        value={moneyPotLinkInput}
                        onChange={(e) => setMoneyPotLinkInput(e.target.value)}
                        className="flex-grow p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Lien de la cagnotte"
                        disabled={isUpdatingCard}
                      />
                    ) : (
                      <a
                        href={card.moneyPotLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline truncate max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg"
                      >
                        {card.moneyPotLink}
                      </a>
                    )}
                    {isAdmin && ( // RG 1: Only admins can modify
                      <button
                        type="button"
                        onClick={() => {
                          if (isEditingMoneyPot) {
                            handleSaveMoneyPotLink();
                          } else {
                            setIsEditingMoneyPot(true);
                          }
                        }}
                        className="p-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isUpdatingCard}
                        title={isEditingMoneyPot ? "Sauvegarder le lien" : "Modifier le lien"}
                      >
                        {isEditingMoneyPot ? 'Sauver' : <Pencil className="w-5 h-5" />}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <hr className="my-6 border-gray-200" />

          {/* Participant Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Participants</h2>
              {/* RG 3: Un bénéficiaire ne peut pas modifier la liste des participants */}
              {!isBeneficiary && (
                <button
                  onClick={handleOpenInviteModal}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <Users className="w-5 h-5 mr-2" />
                  Inviter des Participants
                </button>
              )}
            </div>
            {loadingParticipants ? (
              <div className="flex justify-center items-center h-24">
                <p className="text-gray-700">Chargement des participants...</p>
              </div>
            ) : (
              <ParticipantList
                participants={participants.filter(p => p.role !== 'removed')} // Filter out 'removed' participants
                currentUserEmail={currentUser?.userId}
                isAdmin={isAdmin}
                onDeleteParticipant={handleDeleteParticipant}
              />
            )}
          </div>

          <hr className="my-6 border-gray-200" />

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Messages</h2>

          {messageError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <strong className="font-bold">Erreur:</strong>
              <span className="block sm:inline"> {messageError}</span>
            </div>
          )}

          {loadingMessages ? (
            <div className="flex justify-center items-center h-24">
              <p className="text-gray-700">Chargement des messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-lg text-gray-600">Il n'y a pas encore de message sur cette carte.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
              {messages.map((message) => (
                <div 
                  key={message._id} 
                  className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200 flex-grow flex-shrink basis-auto min-w-[280px] max-w-sm relative group" // Added 'relative group' for hover effect
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-indigo-600">
                      {message.firstName && message.lastName 
                        ? `${message.firstName} ${message.lastName}` 
                        : message.user_id}
                    </span>
                    <span className="text-sm text-gray-500">{new Date(message.createdAt).toLocaleDateString()}</span>
                  </div>
                  {renderMessageContent(message)}

                  {/* RG 1 & RG 2 - UI: Delete icon */}
                  {(currentUser?.userId === message.user_id || isAdmin) && (
                    <button
                      onClick={() => handleOpenDeleteMessageModal(message)}
                      className="absolute bottom-2 right-2 p-1 rounded-full text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      title="Supprimer le message"
                      disabled={isSubmittingMessage}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <hr className="my-6 border-gray-200" />

          {/* RG 2: Un bénéficiaire ne peux pas écrire de message, l’espace message n’est pas affiché */}
          {!isBeneficiary && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Votre Message pour {card.title}</h2>
              {currentUser ? (
                <form onSubmit={handleMessageSubmit} className="flex flex-col space-y-4">
                  <div className="flex space-x-2 mb-4 p-2 border border-gray-300 rounded-lg bg-gray-50">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMessageType('text');
                        setGeneratedImageContent(null); // Clear generated image when switching type
                      }}
                      className={`p-2 rounded-lg transition-colors duration-200 ${
                        selectedMessageType === 'text' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-200'
                      }`}
                      title="Message Texte"
                    >
                      <Type className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMessageType('image');
                        setTextMessageContent(''); // Clear text when switching type
                      }}
                      className={`p-2 rounded-lg transition-colors duration-200 ${
                        selectedMessageType === 'image' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-200'
                      }`}
                      title="Message Image"
                    >
                      <Image className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMessageType('video');
                        setGeneratedImageContent(null); // Clear generated image when switching type
                      }}
                      className={`p-2 rounded-lg transition-colors duration-200 ${
                        selectedMessageType === 'video' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-200'
                      }`}
                      title="Message Vidéo"
                    >
                    <Video className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMessageType('audio');
                        setGeneratedImageContent(null); // Clear generated image when switching type
                      }}
                      className={`p-2 rounded-lg transition-colors duration-200 ${
                        selectedMessageType === 'audio' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-200'
                      }`}
                      title="Message Audio"
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAIMessageModalOpen(true)}
                      className="ml-auto p-2 rounded-lg transition-colors duration-200 bg-purple-600 text-white hover:bg-purple-700"
                      title="Assistance IA"
                      disabled={isSubmittingMessage}
                    >
                      <Sparkles className="w-5 h-5" />
                    </button>
                  </div>

                  {selectedMessageType === 'text' && (
                    <div className="flex flex-col space-y-2">
                      <textarea
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 resize-y"
                        rows={4}
                        placeholder="Écrivez votre message ici..."
                        value={textMessageContent}
                        onChange={(e) => setTextMessageContent(e.target.value)}
                        disabled={isSubmittingMessage}
                      ></textarea>
                    </div>
                  )}

                  {selectedMessageType === 'image' && (
                    <div className="flex flex-col space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        onChange={(e) => {
                          setImageFile(e.target.files ? e.target.files[0] : null);
                          setGeneratedImageContent(null); // Clear generated image if user selects a file
                        }}
                        disabled={isSubmittingMessage}
                      />
                      {generatedImageContent && (
                        <div className="mt-4 p-4 border border-gray-300 rounded-lg bg-gray-50">
                          <h4 className="font-semibold text-gray-700 mb-2">Image générée (prévisualisation):</h4>
                          <img src={generatedImageContent} alt="Generated Message Preview" className="max-w-full h-auto rounded-lg shadow-md" />
                          <button
                            type="button"
                            onClick={() => setGeneratedImageContent(null)}
                            className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
                          >
                            Supprimer l'image générée
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedMessageType === 'video' && (
                    <input
                      type="url"
                      placeholder="Lien vers la vidéo (ex: YouTube)"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      disabled={isSubmittingMessage}
                    />
                  )}

                  {selectedMessageType === 'audio' && (
                    <input
                      type="file"
                      accept="audio/*"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      onChange={(e) => setAudioFile(e.target.files ? e.target.files[0] : null)}
                      disabled={isSubmittingMessage}
                    />
                  )}

                  <div className="flex justify-end items-center space-x-2">
                    <button
                      type="submit"
                      className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isSubmitDisabled}
                    >
                      {isSubmittingMessage ? 'Envoi...' : 'Envoyer le message'}
                      <Send className="w-5 h-5 ml-2" />
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-lg text-gray-600">Veuillez vous connecter pour écrire un message.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {card && (
        <AIMessageModal
          isOpen={isAIMessageModalOpen}
          onClose={() => setIsAIMessageModalOpen(false)}
          onInsertContent={handleInsertAIContent}
          cardTitle={card.title}
          cardDescription={card.description}
        />
      )}
      {card && (
        <InviteParticipantsModal
          isOpen={isInviteModalOpen}
          onClose={handleCloseInviteModal}
          cardId={card._id}
          onInvitationsSent={handleInvitationsSent}
        />
      )}
      {messageToDelete && (
        <DeleteConfirmationModal
          isOpen={isDeleteMessageModalOpen}
          onClose={handleCloseDeleteMessageModal}
          onConfirm={handleConfirmDeleteMessage}
          itemType="message"
          itemName={messageToDelete.message_type === 'text' ? messageToDelete.content.substring(0, 50) + '...' : `le ${messageToDelete.message_type}`}
        />
      )}
    </div>
  )
}

export default CardDetailPage
