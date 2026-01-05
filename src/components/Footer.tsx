import React from "react";
import { Link } from "react-router-dom";

export const Footer: React.FC = () => {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-white text-xl font-bold mb-4">AM4M</h3>
            <p className="text-sm text-gray-400">
              Halal matchmaking for American Muslims. Find your spouse with
              confidence and family blessing.
            </p>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => scrollToSection("about")}
                  className="hover:text-teal-400"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("how-it-works")}
                  className="hover:text-teal-400"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("success_stories")}
                  className="hover:text-teal-400"
                >
                  Success Stories
                </button>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => scrollToSection("faq")}
                  className="hover:text-teal-400"
                >
                  FAQ
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("trust_safety")}
                  className="hover:text-teal-400"
                >
                  Safety Guidelines
                </button>
              </li>

              {/* ✅ Contact is now a real page */}
              <li>
                <Link to="/contact" className="hover:text-teal-400">
                  Contact Us
                </Link>
              </li>

              <li>
                <button
                  onClick={() => scrollToSection("faq")}
                  className="hover:text-teal-400"
                >
                  Help Center
                </button>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/terms" className="hover:text-teal-400">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-teal-400">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/2257-exemption" className="hover:text-teal-400">
                  2257 Exemption
                </Link>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("how-it-works")}
                  className="hover:text-teal-400"
                >
                  Community Guidelines
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("islamic_guidelines")}
                  className="hover:text-teal-400"
                >
                  Islamic Guidelines
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-400">
            © 2025 American Muslims 4 Marriage. All rights reserved.
          </p>

          <div className="flex gap-6 mt-4 md:mt-0 text-sm">
            <a
              href="https://www.facebook.com/share/16x2PzRm3h/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-teal-400"
            >
              Facebook
            </a>
            <a
              href="https://www.instagram.com/americanmuslim4marriage?igsh=MTUzZzJ2MmpvZWNycA=="
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-teal-400"
            >
              Instagram
            </a>
            <a
              href="https://www.youtube.com/@AmericanMuslim4Marriage"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-teal-400"
            >
              YouTube
            </a>
            <span
              className="text-gray-500 cursor-not-allowed"
              title="TikTok link coming soon"
            >
              TikTok
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
