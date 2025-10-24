import React from 'react';

export const Footer: React.FC = () => {
  const handleLinkClick = (section: string) => {
    alert(`Navigating to ${section}`);
  };

  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-white text-xl font-bold mb-4">AM4M</h3>
            <p className="text-sm text-gray-400">
              Halal matchmaking for American Muslims. Find your spouse with confidence and family blessing.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => handleLinkClick('About')} className="hover:text-teal-400">About Us</button></li>
              <li><button onClick={() => handleLinkClick('How It Works')} className="hover:text-teal-400">How It Works</button></li>
              <li><button onClick={() => handleLinkClick('Success Stories')} className="hover:text-teal-400">Success Stories</button></li>
              <li><button onClick={() => handleLinkClick('Blog')} className="hover:text-teal-400">Blog</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => handleLinkClick('FAQ')} className="hover:text-teal-400">FAQ</button></li>
              <li><button onClick={() => handleLinkClick('Safety')} className="hover:text-teal-400">Safety Guidelines</button></li>
              <li><button onClick={() => handleLinkClick('Contact')} className="hover:text-teal-400">Contact Us</button></li>
              <li><button onClick={() => handleLinkClick('Help Center')} className="hover:text-teal-400">Help Center</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => handleLinkClick('Terms')} className="hover:text-teal-400">Terms of Service</button></li>
              <li><button onClick={() => handleLinkClick('Privacy')} className="hover:text-teal-400">Privacy Policy</button></li>
              <li><button onClick={() => handleLinkClick('Community')} className="hover:text-teal-400">Community Guidelines</button></li>
              <li><button onClick={() => handleLinkClick('Islamic')} className="hover:text-teal-400">Islamic Guidelines</button></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-400">© 2025 American Muslims 4 Marriage. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <button onClick={() => alert('Social media link')} className="text-gray-400 hover:text-teal-400">Facebook</button>
            <button onClick={() => alert('Social media link')} className="text-gray-400 hover:text-teal-400">Twitter</button>
            <button onClick={() => alert('Social media link')} className="text-gray-400 hover:text-teal-400">Instagram</button>
          </div>
        </div>
      </div>
    </footer>
  );
};
