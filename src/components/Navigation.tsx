
import React, { useState } from "react";
import { Button } from "./ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { Menu, X } from "lucide-react";

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
    <nav className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-md border-b border-border/40 transition-all duration-300 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <img
              src="/logo.jpeg"
              alt="AM4M Logo"
              className="h-8 w-8 object-contain rounded-full ring-1 ring-teal-500/30"
            />
            <span className="text-xl font-bold bg-gradient-to-r from-teal-500 to-emerald-400 bg-clip-text text-transparent">
              AM4M
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => navigate("/discover")}
              className="text-foreground/70 hover:text-foreground font-medium transition-colors duration-200"
            >
              Discover
            </button>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="text-foreground/70 hover:text-foreground font-medium transition-colors duration-200"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection("pricing")}
              className="text-foreground/70 hover:text-foreground font-medium transition-colors duration-200"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection("faq")}
              className="text-foreground/70 hover:text-foreground font-medium transition-colors duration-200"
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
                <Button
                  onClick={openAuthModal}
                  className="bg-gradient-to-r from-teal-600 to-emerald-500 text-white border-0 hover:from-teal-500 hover:to-emerald-400 shadow-md shadow-teal-500/20"
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>

          <button
            className="md:hidden text-foreground/70"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t bg-background/95 backdrop-blur-md">
            <div className="flex flex-col gap-4">
              <button
                onClick={() => scrollToSection("discover")}
                className="text-foreground/70 hover:text-foreground font-medium transition-colors duration-200"
              >
                Discover
              </button>
              <button
                onClick={() => scrollToSection("pricing")}
                className="text-foreground/70 hover:text-foreground font-medium transition-colors duration-200"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection("faq")}
                className="text-foreground/70 hover:text-foreground font-medium transition-colors duration-200"
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
                  <Button
                    onClick={openAuthModal}
                    className="bg-gradient-to-r from-teal-600 to-emerald-500 text-white border-0 hover:from-teal-500 hover:to-emerald-400"
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
