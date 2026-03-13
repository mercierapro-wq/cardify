import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Sparkles, Users, Shield, HelpCircle } from 'lucide-react'

interface FAQItem {
  question: string
  answer: React.ReactNode
}

interface FAQSection {
  title: string
  icon: React.ReactNode
  color: string
  items: FAQItem[]
}

const faqSections: FAQSection[] = [
  {
    title: 'Général',
    icon: <HelpCircle className="w-5 h-5" />,
    color: 'indigo',
    items: [
      {
        question: "Qu'est-ce que Cardify ?",
        answer: (
          <p>
            Cardify est une application de <strong>cartes de vœux numériques collaboratives</strong>. Elle permet à plusieurs personnes — amis, famille, collègues — de contribuer ensemble à une même carte en y ajoutant des messages, des photos et du contenu généré par intelligence artificielle. La carte est ensuite partagée avec le destinataire sous forme numérique, pérenne et sans encombrement.
          </p>
        ),
      },
      {
        question: 'Cardify est-il gratuit ?',
        answer: (
          <p>
            Oui, Cardify est accessible gratuitement. Créez un compte et commencez à créer vos cartes collaboratives sans frais.
          </p>
        ),
      },
      {
        question: 'Sur quels appareils puis-je utiliser Cardify ?',
        answer: (
          <p>
            Cardify fonctionne directement dans votre navigateur web, sur <strong>ordinateur, tablette et smartphone</strong>. Aucune installation n'est requise. Il suffit de vous rendre sur{' '}
            <a href="https://cardify.nodalforge.cloud" className="text-indigo-600 hover:underline font-medium">
              cardify.nodalforge.cloud
            </a>
            .
          </p>
        ),
      },
      {
        question: 'Quelle est la différence entre une carte numérique et une carte papier ?',
        answer: (
          <p>
            Une carte numérique Cardify ne se jette pas après le premier ménage de printemps. Elle est <strong>accessible à vie</strong>, peut réunir les contributions de dizaines de personnes, intègre des images générées par IA, et ne coûte ni timbre ni impression. Elle reste consultable depuis n'importe quel appareil, à tout moment.
          </p>
        ),
      },
    ],
  },
  {
    title: "L'IA dans Cardify",
    icon: <Sparkles className="w-5 h-5" />,
    color: 'purple',
    items: [
      {
        question: "Comment fonctionne l'assistance IA de Cardify ?",
        answer: (
          <p>
            Cardify intègre une intelligence artificielle directement dans l'éditeur de carte. Lorsque vous rédigez votre contribution, vous pouvez activer l'assistant IA pour <strong>générer un texte personnalisé</strong> ou <strong>créer une image originale</strong> en quelques secondes. L'IA s'appuie sur le titre et la description de la carte pour produire un contenu cohérent et adapté à l'occasion.
          </p>
        ),
      },
      {
        question: "L'IA peut-elle rédiger un message personnalisé à ma place ?",
        answer: (
          <p>
            Oui. Décrivez simplement le ton ou l'intention de votre message (humour, émotion, professionnel…) et l'IA rédige un texte adapté à la carte. Vous pouvez ensuite <strong>modifier, affiner ou insérer</strong> le résultat directement dans votre contribution. Idéal si vous manquez d'inspiration ou de temps.
          </p>
        ),
      },
      {
        question: "L'IA peut-elle générer des images pour ma carte ?",
        answer: (
          <p>
            Absolument. En sélectionnant le mode <strong>"Image Créative"</strong>, décrivez visuellement ce que vous souhaitez (style artistique, couleurs, sujet, composition) et l'IA génère une image unique prête à être insérée dans votre carte. Chaque image est créée spécifiquement pour votre carte — il n'y a pas deux images identiques.
          </p>
        ),
      },
      {
        question: "Qu'est-ce que l'optimisation de prompt ?",
        answer: (
          <p>
            C'est une fonctionnalité exclusive de Cardify : si vous avez du mal à formuler votre demande à l'IA, le bouton <strong>"Optimiser le prompt"</strong> analyse le contexte de votre carte et reformule automatiquement votre description pour obtenir un meilleur résultat. C'est une IA qui vous aide à mieux parler à l'IA.
          </p>
        ),
      },
      {
        question: "Puis-je modifier ou régénérer le contenu produit par l'IA ?",
        answer: (
          <p>
            Oui, à volonté. Vous pouvez relancer la génération autant de fois que nécessaire, modifier votre description et obtenir des résultats différents. Le contenu généré n'est inséré dans la carte que lorsque vous cliquez sur <strong>"Insérer"</strong> — vous gardez le contrôle total.
          </p>
        ),
      },
      {
        question: "Mes données sont-elles utilisées pour entraîner l'IA ?",
        answer: (
          <p>
            Non. Le contenu de vos cartes et vos messages ne sont pas utilisés pour entraîner des modèles d'intelligence artificielle. Vos données restent privées et sont protégées conformément à notre{' '}
            <a href="/privacy" className="text-indigo-600 hover:underline font-medium">
              politique de confidentialité
            </a>
            .
          </p>
        ),
      },
    ],
  },
  {
    title: 'Collaboration',
    icon: <Users className="w-5 h-5" />,
    color: 'green',
    items: [
      {
        question: 'Comment inviter des participants à ma carte ?',
        answer: (
          <p>
            Une fois votre carte créée, rendez-vous dans la gestion des participants et renseignez l'adresse email de la personne à inviter. Elle reçoit un email l'invitant à rejoindre la carte et à y ajouter sa contribution.
          </p>
        ),
      },
      {
        question: 'Combien de personnes peuvent contribuer à une carte ?',
        answer: (
          <p>
            Il n'y a pas de limite au nombre de contributeurs. Que vous soyez 5 collègues ou 50 membres d'une famille, tout le monde peut participer et laisser son message sur la même carte collaborative.
          </p>
        ),
      },
      {
        question: 'Quelle est la différence entre administrateur, contributeur et bénéficiaire ?',
        answer: (
          <ul className="space-y-2">
            <li><strong>Administrateur :</strong> créateur de la carte, il gère les participants, peut modifier et supprimer la carte.</li>
            <li><strong>Contributeur :</strong> peut ajouter des messages, des photos et du contenu IA à la carte.</li>
            <li><strong>Bénéficiaire :</strong> le destinataire de la carte, qui peut la consulter dans sa version finale.</li>
          </ul>
        ),
      },
      {
        question: 'Le destinataire peut-il voir les contributions avant la date prévue ?',
        answer: (
          <p>
            Non. Tant que la carte est en cours de création, le bénéficiaire n'a pas accès aux contributions. L'administrateur contrôle le moment où la carte est partagée avec le destinataire.
          </p>
        ),
      },
    ],
  },
  {
    title: 'Compte & Sécurité',
    icon: <Shield className="w-5 h-5" />,
    color: 'indigo',
    items: [
      {
        question: 'Comment créer un compte sur Cardify ?',
        answer: (
          <p>
            Cliquez sur <strong>"Se connecter"</strong> depuis la page d'accueil, puis choisissez <strong>"Créer un compte"</strong>. Renseignez votre prénom, nom, email et un mot de passe sécurisé (8 caractères minimum, avec majuscule, chiffre et caractère spécial).
          </p>
        ),
      },
      {
        question: 'Puis-je me connecter avec Google ?',
        answer: (
          <p>
            La connexion via Google est une fonctionnalité prévue et sera disponible prochainement. Pour l'instant, la connexion se fait par email et mot de passe.
          </p>
        ),
      },
      {
        question: 'Mes données sont-elles sécurisées ?',
        answer: (
          <p>
            Toutes les communications entre votre navigateur et nos serveurs sont chiffrées via <strong>HTTPS/TLS</strong>. Vos données ne sont jamais revendues à des tiers. Pour en savoir plus, consultez notre{' '}
            <a href="/privacy" className="text-indigo-600 hover:underline font-medium">
              politique de confidentialité
            </a>
            .
          </p>
        ),
      },
      {
        question: 'Comment supprimer mon compte ?',
        answer: (
          <p>
            Pour toute demande de suppression de compte et de vos données personnelles, contactez-nous à{' '}
            <a href="mailto:nodalforge@gmail.com" className="text-indigo-600 hover:underline font-medium">
              nodalforge@gmail.com
            </a>
            . Conformément au RGPD, votre demande sera traitée dans les meilleurs délais.
          </p>
        ),
      },
    ],
  },
]

