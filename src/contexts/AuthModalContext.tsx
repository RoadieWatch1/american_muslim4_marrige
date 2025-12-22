import React, { createContext, useContext, useMemo, useState } from "react";
import { AuthModal } from "@/components/auth/AuthModal";

type AuthModalContextType = {
  openAuthModal: () => void;
  closeAuthModal: () => void;
  isAuthModalOpen: boolean;
};

const AuthModalContext = createContext<AuthModalContextType | null>(null);

export const AuthModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const value = useMemo(
    () => ({
      openAuthModal: () => setIsOpen(true),
      closeAuthModal: () => setIsOpen(false),
      isAuthModalOpen: isOpen,
    }),
    [isOpen]
  );

  return (
    <AuthModalContext.Provider value={value}>
      {children}

      {/* One modal globally for whole app */}
      <AuthModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </AuthModalContext.Provider>
  );
};

export const useAuthModal = () => {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within AuthModalProvider");
  return ctx;
};
