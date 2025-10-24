import React from 'react';

interface SwipeActionsProps {
  onPass: () => void;
  onLike: () => void;
  onSuperIntro: () => void;
}

export const SwipeActions: React.FC<SwipeActionsProps> = ({ onPass, onLike, onSuperIntro }) => {
  return (
    <div className="flex justify-center items-center gap-6 py-6">
      <button
        onClick={onPass}
        className="w-16 h-16 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center border-2 border-gray-200 hover:border-red-400 group"
        aria-label="Pass"
      >
        <svg className="w-8 h-8 text-gray-400 group-hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <button
        onClick={onSuperIntro}
        className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg hover:shadow-2xl transition-all duration-200 flex items-center justify-center hover:scale-110"
        aria-label="Super Intro"
      >
        <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </button>
      
      <button
        onClick={onLike}
        className="w-16 h-16 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center border-2 border-gray-200 hover:border-teal-400 group"
        aria-label="Like"
      >
        <svg className="w-8 h-8 text-gray-400 group-hover:text-teal-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </button>
    </div>
  );
};
