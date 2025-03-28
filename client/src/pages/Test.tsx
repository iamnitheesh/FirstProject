import React from 'react';
import FlashcardSetCard from '@/components/FlashcardSetCard';
import { queryClient } from '@/lib/queryClient';

export default function Test() {
  const sampleSet = {
    id: 1,
    title: "Sample Flashcard Set",
    description: "This is a test set to verify our FlashcardSetCard component",
    userId: 1,
    createdAt: new Date(),
    lastAccessed: new Date(),
    lastModified: new Date(),
    tags: ["math", "test"],
    primaryColor: "#3b82f6",
    backgroundImage: null,
    imageUrl: "https://source.unsplash.com/random/300x200/?math"
  };

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-5">FlashcardSetCard Test</h1>
      <div className="max-w-md">
        <FlashcardSetCard
          set={sampleSet}
          onDelete={() => {
            queryClient.invalidateQueries({ queryKey: ['/api/sets'] });
          }}
        />
      </div>
    </div>
  );
}