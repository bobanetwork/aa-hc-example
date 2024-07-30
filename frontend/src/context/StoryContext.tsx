// src/context/StoryContext.tsx

import React, { createContext, useState, ReactNode, useContext } from 'react';

interface StoryType {
  gameId: string;
  story: string;
  options: string[];
}

interface StoryContextType {
  story: StoryType;
  setStory: React.Dispatch<React.SetStateAction<StoryType>>;
}

const StoryContext = createContext<StoryContextType | undefined>(undefined);

const StoryProvider = ({ children }: { children: ReactNode }) => {
  const [story, setStory] = useState<StoryType>({
    gameId: '',
    story: '',
    options: [],
  });

  return (
    <StoryContext.Provider value={{ story, setStory }}>
      {children}
    </StoryContext.Provider>
  );
};

// Custom hook to use the StoryContext
const useStoryContext = () => {
  const context = useContext(StoryContext);
  if (context === undefined) {
    throw new Error('useStoryContext must be used within a StoryProvider');
  }
  return context;
};

export { StoryProvider, useStoryContext };
