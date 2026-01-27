import React from 'react';
import { Shield, Lock, Eye, UserCheck, Globe, Mail } from 'lucide-react';

const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-600 px-8 py-12 text-center">
          <Shield className="w-16 h-16 text-white mx-auto mb-4 opacity-90" />
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            Politique de Confidentialité
          </h1>
          <p className="mt-2 text-indigo-100 font-medium">
            Écosystème NodalForge
          </p>
          <p className="mt-4 text-indigo-200 text-sm">
            Dernière mise à jour : 27 Janvier 2026
          </p>
        </div>

        {/* Content */}
        <div className="px-8 py-10 space-y-12">
          <section>
            <p className="text-gray-600 leading-relaxed text-lg">
              La présente politique de confidentialité détaille la manière dont <strong>NodalForge</strong> (incluant les services Cardify, NodalCV et home.nodalforge.cloud) collecte, utilise et protège vos informations.
            </p>
          </section>

          {/* 1. Responsable du Traitement */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-600">
              <UserCheck className="w-6 h-6" />
              <h2 className="text-xl font-bold text-gray-900">1. Responsable du Traitement</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              L'ensemble des services est édité par <strong>NodalForge</strong>. Pour toute question relative à vos données personnelles, vous pouvez nous contacter à : <a href="mailto:nodalforge@gmail.com" className="text-indigo-600 hover:underline font-medium">nodalforge@gmail.com</a>.
            </p>
          </section>

          {/* 2. Données Collectées */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-600">
              <Eye className="w-6 h-6" />
              <h2 className="text-xl font-bold text-gray-900">2. Données Collectées</h2>
            </div>
            <p className="text-gray-600">Nous collectons uniquement les données nécessaires au bon fonctionnement de nos services :</p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <li className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <span className="font-bold text-gray-900 block mb-1">Informations de compte</span>
                <span className="text-sm text-gray-600">Email, nom et photo de profil (via Google SSO).</span>
              </li>
              <li className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <span className="font-bold text-gray-900 block mb-1">Données de contenu</span>
                <span className="text-sm text-gray-600">Toutes les informations saisies pour la création de vos CV (expériences, formations, compétences, coordonnées).</span>
              </li>
              <li className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <span className="font-bold text-gray-900 block mb-1">Données de navigation</span>
                <span className="text-sm text-gray-600">Adresse IP (anonymisée), type d'appareil, pages visitées et sources de trafic (via Google Analytics 4).</span>
              </li>
              <li className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <span className="font-bold text-gray-900 block mb-1">Données d'interaction</span>
                <span className="text-sm text-gray-600">Nombre de vues sur votre CV, mots-clés de recherche ayant mené à votre profil.</span>
              </li>
            </ul>
          </section>

          {/* 3. Finalité de la Collecte */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-600">
              <Globe className="w-6 h-6" />
              <h2 className="text-xl font-bold text-gray-900">3. Finalité de la Collecte</h2>
            </div>
            <p className="text-gray-600">Vos données sont utilisées pour :</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><span className="font-medium text-gray-900">Fournir le service :</span> Créer, stocker et diffuser vos CV en ligne.</li>
              <li><span className="font-medium text-gray-900">Statistiques :</span> Vous fournir des analyses précises sur la visibilité de votre profil (vues, recherches).</li>
              <li><span className="font-medium text-gray-900">Amélioration :</span> Analyser l'audience globale de nos outils pour optimiser l'expérience utilisateur.</li>
            </ul>
          </section>

          {/* 4. Partage des Données */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-600">
              <Mail className="w-6 h-6" />
              <h2 className="text-xl font-bold text-gray-900">4. Partage des Données</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Nous ne vendons jamais vos données. Elles sont uniquement partagées avec nos sous-traitants techniques pour le fonctionnement du service :
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium border border-indigo-100">Google Cloud / SSO</span>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium border border-indigo-100">Google Analytics 4</span>
            </div>
          </section>

          {/* 5. Cookies et Tracking */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-600">
              <Eye className="w-6 h-6" />
              <h2 className="text-xl font-bold text-gray-900">5. Cookies et Tracking</h2>
            </div>
            <p className="text-gray-600">Nous utilisons des cookies pour :</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Maintenir votre session connectée.</li>
              <li>Enregistrer vos préférences de consentement.</li>
              <li>Mesurer l'audience via Google Analytics 4 (soumis à votre accord préalable via notre bannière de cookies).</li>
            </ul>
          </section>

          {/* 6. Vos Droits (RGPD) */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-600">
              <UserCheck className="w-6 h-6" />
              <h2 className="text-xl font-bold text-gray-900">6. Vos Droits (RGPD)</h2>
            </div>
            <p className="text-gray-600">Conformément à la réglementation européenne, vous disposez des droits suivants :</p>
            <div className="grid grid-cols-1 gap-4">
              <div className="p-4 border border-gray-200 rounded-xl">
                <h4 className="font-bold text-gray-900 mb-1">Droit d'accès et de rectification</h4>
                <p className="text-sm text-gray-600">Vous pouvez modifier vos données à tout moment depuis votre espace personnel.</p>
              </div>
              <div className="p-4 border border-gray-200 rounded-xl">
                <h4 className="font-bold text-gray-900 mb-1">Droit à l'effacement</h4>
                <p className="text-sm text-gray-600">Vous pouvez demander la suppression de votre compte et de toutes les données associées.</p>
              </div>
              <div className="p-4 border border-gray-200 rounded-xl">
                <h4 className="font-bold text-gray-900 mb-1">Droit d'opposition</h4>
                <p className="text-sm text-gray-600">Vous pouvez refuser le tracking analytique via notre bannière de cookies.</p>
              </div>
            </div>
          </section>

          {/* 7. Sécurité */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-600">
              <Lock className="w-6 h-6" />
              <h2 className="text-xl font-bold text-gray-900">7. Sécurité</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Toutes vos données sont transmises via un protocole sécurisé (<strong>HTTPS/TLS</strong>). Nous appliquons des politiques de chiffrement strictes pour protéger vos informations contre tout accès non autorisé.
            </p>
          </section>

          {/* Note importante */}
          <div className="mt-12 p-6 bg-amber-50 border border-amber-100 rounded-2xl">
            <p className="text-amber-800 text-sm leading-relaxed italic">
              <strong>Note importante :</strong> En utilisant nos services, vous acceptez que vos CV publics soient accessibles via un lien unique et puissent être indexés par les moteurs de recherche si vous choisissez de les rendre publics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
