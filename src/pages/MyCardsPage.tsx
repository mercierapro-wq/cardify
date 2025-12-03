import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PlusCircle, Gift, Users, Share2, LogIn, Trash2 } from 'lucide-react'
import { API_ENDPOINTS } from '../config/api'
import LoginModal from '../components/LoginModal'
import InviteParticipantsModal from '../components/InviteParticipantsModal'
import DeleteConfirmationModal from '../components/DeleteConfirmationModal' // Import new modal

interface CardProps {
  _id: string
  title: string
  description: string // Added description for potential display
  recipient: string
  type: 'created' | 'participated' | 'beneficiary' // Added beneficiary type
  contributors: number
  status: 'draft' | 'sent' | 'upcoming' // Status from backend
  cover: string
  // shareAt: string // REMOVED: No longer used
  createdBy: string
  createdAt: string
  updatedAt: string
  moneyPotLink?: string
  userRoleOnCard?: 'admin' | 'contributor' | 'beneficiary' // Added to store current user's role for this card
}

interface UlinkCardProps {
  _id: string
  user_id: string
  card_id: string
  role: 'admin' | 'contributor' | 'beneficiary' // Added beneficiary role
  updatedAt: string
  createdAt: string
}

interface User {
  userId: string
  _id: string
}

interface MyCardsPageProps {
  currentUser: User | null
  onLoginSuccess: (userId: string, _id: string) => void
}

