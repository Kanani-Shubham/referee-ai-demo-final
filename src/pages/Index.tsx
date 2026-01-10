import React, { useState } from 'react';
import { LandingPage } from '@/components/referee/LandingPage';
import { DecisionForm } from '@/components/referee/DecisionForm';
import { ComparisonDashboard } from '@/components/referee/ComparisonDashboard';
import { LoadingScreen } from '@/components/referee/LoadingScreen';
import { AppStep, UserPreferences, ComparisonResponse } from '@/types';
import { compareOptions } from '@/services/gemini';

export default function Index() {
  const [step, setStep] = useState<AppStep>(AppStep.LANDING);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [comparisonData, setComparisonData] = useState<ComparisonResponse | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleStart = () => setStep(AppStep.INTENT);

  const handleFormSubmit = async (prefs: UserPreferences) => {
    setPreferences(prefs);
    setStep(AppStep.LOADING);
    
    try {
      const data = await compareOptions(prefs);
      setComparisonData(data);
      setStep(AppStep.RESULTS);
      window.scrollTo(0, 0);
    } catch (error) {
      console.error("Error fetching comparison:", error);
      alert("The Referee couldn't reach a verdict. Please check your inputs.");
      setStep(AppStep.INTENT);
    }
  };

  const handleRefresh = async (newPrefs: UserPreferences) => {
    setIsRefreshing(true);
    setPreferences(newPrefs);
    try {
      const data = await compareOptions(newPrefs);
      setComparisonData(data);
    } catch (error) {
      alert("Failed to update simulation.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleReset = () => {
    setPreferences(null);
    setComparisonData(null);
    setStep(AppStep.LANDING);
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {step === AppStep.LANDING && <LandingPage onStart={handleStart} />}
      {step === AppStep.INTENT && <DecisionForm onSubmit={handleFormSubmit} isSubmitting={false} />}
      {step === AppStep.LOADING && <LoadingScreen />}
      {step === AppStep.RESULTS && comparisonData && preferences && (
        <ComparisonDashboard
          initialData={comparisonData}
          initialPreferences={preferences}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
