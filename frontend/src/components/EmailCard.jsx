import {
  SparklesIcon,
  ChevronRightIcon,
  PaperClipIcon
} from "@heroicons/react/24/outline";

export default function EmailCard({ email, onShowEmail }) {
  const { sender, subject, summary, timestamp, category, attachments } = email;

  const getCategoryColor = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'urgent': return 'border-danger text-danger';
      case 'important': return 'border-warning text-warning';
      case 'fyi': return 'border-primary text-primary';
      case 'spam': return 'border-muted text-muted opacity-60';
      default: return 'border-muted text-muted';
    }
  };

  return (
    <div
      onClick={() => onShowEmail(email)}
      className="group bg-surface border border-border p-4 hover:border-primary/50 transition-all flex flex-col md:flex-row md:items-center gap-6 cursor-pointer relative overflow-hidden"
    >
      {/* Category Sidebar Marker */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${getCategoryColor(category).split(' ')[0].replace('border-', 'bg-')}`} />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-3 mb-1.5">
          <span className="text-[9px] font-mono text-muted uppercase tracking-wider">{new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <span className="text-muted text-[9px]">//</span>
          <span className="text-[9px] font-bold uppercase text-white truncate">{sender.split(' <')[0]}</span>
        </div>

        <h4 className="text-base font-bold text-white group-hover:text-primary transition-colors leading-tight mb-3 uppercase tracking-tight">
          {subject}
        </h4>

        {/* AI Insight Section - Reference style */}
        <div className="bg-background/80 border border-primary/20 p-3 flex items-start space-x-3">
          <SparklesIcon className="w-4 h-4 text-primary flex-shrink-0 animate-pulse" />
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold uppercase text-primary/80 tracking-widest mb-0.5">AI Intelligence Summary</p>
            <p className="text-[13px] text-slate-300 leading-relaxed">
              {summary || "Analyzing payload content..."}
            </p>
          </div>
        </div>
      </div>

      {/* Action Area */}
      <div className="flex flex-row md:flex-col items-center justify-between md:justify-center gap-3 flex-shrink-0 w-full md:w-[120px] mt-2 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-border/30">
        <div className="flex items-center space-x-3 text-muted">
          {attachments > 0 && <span className="flex items-center text-[9px] font-bold"><PaperClipIcon className="w-3 h-3 mr-1" /> {attachments}</span>}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onShowEmail(email); }}
          className="btn-mastery-outline px-4 py-2 md:py-1.5 text-[9px] w-full md:w-full"
        >
          View Content
        </button>
      </div>

      {/* Hover reveal icon */}
      <div className="absolute right-2 bottom-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRightIcon className="w-4 h-4" />
      </div>
    </div>
  );
}
