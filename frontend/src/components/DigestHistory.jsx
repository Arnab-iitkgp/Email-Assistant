import {
  DocumentTextIcon,
  SparklesIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon
} from "@heroicons/react/24/outline";
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function DigestHistory() {
  const [digests, setDigests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDigests = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/digests`, { withCredentials: true });
        setDigests(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDigests();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center font-mono text-xs text-muted animate-pulse">
        [ARCHIVE_RETRIEVAL_IN_PROGRESS...]
      </div>
    );
  }

  return (
    <div className="space-y-12 font-sans">
      <header>
        <h2 className="text-2xl md:text-3xl font-black font-headline uppercase tracking-tight text-white"> Neural <span className="text-primary">Archive</span></h2>
        <p className="text-muted font-mono text-[9px] md:text-[10px] mt-3 md:mt-4 uppercase tracking-[0.3em] flex items-center">
          <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2" />
          {digests.length} REPORTS_INDEXED
        </p>
      </header>

      {digests.length > 0 ? (
        <div className="space-y-8">
          {digests.map((digest, idx) => (
            <div key={`${digest._id}-${idx}`} className="group card-mastery p-0 border-l-2 border-l-primary hover:border-primary/50 overflow-hidden flex flex-col md:flex-row">
              <div className="p-5 md:p-8 flex-1">
                <div className="flex items-center space-x-4 mb-6">
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-white uppercase tracking-tight">
                      Report // {new Date(digest.date).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                    </h3>
                  </div>
                </div>

                <div className="bg-background/80 p-4 md:p-6 border border-border font-mono text-[11px] md:text-xs text-slate-400 leading-relaxed mb-6">
                  <p className="text-primary font-bold mb-4">LOG_START:</p>
                  <p className="text-white font-bold mb-4">{digest.greeting}</p>
                  <div dangerouslySetInnerHTML={{ __html: digest.digestText.replace(/\n/g, '<br/>') }}></div>
                  <p className="text-primary font-bold mt-4">LOG_END.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 md:gap-4">
                  <span className="text-[9px] md:text-[10px] font-bold text-success uppercase">Status: Delivered</span>
                  <span className="text-muted text-[9px] md:text-[10px] font-mono hidden md:block">//</span>
                  <span className="text-[9px] md:text-[10px] font-bold text-muted uppercase tracking-tighter italic whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px] md:max-w-xs">{digest.signature}</span>
                </div>
              </div>

              <div className="w-full md:w-16 border-t md:border-t-0 md:border-l border-border bg-background/30 flex md:flex-col items-center justify-around md:justify-center py-3 md:py-4 md:gap-4">
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center border border-dashed border-border">
          <DocumentTextIcon className="w-8 h-8 text-muted mx-auto mb-4" />
          <p className="text-xs font-mono uppercase text-muted">Archive empty. No logs found.</p>
        </div>
      )}
    </div>
  );
}