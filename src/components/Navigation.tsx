
import React, { useState } from "react";
import { Button } from "./ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useAuthModal } from "@/contexts/AuthModalContext";

export const Navigation: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { openAuthModal } = useAuthModal();

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤝</span>
            <span className="text-xl font-bold text-teal-600">AM4M</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => navigate("/discover")}
              className="text-gray-700 hover:text-teal-600 font-medium"
            >
              Discover
            </button>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="text-gray-700 hover:text-teal-600 font-medium"
            >
              How It Works
            </button>
            <button
              onClick={() => navigate("/pricing")}
              className="text-gray-700 hover:text-teal-600 font-medium"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection("faq")}
              className="text-gray-700 hover:text-teal-600 font-medium"
            >
              FAQ
            </button>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Button variant="ghost" onClick={handleDashboard}>
                  Dashboard
                </Button>
                <Button variant="outline" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={openAuthModal}>
                  Login
                </Button>
                <Button onClick={openAuthModal}>Sign Up</Button>
              </>
            )}
          </div>

          <button
            className="md:hidden text-gray-700"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col gap-4">
              <button
                onClick={() => scrollToSection("discover")}
                className="text-gray-700 hover:text-teal-600 font-medium"
              >
                Discover
              </button>
              <button
                onClick={() => navigate("/pricing")}
                className="text-gray-700 hover:text-teal-600 font-medium"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection("faq")}
                className="text-gray-700 hover:text-teal-600 font-medium"
              >
                FAQ
              </button>

              {user ? (
                <>
                  <Button variant="ghost" onClick={handleDashboard}>
                    Dashboard
                  </Button>
                  <Button variant="outline" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={openAuthModal}>
                    Login
                  </Button>
                  <Button onClick={openAuthModal}>Sign Up</Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};


// import React, { useState } from 'react';
// import { Button } from './ui/Button';
// import { AuthModal } from './auth/AuthModal';
// import { useAuth } from '@/contexts/AuthContext';
// import { useNavigate } from 'react-router-dom';


// export const Navigation: React.FC = () => {
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const [authModalOpen, setAuthModalOpen] = useState(false);
//   const { user, signOut } = useAuth();
//   const navigate = useNavigate();

//   const scrollToSection = (id: string) => {
//     document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
//     setMobileMenuOpen(false);
//   };

//   const handleLogin = () => {
//     setAuthModalOpen(true);
//   };

//   const handleSignUp = () => {
//     setAuthModalOpen(true);
//   };

//   const handleSignOut = async () => {
//     await signOut();
//     navigate('/');
//   };

//   const handleDashboard = () => {
//     navigate('/dashboard');
//   };


//   return (
//     <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-md z-50">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex justify-between items-center h-16">
//           <div className="flex items-center gap-2">
//             <span className="text-2xl">🤝</span>
//             <span className="text-xl font-bold text-teal-600">AM4M</span>
//           </div>
          
//           <div className="hidden md:flex items-center gap-8">
//             <button onClick={() => scrollToSection('discover')} className="text-gray-700 hover:text-teal-600 font-medium">
//               Discover
//             </button>
//             <button onClick={() => scrollToSection('how-it-works')} className="text-gray-700 hover:text-teal-600 font-medium">
//               How It Works
//             </button>
//             <button onClick={() => window.location.href = '/pricing'} className="text-gray-700 hover:text-teal-600 font-medium">
//               Pricing
//             </button>
//             <button onClick={() => scrollToSection('faq')} className="text-gray-700 hover:text-teal-600 font-medium">
//               FAQ
//             </button>
//           </div>

//           <div className="hidden md:flex items-center gap-4">
//             {user ? (
//               <>
//                 <Button variant="ghost" onClick={handleDashboard}>Dashboard</Button>
//                 <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
//               </>
//             ) : (
//               <>
//                 <Button variant="ghost" onClick={handleLogin}>Login</Button>
//                 <Button onClick={handleSignUp}>Sign Up</Button>
//               </>
//             )}
//           </div>


//           <button 
//             className="md:hidden text-gray-700"
//             onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
//           >
//             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
//             </svg>
//           </button>
//         </div>

//         {mobileMenuOpen && (
//           <div className="md:hidden py-4 border-t">
//             <div className="flex flex-col gap-4">
//               <button onClick={() => scrollToSection('discover')} className="text-gray-700 hover:text-teal-600 font-medium">
//                 Discover
//               </button>
//               <button onClick={() => scrollToSection('pricing')} className="text-gray-700 hover:text-teal-600 font-medium">
//                 Pricing
//               </button>
//               <button onClick={() => scrollToSection('faq')} className="text-gray-700 hover:text-teal-600 font-medium">
//                 FAQ
//               </button>
//               {user ? (
//                 <>
//                   <Button variant="ghost" onClick={handleDashboard}>Dashboard</Button>
//                   <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
//                 </>
//               ) : (
//                 <>
//                   <Button variant="ghost" onClick={handleLogin}>Login</Button>
//                   <Button onClick={handleSignUp}>Sign Up</Button>
//                 </>
//               )}
//             </div>
//           </div>
//         )}
//       </div>

//       <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
//     </nav>
//   );
// };