const MyCardsPage: React.FC<MyCardsPageProps> = ({ currentUser, onLoginSuccess }) => {
  const [myCards, setMyCards] = useState<CardProps[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false) // State for invite modal
  const [selectedCardIdForInvite, setSelectedCardIdForInvite] = useState<string | null>(null) // State to hold cardId for invite modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false) // State for delete modal
  const [cardToDelete, setCardToDelete] = useState<CardProps | null>(null) // State to hold card to be deleted

  const navigate = useNavigate()

  const fetchCards = async () => {
    if (!currentUser) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // RG 1: Fetch linked card IDs and roles using GetCardsByUser for the current user
      const requestBody = { user_id: currentUser.userId };

      const ulinkResponse = await fetch(API_ENDPOINTS.GET_CARDS_BY_USER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!ulinkResponse.ok) {
        const errorData = await ulinkResponse.json()
        throw new Error(errorData.message || 'Erreur lors de la récupération des liens de cartes.')
      }

      const ulinkCards: UlinkCardProps[] = await ulinkResponse.json()

      if (ulinkCards.length === 0) {
        setMyCards([])
        setLoading(false)
        return
      }

      const cardIds = ulinkCards.map(link => link.card_id)
      const cardRoles = new Map<string, 'admin' | 'contributor' | 'beneficiary'>(
        ulinkCards.map(link => [link.card_id, link.role])
      )

      // RG 2: Fetch card details using GetCards with the retrieved card_ids
      const cardsResponse = await fetch(API_ENDPOINTS.GET_CARDS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ _ids: cardIds }), // Pass array of card IDs
      })

      if (!cardsResponse.ok) {
        const errorData = await cardsResponse.json()
        throw new Error(errorData.message || 'Erreur lors de la récupération des cartes.')
      }

      const data = await cardsResponse.json()

      // RG2: If no cards, the endpoint returns [{"error": "no card"}]
      if (Array.isArray(data) && data.length === 1 && (data[0] as any).error === "no card") {
        setMyCards([]); // Set to empty array if "no card" error
        setLoading(false);
        return;
      }

      // CRITICAL: Ensure data is an array before proceeding
      if (!Array.isArray(data)) {
        console.error('API_ENDPOINTS.GET_CARDS did not return an array:', data);
        throw new Error('La réponse de GetCards n\'est pas un tableau valide.');
      }

      const cardPromises = data.map(async (card) => {
          const role = cardRoles.get(card._id) || 'contributor' // Default to contributor if role not found
          
          // Filter for beneficiaries: only show if card status is 'sent'
          if (role === 'beneficiary' && card.status !== 'sent') {
            return null // Don't include this card for beneficiary if not sent
          }

          // Fetch all users linked to this specific card to count contributors and determine recipient
          const usersByCardResponse = await fetch(API_ENDPOINTS.GET_USERS_BY_CARD, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ card_id: card._id }),
          });

          if (!usersByCardResponse.ok) {
              console.error(`Failed to fetch users for card ${card._id}`);
              return null; // Skip this card if user links cannot be fetched
          }
          const linkedUsers: UlinkCardProps[] = await usersByCardResponse.json();
          
          // Ensure linkedUsers is an array before accessing .length
          const contributors = Array.isArray(linkedUsers) ? linkedUsers.length : 0; 
          
          let cardType: 'created' | 'participated' | 'beneficiary'
          if (card.createdBy === currentUser.userId) {
            cardType = 'created'
          } else if (role === 'beneficiary') {
            cardType = 'beneficiary'
          } else {
            cardType = 'participated'
          }

          // Determine recipient for display
          const beneficiaryLink = Array.isArray(linkedUsers) ? linkedUsers.find(link => link.role === 'beneficiary') : undefined;
          const beneficiaryEmail = beneficiaryLink ? beneficiaryLink.user_id : null;

          // Get other participants (excluding current user and beneficiary) for display
          const otherParticipantsEmails = Array.isArray(linkedUsers)
              ? linkedUsers.filter(link => link.user_id !== currentUser.userId && link.user_id !== beneficiaryEmail)
                           .map(link => link.user_id)
              : [];
          
          const displayRecipient = beneficiaryEmail;

          return {
            ...card,
            contributors,
            type: cardType,
            recipient: displayRecipient,
            userRoleOnCard: role, // Assign the current user's role for this card
          }
        });

      const resolvedCards = await Promise.all(cardPromises);

      // CRITICAL: Ensure resolvedCards is an array before filtering
      if (!Array.isArray(resolvedCards)) {
        console.error('Promise.all did not resolve to an array:', resolvedCards);
        throw new Error('Erreur interne: Le traitement des cartes n\'a pas renvoyé un tableau valide.');
      }

      const processedCards = resolvedCards.filter(Boolean) as CardProps[] // This is line 158

      setMyCards(processedCards)
    } catch (err) {
      console.error('Failed to fetch cards:', err)
      setError((err as Error).message || 'Impossible de charger les cartes. Veuillez réessayer plus tard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCards()
  }, [currentUser, navigate])

  const getStatusColor = (status: CardProps['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'sent':
        return 'bg-green-100 text-green-800'
      case 'upcoming': // This status is not currently used by the backend, but kept for consistency
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const openLoginModal = () => setIsLoginModalOpen(true)
  const closeLoginModal = () => setIsLoginModalOpen(false)

  const handleOpenInviteModal = (cardId: string) => {
    setSelectedCardIdForInvite(cardId)
    setIsInviteModalOpen(true)
  }

  const handleCloseInviteModal = () => {
    setIsInviteModalOpen(false)
    setSelectedCardIdForInvite(null)
    // Optionally re-fetch cards to update contributor count if needed
    // fetchCards(); 
  }

  const handleOpenDeleteModal = (card: CardProps) => {
    setCardToDelete(card)
    setIsDeleteModalOpen(true)
  }

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setCardToDelete(null)
  }

  const handleConfirmDelete = async () => {
    if (!cardToDelete || !currentUser) return

    try {
      const response = await fetch(API_ENDPOINTS.DELETE_ULINK_CARD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: currentUser.userId,
          card_id: cardToDelete._id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erreur lors de la suppression de la carte.')
      }

      // If deletion is successful, close modal and refresh cards
      handleCloseDeleteModal()
      fetchCards() // Re-fetch cards to update the list
    } catch (err) {
      console.error('Failed to delete card:', err)
      setError((err as Error).message || 'Impossible de supprimer la carte. Veuillez réessayer.')
      handleCloseDeleteModal() // Close modal even on error
    }
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col justify-center items-center h-96 bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <LogIn className="w-16 h-16 text-indigo-400 mb-6" />
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Accès Restreint</h2>
        <p className="text-lg text-gray-600 mb-6 text-center">
          Veuillez vous connecter pour voir et créer vos cartes.
        </p>
        <button
          onClick={openLoginModal}
          className="inline-flex items-center px-8 py-4 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-lg font-medium"
        >
          <LogIn className="w-6 h-6 mr-3" /> Se connecter
        </button>
        <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} onLoginSuccess={onLoginSuccess} />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg text-gray-700">Chargement des cartes...</p>
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

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mes Cartes</h1>
        <Link to="/create-card" className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
          <PlusCircle className="w-5 h-5 mr-2" />
          Créer une nouvelle carte
        </Link>
      </div>

      {myCards.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <p className="text-xl text-gray-600 mb-4">
            Les cartes Cardify rendent les vœux mémorables et amusants. En quelques clics, rassemblez les messages, photos et vidéos de tous vos proches sur une seule carte numérique
          </p>
          <Link to="/create-card" className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
            <PlusCircle className="w-5 h-5 mr-2" />
            Créer votre première carte
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {myCards.map((card) => (
            <div key={card._id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-200 group relative"> {/* Added group and relative for hover effect */}
              <div className="relative h-48">
                <img src={card.cover} alt={card.title} className="w-full h-full object-cover" />
                <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(card.status)}`}>
                  {card.status === 'draft' && 'Brouillon'}
                  {card.status === 'sent' && 'Envoyée'}
                  {card.status === 'upcoming' && 'À venir'}
                </span>
                <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-indigo-500 text-white text-xs font-semibold">
                  {card.type === 'beneficiary' ? 'Bénéficiaire' : 'Participant'}
                </span>

                {/* Delete Button - Conditional Visibility and Position */}
                {card.userRoleOnCard === 'admin' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent navigating to card detail
                      handleOpenDeleteModal(card);
                    }}
                    className="absolute bottom-3 right-3 p-1 rounded-full bg-white bg-opacity-75 text-gray-400 hover:text-red-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    aria-label="Supprimer la carte"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
              <div className="p-5">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{card.title}</h2>
                <p className="text-gray-600 text-sm mb-3">Pour: <span className="font-medium">{card.recipient}</span></p>
                <div className="flex items-center text-gray-500 text-sm mb-4">
                  <Users className="w-4 h-4 mr-1" />
                  <span>{card.contributors} contributeurs</span>
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                  <Link to={`/card/${card._id}`} className="text-indigo-600 hover:text-indigo-800 flex items-center text-sm font-medium">
                    <Gift className="w-4 h-4 mr-1" />
                    Voir la carte
                  </Link>
                  <button
                    onClick={() => handleOpenInviteModal(card._id)}
                    className="text-gray-500 hover:text-gray-700 flex items-center text-sm font-medium"
                  >
                    <Share2 className="w-4 h-4 mr-1" />
                    Partager
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedCardIdForInvite && (
        <InviteParticipantsModal
          isOpen={isInviteModalOpen}
          onClose={handleCloseInviteModal}
          cardId={selectedCardIdForInvite}
          onInvitationsSent={handleCloseInviteModal} // Close modal and potentially refresh list
        />
      )}

      {cardToDelete && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
          itemType="cette carte"
          itemIdentifier={cardToDelete.title}
        />
      )}
    </div>
  )
}

export default MyCardsPage
