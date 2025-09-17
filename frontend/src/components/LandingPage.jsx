import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowRightIcon } from "@heroicons/react/24/outline";

export default function LandingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        await axios.get(`${VITE_BACKEND_URL}/api/emails/today`, { withCredentials: true });
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    checkAuthStatus();
  }, [VITE_BACKEND_URL]);

  const handleButtonClick = () => {
    if (isAuthenticated) {
      window.location.href = '/dashboard'; // Redirect to dashboard
    } else {
      window.location.href = `${VITE_BACKEND_URL}/auth/google`; // Redirect to Google Auth
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary-50 to-white text-secondary-900">Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary-50 to-white text-secondary-900 p-6">
      <div className="max-w-xl text-center space-y-8">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl leading-tight">
          Your <span className="text-primary-600">Smart Email</span> Assistant
        </h1>
        <p className="text-lg sm:text-xl text-secondary-700 leading-relaxed">
          Effortlessly manage your inbox with AI-powered categorization, intelligent summaries, and timely alerts. Stay organized and never miss what's important.
        </p>
        <button
          onClick={handleButtonClick}
          className="btn-primary btn-lg inline-flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
        >
          <span>{isAuthenticated ? 'Go to Dashboard' : 'Get Started'}</span>
          <ArrowRightIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
