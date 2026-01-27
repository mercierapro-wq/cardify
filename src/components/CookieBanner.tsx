import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const GA_MEASUREMENT_ID = 'G-CJVGY1X2VG';

const CookieBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setIsVisible(true);
    } else if (consent === 'accepted') {
      loadGA();
    }
  }, []);

  const loadGA = () => {
    // Check if script already exists
    if (document.getElementById('google-analytics-script')) return;

    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    script1.id = 'google-analytics-script';
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_MEASUREMENT_ID}');
    `;
    document.head.appendChild(script2);
  };

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    loadGA();
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie_consent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-slide-up">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-900/95 backdrop-blur-md border border-gray-800 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-lg font-semibold text-white mb-2">Respect de votre vie privée</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Nous utilisons des cookies pour améliorer votre expérience et analyser le trafic. 
              En cliquant sur "Accepter", vous consentez à l'utilisation de Google Analytics. 
              Consultez notre{' '}
              <Link to="/privacy" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4 transition-colors">
                Politique de confidentialité
              </Link>{' '}
              pour en savoir plus.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleDecline}
              className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-xl transition-all duration-200 border border-gray-700"
            >
              Refuser
            </button>
            <button
              onClick={handleAccept}
              className="w-full sm:w-auto px-8 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/20"
            >
              Accepter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
