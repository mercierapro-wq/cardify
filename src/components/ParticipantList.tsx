import React, { useState } from 'react'
import { Crown, User, Trash2, X, Check } from 'lucide-react'

interface Participant {
  _id: string // UlinkCard _id
  user_id: string // Email
  firstName?: string
  lastName?: string
  role: 'admin' | 'contributor' | 'beneficiary'
}

interface ParticipantListProps {
  participants: Participant[]
  currentUserEmail: string | undefined
  isAdmin: boolean
  onDeleteParticipant: (participantId: string, participantEmail: string) => void
}

const ParticipantList: React.FC<ParticipantListProps> = ({
  participants,
  currentUserEmail,
  isAdmin,
  onDeleteParticipant,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [participantToDelete, setParticipantToDelete] = useState<Participant | null>(null)

  const openConfirmModal = (participant: Participant) => {
    setParticipantToDelete(participant)
    setShowConfirmModal(true)
  }

  const closeConfirmModal = () => {
    setParticipantToDelete(null)
    setShowConfirmModal(false)
  }

  const handleDelete = () => {
    if (participantToDelete) {
      onDeleteParticipant(participantToDelete._id, participantToDelete.user_id)
      closeConfirmModal()
    }
  }

  const getDisplayName = (participant: Participant) => {
    if (participant.firstName && participant.lastName) {
      return `${participant.firstName} ${participant.lastName}`
    }
    return participant.user_id
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        Participants de la Carte ({participants.length})
      </h3>
      <div className="space-y-3">
        {participants.length === 0 ? (
          <p className="text-gray-600">Aucun participant pour le moment.</p>
        ) : (
          participants.map((participant) => (
            <div
              key={participant._id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold text-sm">
                  {participant.firstName ? participant.firstName[0] : participant.user_id[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-800">
                    {getDisplayName(participant)}{' '}
                    {participant.user_id === currentUserEmail && (
                      <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                        Vous
                      </span>
                    )}
                  </p>
                  <div className="flex items-center text-sm text-gray-500">
                    {participant.role === 'admin' ? (
                      <span className="flex items-center text-purple-700 font-semibold">
                        <Crown className="w-4 h-4 mr-1" /> Admin
                      </span>
                    ) : participant.role === 'beneficiary' ? (
                      <span className="flex items-center text-green-700 font-semibold">
                        <User className="w-4 h-4 mr-1" /> Bénéficiaire
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <User className="w-4 h-4 mr-1" /> Participant
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {isAdmin && participant.user_id !== currentUserEmail && ( // Admin can delete others, not self
                <button
                  onClick={() => openConfirmModal(participant)}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors duration-200"
                  title="Supprimer ce participant"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Confirmation Modal for Deletion */}
      {showConfirmModal && participantToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-auto relative">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Confirmer la suppression</h3>
            <p className="text-gray-700 mb-6">
              Êtes-vous sûr de vouloir retirer{' '}
              <span className="font-semibold">{getDisplayName(participantToDelete)}</span> de cette carte ?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeConfirmModal}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition-colors duration-200"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ParticipantList
