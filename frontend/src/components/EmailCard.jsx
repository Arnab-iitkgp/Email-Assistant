// src/components/EmailCard.jsx
import {
  PaperClipIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";

export default function EmailCard({
  email,
  onShowEmail
}) {
  const { sender, subject, body, timestamp, category, read, attachments } = email;
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-error-600 bg-error-50 border-error-200';
      case 'medium': return 'text-warning-600 bg-warning-50 border-warning-200';
      case 'low': return 'text-success-600 bg-success-50 border-success-200';
      default: return 'text-secondary-600 bg-secondary-50 border-secondary-200';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'medium': return <ClockIcon className="w-4 h-4" />;
      case 'low': return <CheckIcon className="w-4 h-4" />;
      default: return <ClockIcon className="w-4 h-4" />;
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getCategoryConfig = (category) => {
    switch (category) {
      case 'Urgent':
        return { color: 'bg-error-100 text-error-800', label: 'Urgent' };
      case 'Important':
        return { color: 'bg-primary-100 text-primary-800', label: 'Important' };
      case 'FYI':
        return { color: 'bg-secondary-100 text-secondary-800', label: 'FYI' };
      case 'Spam':
        return { color: 'bg-warning-100 text-warning-800', label: 'Spam' };
      default:
        return { color: 'bg-secondary-100 text-secondary-800', label: 'Unknown' };
    }
  };

  return (
    <div className={`card-hover p-6 border-l-4 ${!read ? 'border-l-primary-500' : 'border-l-secondary-200'}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {getInitials(sender)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-lg leading-tight ${!read ? 'text-secondary-900' : 'text-secondary-700'} line-clamp-2`} title={subject}>
              {subject}
            </h3>
            <p className="text-sm text-secondary-500 truncate" title={sender}>
              {sender}
            </p>
            {email.senderEmail && (
              <p className="text-xs text-secondary-400 truncate" title={email.senderEmail}>
                {email.senderEmail}
              </p>
            )}
          </div>
        </div>
        <button className="p-2 hover:bg-secondary-100 rounded-lg transition-colors flex-shrink-0">
          <EllipsisVerticalIcon className="w-5 h-5 text-secondary-400" />
        </button>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className={`text-sm leading-relaxed line-clamp-3 ${!read ? 'text-secondary-800' : 'text-secondary-600'}`}>
          {email.summary || email.body || 'Summary not available'}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Category Tag */}
          <div className={`badge ${getCategoryConfig(category).color}`}>
            {getCategoryConfig(category).label}
          </div>

          {/* Priority Badge */}
          <div className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border ${getPriorityColor(email.priority)}`}>
            {getPriorityIcon(email.priority)}
            <span className="ml-1 capitalize">{email.priority}</span>
          </div>

          {/* Attachments */}
          {attachments > 0 && (
            <div className="flex items-center text-xs text-secondary-500">
              <PaperClipIcon className="w-3 h-3 mr-1" />
              {attachments} attachment{attachments > 1 ? 's' : ''}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onShowEmail(email)}
            className="btn-secondary btn-sm"
          >
            Show Email
          </button>
          <span className="text-xs text-secondary-400">{new Date(timestamp).toLocaleString()}</span>
          {!read && (
            <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
          )}
        </div>
      </div>
    </div>
  );
}
