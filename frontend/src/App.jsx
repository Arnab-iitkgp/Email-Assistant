import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Inbox from './components/Inbox';
import DigestHistory from './components/DigestHistory';
import AlertsPanel from './components/AlertsPanel';
import Settings from './components/Settings';
import LandingPage from './components/LandingPage';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { BellIcon, ClockIcon } from "@heroicons/react/24/outline";

const ProtectedRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/emails/today`, { withCredentials: true });
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-primary font-mono animate-pulse">
        [INITIALIZING_SYSTEM...]
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
};

const DashboardLayout = () => {
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchDeadlines = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/alerts/emails`, { withCredentials: true });
        setDeadlines(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error("Error fetching deadlines:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDeadlines();

    // Auto-refresh deadlines every 5 minutes
    const intervalId = setInterval(fetchDeadlines, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex bg-background h-screen font-sans selection:bg-primary/30 scrollbar-mastery relative overflow-hidden">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[45] lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar with Mobile Toggle */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex-1 lg:pl-64 flex flex-col items-stretch transition-all duration-300 w-full min-w-0 h-full overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-surface/50 backdrop-blur-md flex-shrink-0 z-40">
          <h1 className="text-xl font-black font-headline uppercase tracking-tighter text-white">
            <span className="text-primary">E</span>mailPro
          </h1>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 bg-surface border border-border text-white hover:border-primary transition-all"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden h-full">
          {/* Main Workspace - Independent Scroll */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-14 scrollbar-mastery h-full">
            <div className="max-w-5xl mx-auto w-full">
              <Outlet />
            </div>
          </div>

          {/* Supplemental Info Panel (Right Sidebar) - Independent Scroll */}
          <aside className="w-80 border-l border-border bg-surface/50 hidden xl:flex flex-col h-full overflow-y-auto scrollbar-mastery">
            <div className="p-8 space-y-10">
              <section>
                <h4 className="relative text-sm font-bold skew-x-[-10deg] uppercase tracking-tighter text-white mb-8 flex items-center group">
                  <span className="absolute -left-2 top-0 text-primary opacity-50 blur-[2px] select-none group-hover:opacity-100 transition-opacity">Active Deadlines</span>
                  <span className="relative z-10 underline decoration-primary decoration-4 underline-offset-4">Active Deadlines</span>
                </h4>
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-[10px] font-mono text-muted animate-pulse">POLLING_DEADLINES...</div>
                  ) : deadlines.length > 0 ? (
                    deadlines.slice(0, 5).map((d, idx) => (
                      <div key={`${d._id}-${idx}`} className={`group bg-surface border-l-2 p-3 border-y border-r border-border transition-all hover:bg-white/5 relative overflow-hidden cursor-help ${d.category === 'Urgent' ? 'border-l-danger' : 'border-l-primary'}`}>
                        <p className={`text-[9px] font-bold uppercase mb-1 ${d.category === 'Urgent' ? 'text-danger' : 'text-primary'}`}>
                          {new Date(d.deadline).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric' })}
                        </p>
                        <h5 className="text-xs font-bold text-white leading-tight uppercase tracking-tight truncate group-hover:whitespace-normal group-hover:overflow-visible mb-0 transition-all">
                          {d.subject}
                        </h5>
                                                                                                                                                                                                                                                                                                                                          
                        {/* Hover Summary Reveal - High Contrast */}
                        <div className="max-h-0 opacity-0 group-hover:max-h-96 group-hover:opacity-100 overflow-hidden transition-all duration-300 ease-in-out">
                          <div className="mt-2 border-t border-border/30 pt-2">
                            <p className="text-[10px] font-bold uppercase text-primary tracking-widest mb-1">AI Intelligence Summary</p>
                            <p className="text-[11px] text-white/90 leading-relaxed italic">
                              {d.summary || "Analyzing payload content..."}
                            </p>
                          </div>
                        </div>

                        <p className="text-[9px] text-muted mt-2 font-mono uppercase tracking-widest opacity-60">Due {new Date(d.deadline).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted font-mono uppercase italic">Zero active deadlines.</p>
                  )}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-[10px] font-bold font-headline uppercase tracking-[0.3em] text-muted flex items-center">
                    <ClockIcon className="w-3.5 h-3.5 mr-2 text-primary" />
                    Calendar
                  </h4>
                  <div className="flex flex-col items-end">
                    <span className="text-[11px] font-mono text-white font-black tracking-widest leading-none">
                      {currentTime.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className="text-[8px] font-mono text-primary font-bold uppercase mt-1">
                      {currentTime.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                <div className="bg-surface/30 border border-border p-4 relative overflow-hidden group/cal">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 -mr-12 -mt-12 rotate-45 pointer-events-none group-hover/cal:bg-primary/20 transition-all duration-700" />
                  <div className="absolute bottom-0 left-0 w-16 h-16 bg-primary/5 -ml-8 -mb-8 rotate-12 pointer-events-none group-hover/cal:bg-primary/10 transition-all duration-500" />
                  <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                      <span key={`${day}-${idx}`} className="text-[8px] font-mono text-muted font-bold">{day}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {(() => {
                      // Build a map of day-of-month → deadline info for the current month
                      const istOffset = 5.5 * 60 * 60 * 1000;
                      const nowUTC = new Date();
                      const istNow = new Date(nowUTC.getTime() + istOffset);
                      const currentYear = istNow.getFullYear();
                      const currentMonth = istNow.getMonth();
                      const today = istNow.getDate();

                      const firstDay = new Date(currentYear, currentMonth, 1).getDay();
                      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

                      // Map each deadline to its IST day-of-month
                      const deadlineDayMap = {};
                      deadlines.forEach((d) => {
                        const dlDate = new Date(new Date(d.deadline).getTime() + istOffset);
                        if (dlDate.getFullYear() === currentYear && dlDate.getMonth() === currentMonth) {
                          const dayNum = dlDate.getDate();
                          if (!deadlineDayMap[dayNum]) {
                            deadlineDayMap[dayNum] = { count: 0, hasUrgent: false };
                          }
                          deadlineDayMap[dayNum].count++;
                          if (d.category === 'Urgent') {
                            deadlineDayMap[dayNum].hasUrgent = true;
                          }
                        }
                      });

                      return [
                        ...Array(firstDay).fill(null),
                        ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
                      ].map((day, i) => {
                        const dlInfo = day ? deadlineDayMap[day] : null;
                        const isToday = day === today;

                        return (
                          <div
                            key={i}
                            className={`
                              h-7 flex flex-col items-center justify-center text-[9px] font-mono transition-all relative
                              ${isToday ? 'bg-primary text-white font-bold shadow-glow-sm' : day ? 'text-slate-400 hover:bg-white/5' : ''}
                              ${day ? 'border border-transparent' : ''}
                              ${dlInfo && !isToday ? 'bg-white/5' : ''}
                            `}
                            title={dlInfo ? `${dlInfo.count} deadline${dlInfo.count > 1 ? 's' : ''} on this day` : ''}
                          >
                            {day}
                            {dlInfo && (
                              <div className="flex items-center gap-[2px] mt-[1px]">
                                <span className={`w-1 h-1 rounded-full ${dlInfo.hasUrgent ? 'bg-danger' : isToday ? 'bg-white' : 'bg-primary'}`} />
                                {dlInfo.count > 1 && (
                                  <span className={`w-1 h-1 rounded-full ${isToday ? 'bg-white/60' : 'bg-primary/60'}`} />
                                )}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/30 flex items-center justify-between">
                    <p className="text-[8px] font-mono text-muted uppercase tracking-widest">{Object.keys(
                      deadlines.reduce((acc, d) => {
                        const istOffset = 5.5 * 60 * 60 * 1000;
                        const dlDate = new Date(new Date(d.deadline).getTime() + istOffset);
                        const nowIST = new Date(Date.now() + istOffset);
                        if (dlDate.getFullYear() === nowIST.getFullYear() && dlDate.getMonth() === nowIST.getMonth()) {
                          acc[dlDate.getDate()] = true;
                        }
                        return acc;
                      }, {})
                    ).length} days with deadlines</p>
                    <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                  </div>
                </div>
              </section>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Inbox />} />
          <Route path="/dashboard/alerts" element={<AlertsPanel />} />
          <Route path="/dashboard/digest" element={<DigestHistory />} />
          <Route path="/dashboard/settings" element={<Settings />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
