import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Globe, Shield, ExternalLink, HelpCircle } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 pt-12 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="text-2xl font-bold text-indigo-600 mb-4 block">
              Cardify
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed">
              Simplifiez la création et le partage de vos cartes de visite et profils professionnels au sein de l'écosystème NodalForge.
            </p>
          </div>

          {/* Services Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Écosystème
            </h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href="https://nodalcv.nodalforge.cloud/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-indigo-600 text-sm flex items-center gap-2 transition-colors"
                >
                  NodalCV <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a 
                  href="https://home.nodalforge.cloud/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-indigo-600 text-sm flex items-center gap-2 transition-colors"
                >
                  NodalForge Home <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Légal
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/privacy" className="text-gray-600 hover:text-indigo-600 text-sm flex items-center gap-2 transition-colors">
                  <Shield className="w-4 h-4" /> Politique de Confidentialité
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-600 hover:text-indigo-600 text-sm flex items-center gap-2 transition-colors">
                  <HelpCircle className="w-4 h-4" /> FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Contact
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="mailto:nodalforge@gmail.com" className="text-gray-600 hover:text-indigo-600 text-sm flex items-center gap-2 transition-colors">
                  <Mail className="w-4 h-4" /> nodalforge@gmail.com
                </a>
              </li>
              <li className="text-gray-600 text-sm flex items-center gap-2">
                <Globe className="w-4 h-4" /> nodalforge.cloud
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-xs">
            © {currentYear} NodalForge. Tous droits réservés.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-gray-300 text-xs">Propulsé par NodalForge</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
