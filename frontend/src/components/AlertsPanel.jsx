import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ClockIcon,
  BellIcon,
  ChevronRightIcon
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import axios from 'axios';

export default function AlertsPanel() {
  const [alertEmails, setAlertEmails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlertEmails = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/alerts/emails`, { withCredentials: true });
        setAlertEmails(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAlertEmails();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center font-mono text-xs text-muted animate-pulse">
        [POLLING_SYSTEM_ALERTS...]
      </div>
    );
  }

  return (
    <div className="space-y-12 font-sans">
      <header>
        <h2 className="text-2xl md:text-3xl font-black font-headline uppercase tracking-tight text-white"> Intelligence <span className="text-primary">Alerts</span></h2>
        <p className="text-muted font-mono text-[9px] md:text-[10px] mt-3 md:mt-4 uppercase tracking-[0.3em] flex items-center">
          <span className="w-1.5 h-1.5 bg-danger rounded-full mr-2" />
          {alertEmails.length} ACTIVE_EVENTS_LOGGED
        </p>
      </header>

      <div className="space-y-4">
        {alertEmails.length > 0 ? (
          alertEmails.map((alert) => {
            const isUrgent = alert.category === 'Urgent';
            const deadlineDate = new Date(alert.deadline);

            return (
              <div
                key={alert._id}
                className="group card-mastery p-0 flex flex-col md:flex-row items-stretch border-l-2 hover:border-l-primary transition-all overflow-hidden"
              >
                <div className={`w-2 flex-shrink-0 ${isUrgent ? 'bg-danger' : 'bg-warning'}`}></div>

                <div className="flex-1 p-4 flex flex-col md:flex-row md:items-center gap-6">
                  <div className={`w-10 h-10 flex items-center justify-center bg-surface border border-border flex-shrink-0 ${isUrgent ? 'text-danger' : 'text-warning'}`}>
                    {isUrgent ? <ExclamationTriangleIcon className="w-5 h-5" /> : <ClockIcon className="w-5 h-5" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-1.5">
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border ${isUrgent ? 'border-danger/30 text-danger bg-danger/5' : 'border-warning/30 text-warning bg-warning/5'}`}>
                        {alert.category}
                      </span>
                      <span className="text-muted text-[9px] font-mono">//</span>
                      <span className="text-slate-400 text-[9px] font-bold uppercase">{deadlineDate.toLocaleDateString()} // {deadlineDate.toLocaleTimeString()}</span>
                    </div>
                    <h3 className="text-base font-bold text-white mb-1 uppercase group-hover:text-primary transition-colors">{alert.subject}</h3>
                    <p className="text-sm text-muted font-medium italic">"{alert.summary}"</p>
                  </div>

                  <div className="flex flex-row md:flex-col items-center gap-3">
                    <span className="py-1.5 px-4 text-[9px] whitespace-nowrap text-muted border border-border bg-surface/50 font-mono uppercase tracking-widest">Pending</span>
                    <div className="md:opacity-0 group-hover:opacity-100 transition-opacity text-primary">
                      <ChevronRightIcon className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-20 text-center border border-dashed border-border">
            <BellIcon className="w-8 h-8 text-muted mx-auto mb-4" />
            <p className="text-xs font-mono uppercase text-muted">Status: Nominal. No alerts found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
