import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import EmailCard from "./EmailCard";
import DOMPurify from 'dompurify';
import {
  EnvelopeIcon,
  ExclamationTriangleIcon,
  StarIcon,
  InformationCircleIcon,
  XMarkIcon,
  ArrowPathIcon,
  ArchiveBoxIcon
} from "@heroicons/react/24/outline";

export default function Inbox() {
  const navigate = useNavigate();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [user, setUser] = useState(null);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/emails/today`,
        { withCredentials: true }
      );
      setEmails(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/me`, { withCredentials: true });
        setUser(res.data);
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    };
    fetchUser();
    fetchEmails();
  }, []);

  const stats = [
    { label: "All Items", id: "all", count: emails.length, icon: EnvelopeIcon, color: 'text-white' },
    { label: "Urgent Attention", id: "urgent", count: emails.filter(e => e.category?.toLowerCase() === 'urgent').length, icon: ExclamationTriangleIcon, color: 'text-danger' },
    { label: "Important", id: "important", count: emails.filter(e => e.category?.toLowerCase() === 'important').length, icon: StarIcon, color: 'text-warning' },
    { label: "FYI & Updates", id: "fyi", count: emails.filter(e => e.category?.toLowerCase() === 'fyi').length, icon: InformationCircleIcon, color: 'text-primary' },
    { label: "Spam Blocked", id: "spam", count: emails.filter(e => e.category?.toLowerCase() === 'spam').length, icon: ArchiveBoxIcon, color: 'text-muted' },
  ];

  const filteredEmails = emails.filter((email) => {
    return selectedCategory === "all" || email.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  const emailBlobUrl = useMemo(() => {
    if (!selectedEmail?.body) return null;

    const clean = DOMPurify.sanitize(selectedEmail.body, {
      ADD_TAGS: ['style', 'iframe', 'meta', 'link'],
      ADD_ATTR: ['target', 'srcset', 'sizes', 'rel', 'href'],
      WHOLE_DOCUMENT: true
    });

    let finalContent = clean;
    if (!clean.toLowerCase().includes('<html')) {
      finalContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                padding: 40px;
                margin: 0;
                background-color: #fff;
                white-space: pre-wrap;
                word-wrap: break-word;
                overflow-wrap: break-word;
              }
              img { max-width: 100% !important; height: auto !important; }
              a { color: #0066FF; text-decoration: underline; word-break: break-all; }
            </style>
          </head>
          <body>${clean}</body>
        </html>
      `;
    }

    const blob = new Blob([finalContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    return url;
  }, [selectedEmail]);

  useEffect(() => {
    return () => {
      if (emailBlobUrl) URL.revokeObjectURL(emailBlobUrl);
    };
  }, [emailBlobUrl]);

  return (
    <div className="space-y-12 font-sans">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl md:text-4xl font-black font-headline uppercase tracking-tight text-white leading-none">
            Hi <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">{user?.name?.split(' ')[0] || 'there'}</span>,
          </h2>
          <p className="text-[9px] md:text-[10px] font-mono text-muted uppercase tracking-[0.3em] mt-3 md:mt-4 flex items-center">
            Neural Workspace Synchronization Active
          </p>
        </div>
        <button onClick={fetchEmails} className="w-full md:w-auto p-3 bg-surface border border-border hover:border-primary/50 transition-all flex items-center justify-center space-x-3 group">
          <span className="text-[9px] font-bold font-headline uppercase text-muted group-hover:text-primary transition-colors tracking-widest">Refresh Buffer</span>
          <ArrowPathIcon className={`w-4 h-4 text-muted group-hover:text-primary ${loading ? 'animate-spin text-primary' : ''}`} />
        </button>
      </header>

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {stats.map((stat) => (
          <button
            key={stat.id}
            onClick={() => setSelectedCategory(selectedCategory === stat.id ? 'all' : stat.id)}
            className={`flex flex-col items-start justify-between p-6 bg-surface border transition-all duration-500 text-left relative group overflow-hidden ${selectedCategory === stat.id
              ? `border-${stat.id === 'urgent' ? 'danger' : stat.id === 'important' ? 'warning' : stat.id === 'all' ? 'white' : 'primary'} ring-1 ring-${stat.id === 'urgent' ? 'danger' : stat.id === 'important' ? 'warning' : stat.id === 'all' ? 'white' : 'primary'}/20 shadow-glow`
              : 'border-border hover:border-primary/30'
              }`}
          >
            {selectedCategory === stat.id && (
              <div className={`absolute inset-0 opacity-[0.05] bg-${stat.id === 'urgent' ? 'danger' : stat.id === 'important' ? 'warning' : stat.id === 'all' ? 'white' : 'primary'}`} />
            )}

            <div className="relative z-10 w-full">
              <div className="flex items-center justify-between mb-6">
                <p className={`text-[9px] font-bold font-headline uppercase tracking-[0.3em] transition-colors ${selectedCategory === stat.id ? stat.color : 'text-muted'
                  }`}>
                  {stat.label}
                </p>
                <stat.icon className={`w-4 h-4 transition-all duration-300 ${selectedCategory === stat.id ? stat.color : 'text-muted opacity-20'
                  }`} />
              </div>
              <p className="text-6xl font-bold font-headline text-white tracking-tighter tabular-nums leading-none">
                {stat.count}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Action Zone Header */}
      <div className="flex items-center border-b border-border pb-6">
        <h3 className="text-[10px] font-bold font-headline uppercase tracking-[0.4em] text-white border-l-2 border-primary pl-6">
          {selectedCategory === 'all' ? 'Universal Logic Feed' : `${selectedCategory} focus`}
        </h3>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-24 text-center font-mono text-[10px] text-muted animate-pulse uppercase tracking-widest">
            [SYNCHRONIZING_MESSAGES...]
          </div>
        ) : filteredEmails.length > 0 ? (
          filteredEmails.map((email) => (
            <EmailCard
              key={email._id}
              email={email}
              onShowEmail={setSelectedEmail}
            />
          ))
        ) : (
          <div className="py-32 text-center bg-surface/10 border border-dashed border-border">
            <EnvelopeIcon className="w-12 h-12 text-muted mx-auto mb-6 opacity-20" />
            <p className="text-[10px] font-mono uppercase text-muted tracking-widest">Neural buffer is empty.</p>
          </div>
        )}
      </div>

      {selectedEmail && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-md z-[100] flex items-center justify-center p-6 lg:p-24">
          <div className="bg-surface border border-border w-full max-w-5xl h-full flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-background/30 flex justify-between items-center">
              <div className="flex items-center space-x-6 min-w-0">
                <div className="flex items-center space-x-3 flex-shrink-0">
                  <div className="w-8 h-8 bg-primary flex items-center justify-center font-black text-white text-sm">
                    {selectedEmail.sender[0]}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-wider truncate max-w-[200px]">{selectedEmail.sender.split(' <')[0]}</p>
                    <p className="text-[9px] text-muted uppercase tracking-[0.2em]">{selectedEmail.category}</p>
                  </div>
                </div>
                <div className="h-4 w-px bg-border hidden md:block" />
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white leading-tight uppercase tracking-tight truncate">
                    {selectedEmail.subject}
                  </h3>
                  <p className="text-[8px] font-mono text-muted uppercase tracking-widest mt-0.5">
                    ID: {selectedEmail._id.slice(-6).toUpperCase()} // {new Date(selectedEmail.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmail(null)}
                className="p-2 bg-surface border border-border hover:border-danger hover:text-danger transition-all ml-4 flex-shrink-0"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 bg-white overflow-hidden relative">
              {emailBlobUrl ? (
                <iframe
                  title="Email Content"
                  className="w-full h-full border-none"
                  src={emailBlobUrl}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted font-mono text-xs uppercase animate-pulse">
                  [CONTENT_UNAVAILABLE]
                </div>
              )}
            </div>
            <div className="px-6 py-3 border-t border-border bg-background/30 flex justify-end space-x-3">
              <button className="btn-mastery-outline px-6 py-1.5 text-[9px]" onClick={() => setSelectedEmail(null)}>Close Session</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
