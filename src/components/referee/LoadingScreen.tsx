import React from 'react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 border-4 border-muted rounded-full"></div>
        <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
        <div className="absolute inset-4 bg-card rounded-full shadow-inner flex items-center justify-center">
            <span className="text-2xl">⚖️</span>
        </div>
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2 text-center">
        Reviewing the Play
      </h2>
      <p className="text-muted-foreground text-center max-w-md animate-pulse">
        The Referee is analyzing your constraints and comparing options against millions of data points...
      </p>
    </div>
  );
};
