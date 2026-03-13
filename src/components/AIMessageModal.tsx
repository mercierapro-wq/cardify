import React, { useState, useEffect } from 'react'
import { X, Sparkles, Type, Image, Video, Mic, Loader2, Play, Lightbulb } from 'lucide-react'
import { API_ENDPOINTS } from '../config/api'
import { authFetch } from '../utils/authFetch' // ✅ IMPORT ADDED


interface AIMessageModalProps {
  isOpen: boolean
  onClose: () => void
  onInsertContent: (type: 'text' | 'image' | 'video' | 'audio', content: string) => void
  cardTitle: string
  cardDescription: string
  imageOnlyMode?: boolean // New prop to indicate image-only mode
}

// Utility function to extract YouTube video ID (duplicated for self-containment, could be shared)
const getYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([\w-]{11})(?:\S+)?/i,
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com)\/shorts\/([\w-]{11})(?:\S+)?/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
};

// YouTube Embed Component (duplicated for self-containment, could be shared)
const YouTubeEmbed: React.FC<{ videoId: string }> = ({ videoId }) => {
  const [showEmbed, setShowEmbed] = useState(false);
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;

  return (
    <div className="relative w-full pb-[56.25%] h-0 rounded-lg overflow-hidden shadow-md border border-gray-200">
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


const AIMessageModal: React.FC<AIMessageModalProps> = ({ isOpen, onClose, onInsertContent, cardTitle, cardDescription, imageOnlyMode = false }) => {
  const [aiPrompt, setAiPrompt] = useState('')
  const [generatingType, setGeneratingType] = useState<'text' | 'image' | 'video' | 'audio' | 'prompt' | null>(null)
  const [generatedText, setGeneratedText] = useState<string | null>(null)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null)
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [activeContentType, setActiveContentType] = useState<'text' | 'image' | null>(imageOnlyMode ? 'image' : null); // Initialize with 'image' if imageOnlyMode

  useEffect(() => {
    if (isOpen && imageOnlyMode) {
      setActiveContentType('image');
      resetState(); // Reset state when modal opens in imageOnlyMode
    } else if (isOpen && !imageOnlyMode) {
      setActiveContentType(null); // Reset if not in imageOnlyMode
      resetState();
    }
  }, [isOpen, imageOnlyMode]);

  const resetState = () => {
    setAiPrompt('')
    setGeneratingType(null)
    setGeneratedText(null)
    setGeneratedImage(null)
    setGeneratedVideoUrl(null)
    setGeneratedAudioUrl(null)
    setAiError(null)
  }

  const handleClose = () => {
    resetState()
    setActiveContentType(imageOnlyMode ? 'image' : null); // Reset active content type on close, keep 'image' if imageOnlyMode
    onClose()
  }

  const handleSelectContentType = (type: 'text' | 'image') => {
    setActiveContentType(type);
    resetState(); // Clear previous generated content and errors when switching type
  };

  const handleGeneratePrompt = async () => {
    if (!cardTitle || !cardDescription) {
      setAiError("Impossible de générer un prompt sans les détails de la carte.")
      return
    }
    if (!activeContentType) {
      setAiError("Veuillez sélectionner un type de contenu (Texte ou Image) d'abord.")
      return
    }

    setGeneratingType('prompt')
    setAiError(null)
    setGeneratedText(null)
    setGeneratedImage(null)
    setGeneratedVideoUrl(null)
    setGeneratedAudioUrl(null)

    const promptDescription = `Créé un prompt pour créer un message de type '${activeContentType === 'text' ? 'texte' : 'image'}' pour une carte dont le titre est '${cardTitle}' et la description est '${cardDescription}'. Base toi sur le titre et la description de la carte pour créer un prompt original. RETOURNEZ UNIQUEMENT ET DIRECTEMENT le prompt`

    try {
      const response = await authFetch(API_ENDPOINTS.CREATE_CONTENT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Connection': 'keep-alive',
        },
        body: JSON.stringify({
          "Description": promptDescription,
          "Type": "Texte",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Erreur lors de la génération du prompt.`)
      }

      const data = await response.json()

      if (data && data.Support && data.Type === 'Texte') {
        const generated = data.Support.startsWith('"') && data.Support.endsWith('"')
          ? data.Support.slice(1, -1)
          : data.Support;
        setAiPrompt(generated)
      } else {
        throw new Error("La réponse de génération de prompt est invalide ou vide.")
      }
    } catch (err) {
      console.error("Failed to generate prompt:", err)
      setAiError((err as Error).message || "Impossible de générer le prompt. Veuillez réessayer.")
    } finally {
      setGeneratingType(null)
    }
  }

  const handleGenerateAIContent = async (type: 'text' | 'image' | 'video' | 'audio') => {
    if (!cardTitle || !cardDescription) {
      setAiError("Impossible de générer du contenu sans les détails de la carte.")
      return
    }
    if (!activeContentType) {
      setAiError("Veuillez sélectionner un type de contenu (Texte ou Image) d'abord.")
      return
    }

    setGeneratingType(type)
    setAiError(null)
    setGeneratedText(null)
    setGeneratedImage(null)
    setGeneratedVideoUrl(null)
    setGeneratedAudioUrl(null)
		let cType=activeContentType === 'text' ? 'texte' : 'image'
    let descriptionPrompt
    if (aiPrompt) {
      descriptionPrompt = `Fait un(e) '${cType}' pour une carte, La demande spécifique est : ${aiPrompt}.RENVOI UNIQUEMENT UN(E) '${cType}'`
    }
		else {
			descriptionPrompt = `Fait un(e) '${cType}' pour une carte, la carte possède la description suivante : ${cardDescription}.RENVOI UNIQUEMENT UN(E) '${cType}'`
		}

    try {
      const response = await authFetch(API_ENDPOINTS.CREATE_CONTENT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Connection': 'keep-alive', // Important for potentially large responses
        },
        body: JSON.stringify({
          "Titre": cardTitle,
          "Description": descriptionPrompt,
          "Type": type === 'video' ? 'Texte' : (type === 'audio' ? 'Texte' : (type === 'text' ? 'Texte' : 'Image')), // AI generates text for video/audio links for now
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Erreur lors de la génération de ${type}.`)
      }

      const data = await response.json()

      if (data && data.Support) {
        if (type === 'text' && data.Type === 'Texte') {
          const generated = data.Support.startsWith('"') && data.Support.endsWith('"')
            ? data.Support.slice(1, -1)
            : data.Support;
          setGeneratedText(generated)
        } else if (type === 'image' && data.Type === 'Image') {
          setGeneratedImage(`data:image/png;base64,${data.Support}`)
        } else if (type === 'video' && data.Type === 'Texte') { // Assuming AI returns a video URL as text
          setGeneratedVideoUrl(data.Support)
        } else if (type === 'audio' && data.Type === 'Texte') { // Assuming AI returns an audio URL/base64 as text
          // For simplicity, if AI returns a URL, we'll treat it as such.
          // If it returns base64, it needs to be prefixed. For now, assume URL.
          setGeneratedAudioUrl(data.Support)
        } else {
          throw new Error("La réponse de génération est invalide ou ne correspond pas au type demandé.")
        }
      } else {
        throw new Error("La réponse de génération est vide ou invalide.")
      }
    } catch (err) {
      console.error(`Failed to generate ${type} content:`, err)
      setAiError((err as Error).message || `Impossible de générer le contenu ${type}. Veuillez réessayer.`)
    } finally {
      setGeneratingType(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-auto relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Sparkles className="w-6 h-6 mr-2 text-purple-600" />
            Assistance IA pour votre message
          </h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {aiError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm" role="alert">
            {aiError}
          </div>
        )}

        {/* Sélecteur Initial (B) - Hidden if imageOnlyMode is true */}
        {!imageOnlyMode && (
          <div className="flex gap-4 mb-6">
            <button
              type="button"
              onClick={() => handleSelectContentType('text')}
              className={`flex items-center px-4 py-2 rounded-lg shadow-sm transition-colors duration-200
                ${activeContentType === 'text' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
                `}
              disabled={!!generatingType}
            >
              <Type className="w-5 h-5 mr-2" />
              ✍️ Message Texte
            </button>
            <button
              type="button"
              onClick={() => handleSelectContentType('image')}
              className={`flex items-center px-4 py-2 rounded-lg shadow-sm transition-colors duration-200
                ${activeContentType === 'image' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
                `}
              disabled={!!generatingType}
            >
              <Image className="w-5 h-5 mr-2" />
              🖼️ Image Créative
            </button>
          </div>
        )}

        {/* Affichage Conditionnel du champ de description (A), bouton d'aide (A.2) et zone de résultat (C) */}
        {activeContentType && (
          <>
            <div className="mb-4">
              <label htmlFor="aiPrompt" className="block text-sm font-medium text-gray-700 mb-2">
                Décrivez ce que vous souhaitez générer :
              </label>
              <textarea
                id="aiPrompt"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 resize-y"
                rows={3}
                placeholder={activeContentType === 'text'
                  ? "description d'un message (ton, objectif, etc.)"
                  : "description visuelle (style artistique, couleurs, sujet, composition)"
                }
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                disabled={!!generatingType}
              ></textarea>
              <button
                type="button"
                onClick={handleGeneratePrompt}
                className={`mt-2 flex items-center px-4 py-2 rounded-lg shadow-sm transition-colors duration-200 ${
                  generatingType === 'prompt' ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={!!generatingType}
              >
                {generatingType === 'prompt' ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Lightbulb className="w-5 h-5 mr-2" />}
                Optimiser le prompt {activeContentType === 'text' ? 'Message (IA)' : 'Visuel (IA)'}
              </button>
            </div>

            {/* Display Generated Content (C) */}
            {(generatedText || generatedImage || generatedVideoUrl || generatedAudioUrl) && (
              <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-purple-500" />
                  Résultat de l'IA :
                </h3>
                {generatedText && activeContentType === 'text' && (
                  <div className="mb-4">
                    <p className="text-gray-700 mb-2">{generatedText}</p>
                    <button
                      onClick={() => onInsertContent('text', generatedText)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 text-sm"
                    >
                      Insérer ce texte
                    </button>
                  </div>
                )}
                {generatedImage && activeContentType === 'image' && (
                  <div className="mb-4">
                    <img src={generatedImage} alt="Generated" className="max-w-full h-auto rounded-lg shadow-md mb-2" style={{ maxHeight: '200px', objectFit: 'contain' }} />
                    <button
                      onClick={() => onInsertContent('image', generatedImage)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 text-sm"
                    >
                      Insérer cette image
                    </button>
                  </div>
                )}
                {/* Video and Audio results are still displayed if generated, but their generation buttons are removed from this dynamic flow */}
                {generatedVideoUrl && (
                  <div className="mb-4">
                    {getYouTubeId(generatedVideoUrl) ? (
                      <YouTubeEmbed videoId={getYouTubeId(generatedVideoUrl)!} />
                    ) : (
                      <a href={generatedVideoUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center mb-2">
                        <Video className="w-4 h-4 mr-1" /> Voir la vidéo générée
                      </a>
                    )}
                    <button
                      onClick={() => onInsertContent('video', generatedVideoUrl)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 text-sm"
                    >
                      Insérer ce lien vidéo
                    </button>
                  </div>
                )}
                {generatedAudioUrl && (
                  <div className="mb-4">
                    <audio controls src={generatedAudioUrl} className="w-full mb-2">
                      Votre navigateur ne supporte pas l'élément audio.
                    </audio>
                    <button
                      onClick={() => onInsertContent('audio', generatedAudioUrl)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 text-sm"
                    >
                      Insérer ce lien audio
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Bouton de Résultat Final */}
            <div className="mt-6">
              <button
                type="button"
                onClick={() => handleGenerateAIContent(activeContentType)}
                className={`flex items-center px-6 py-3 rounded-lg shadow-sm transition-colors duration-200 w-full justify-center
                  ${generatingType === activeContentType ? 'bg-purple-700 text-white' : 'bg-purple-600 text-white hover:bg-purple-700'}
                  disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={!!generatingType}
              >
                {generatingType === activeContentType ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : null}
                Générer {activeContentType === 'text' ? 'le Texte' : 'l\'Image'}
              </button>
            </div>
          </>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleClose}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

export default AIMessageModal