const colorMap: Record<string, string> = {
  indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
  purple: 'text-purple-600 bg-purple-50 border-purple-100',
  green: 'text-green-600 bg-green-50 border-green-100',
}

const FAQItem: React.FC<{ item: FAQItem }> = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="w-full border border-gray-200 rounded-xl overflow-hidden">
      <button
        className="w-full flex justify-between items-center px-6 py-4 text-left bg-white hover:bg-gray-50 transition-colors duration-200"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-gray-900 pr-4">{item.question}</span>
        {isOpen
          ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
          : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
        }
      </button>
      {isOpen && (
        <div className="w-full px-6 py-4 bg-gray-50 border-t border-gray-100 text-gray-600 leading-relaxed break-words">
          {item.answer}
        </div>
      )}
    </div>
  )
}

const FAQPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-indigo-600 rounded-2xl px-8 py-12 text-center mb-10">
          <Sparkles className="w-16 h-16 text-white mx-auto mb-4 opacity-90" />
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            Questions fréquentes
          </h1>
          <p className="mt-4 text-indigo-200 text-lg max-w-2xl mx-auto">
            Tout ce que vous devez savoir sur Cardify et son assistant IA pour créer des cartes de vœux collaboratives inoubliables.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {faqSections.map((section) => (
            <section key={section.title} className="w-full">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border font-semibold text-sm mb-4 ${colorMap[section.color]}`}>
                {section.icon}
                {section.title}
              </div>
              <div className="w-full space-y-3">
                {section.items.map((item) => (
                  <FAQItem key={item.question} item={item} />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* CTA bas de page */}
        <div className="mt-12 p-8 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Vous n'avez pas trouvé votre réponse ?</h2>
          <p className="text-gray-600 mb-4">Notre équipe est disponible pour répondre à toutes vos questions.</p>
          <a
            href="mailto:nodalforge@gmail.com"
            className="inline-block px-6 py-3 bg-indigo-600 text-white font-semibold rounded-full hover:bg-indigo-700 transition-colors duration-200"
          >
            Contacter le support
          </a>
        </div>
      </div>
    </div>
  )
}

export default FAQPage
