import React from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Users, MessageSquareText } from 'lucide-react'

const HomePage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
        Célébrez ensemble avec des <span className="text-indigo-600">cartes de voeux collaboratives</span>
      </h1>
      <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mb-10">
        Marre des cartes de voeux encombrantes que l'on jette au premier ménage de printemps ? Cardify rend la création de cartes de voeux pérennes facile et amusante. Invitez vos amis, votre famille, vos collègues à laisser des messages personnalisés, des photos et des vidéos sur une seule carte numérique.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mb-12">
        <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
          <Sparkles className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">L'IA à votre service</h3>
          <p className="text-gray-600">Faites vous aider par l'IA pour créer vos images et vos textes</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
          <Users className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Collaborez Sans Effort</h3>
          <p className="text-gray-600">Invitez d'autres personnes à ajouter leurs vœux et souvenirs.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
          <MessageSquareText className="w-12 h-12 text-purple-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Messages Interactifs</h3>
          <p className="text-gray-600">Ajoutez du texte, des images, des GIFs et même des messages vidéo.</p>
        </div>
      </div>

      <Link to="/my-cards" className="px-8 py-4 bg-indigo-600 text-white text-xl font-semibold rounded-full shadow-lg hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50">
        Commencer maintenant
      </Link>

    </div>
  )
}

export default HomePage
