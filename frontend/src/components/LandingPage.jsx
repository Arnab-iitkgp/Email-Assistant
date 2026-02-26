import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        await axios.get(`${VITE_BACKEND_URL}/api/emails/today`, { withCredentials: true });
        setIsAuthenticated(true);
        navigate('/dashboard', { replace: true });
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    checkAuthStatus();
  }, [VITE_BACKEND_URL, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center font-mono text-primary animate-pulse">
        [INITIALIZING_VOID...]
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-background text-white selection:bg-primary/50 relative overflow-hidden flex flex-col justify-center items-center font-sans tracking-tight">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 z-0 opacity-20" style={{
        backgroundImage: 'radial-gradient(circle at 2px 2px, #3F3F46 1px, transparent 0)',
        backgroundSize: '32px 32px'
      }}></div>

      <div className="max-w-4xl w-full px-6 relative z-10 text-center flex flex-col items-center justify-center h-full pt-12 pb-6">
        <header className="mb-6 inline-block">
          <div className="flex items-center space-x-3 mb-2 justify-center">
            <h1 className="text-3xl md:text-4xl font-black font-headline uppercase tracking-tight text-white line-height-none">
              <span className="text-primary">E</span>mailPro
            </h1>
          </div>
          <p className="text-muted font-mono text-[9px] uppercase tracking-[0.2em]">AI-Powered Email Assistant</p>
        </header>

        <h2 className="text-4xl md:text-6xl lg:text-8xl font-black font-headline uppercase leading-[0.9] mb-6 tracking-tighter text-white">
          COMMAND YOUR <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-white shadow-glow">INBOX</span>
        </h2>

        <div className="max-w-3xl mx-auto mb-10 relative">
          <p className="text-xl md:text-2xl text-white font-headline font-bold leading-tight tracking-tight px-4">
            The intelligent AI agent for your <br className="md:hidden" />
            <span className="relative inline-block px-4 py-1 mx-1">
              <span className="absolute inset-0 bg-primary/20 -skew-x-12 border-l-2 border-primary"></span>
              <span className="relative text-primary italic uppercase tracking-widest font-black">Emails</span>
            </span>
          </p>
          <p className="mt-6 text-xs md:text-sm text-muted font-headline uppercase tracking-[0.4em] font-medium opacity-80 px-4">
            Automated Categorization // Instant Summaries // Alerts
          </p>
        </div>

        <div className="flex flex-col items-center justify-center space-y-4 mb-auto">
          <button
            onClick={() => window.location.href = `${VITE_BACKEND_URL}/auth/google`}
            className="btn-mastery-primary px-12 py-4 text-sm font-headline uppercase tracking-widest shadow-lg hover:shadow-primary/20 transition-all"
          >
            Get Started
          </button>
          <p className="text-muted font-mono text-[9px] uppercase tracking-[0.1em]">Secure sign-in with Google</p>
        </div>

        <footer className="mt-auto w-full pt-6 border-t border-border/20 flex justify-between items-center opacity-50">
          <p className="text-[10px] font-medium text-muted uppercase tracking-widest">© 2026 Arnab Chakraborty // EmailPro</p>
          <div className="flex space-x-6">
            <span className="text-[10px] font-medium text-muted uppercase tracking-widest">Privacy</span>
            <span className="text-[10px] font-medium text-muted uppercase tracking-widest">Terms</span>
          </div>
        </footer>
      </div>

      {/* Decorative Scanline */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-primary/5 to-transparent h-4 w-full animate-scanline"></div>
    </div>
  );
}
