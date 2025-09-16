// src/components/AlertsPanel.jsx
import { 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  BellIcon,
  CalendarIcon,
  UserGroupIcon,
  DocumentTextIcon
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import axios from 'axios';

export default function AlertsPanel() {
  const [alertEmails, setAlertEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAlertEmails = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/alerts/emails`, { withCredentials: true });
        setAlertEmails(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAlertEmails();
  }, []);

  const getAlertConfig = (category) => {
    switch (category) {
      case 'Urgent':
        return {
          icon: ExclamationTriangleIcon,
          bgColor: 'bg-error-50',
          borderColor: 'border-error-200',
          iconColor: 'text-error-600',
          badgeColor: 'bg-error-100 text-error-800',
          buttonColor: 'bg-error-600 hover:bg-error-700'
        };
      case 'Important':
        return {
          icon: ClockIcon,
          bgColor: 'bg-warning-50',
          borderColor: 'border-warning-200',
          iconColor: 'text-warning-600',
          badgeColor: 'bg-warning-100 text-warning-800',
          buttonColor: 'bg-warning-600 hover:bg-warning-700'
        };
      case 'FYI':
        return {
          icon: InformationCircleIcon,
          bgColor: 'bg-primary-50',
          borderColor: 'border-primary-200',
          iconColor: 'text-primary-600',
          badgeColor: 'bg-primary-100 text-primary-800',
          buttonColor: 'bg-primary-600 hover:bg-primary-700'
        };
      default:
        return {
          icon: InformationCircleIcon,
          bgColor: 'bg-primary-50',
          borderColor: 'border-primary-200',
          iconColor: 'text-primary-600',
          badgeColor: 'bg-primary-100 text-primary-800',
          buttonColor: 'bg-primary-600 hover:bg-primary-700'
        };
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'deadline': return DocumentTextIcon;
      case 'meeting': return UserGroupIcon;
      case 'finance': return DocumentTextIcon;
      case 'system': return BellIcon;
      default: return CalendarIcon;
    }
  };

  const urgentCount = alertEmails.filter(alert => alert.category === 'Urgent').length;
  const importantCount = alertEmails.filter(alert => alert.category === 'Important').length;
  const fyiCount = alertEmails.filter(alert => alert.category === 'FYI').length;
  const totalCount = alertEmails.length;

  if (loading) {
    return <div className="text-center py-10">Loading alerts...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Alerts & Notifications</h1>
          <p className="text-secondary-500 mt-1">
            {urgentCount} urgent, {importantCount} important, {fyiCount} FYI alerts
          </p>
        </div>
        
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-error-100 rounded-xl flex items-center justify-center">
              <ExclamationTriangleIcon className="w-6 h-6 text-error-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-500">Urgent</p>
              <p className="text-2xl font-bold text-secondary-900">{urgentCount}</p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center">
              <ClockIcon className="w-6 h-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-500">Important</p>
              <p className="text-2xl font-bold text-secondary-900">
                {importantCount}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <InformationCircleIcon className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-500">FYI</p>
              <p className="text-2xl font-bold text-secondary-900">
                {fyiCount}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
              <CheckCircleIcon className="w-6 h-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-500">Total</p>
              <p className="text-2xl font-bold text-secondary-900">
                {totalCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-secondary-900">Recent Alerts</h2>
        <div className="space-y-4">
          {alertEmails.map((alert) => {
            const config = getAlertConfig(alert.category);
            const Icon = config.icon;
            const CategoryIcon = getCategoryIcon(alert.category);
            const oneLineSummary = alert.summary;
            const deadlineDate = new Date(alert.deadline);
            const isDeadlineToday = deadlineDate.toDateString() === new Date().toDateString();
            const isDeadlineTomorrow = deadlineDate.toDateString() === new Date(new Date().setDate(new Date().getDate() + 1)).toDateString();

            const deadlineColorClass = isDeadlineToday ? 'text-red-600 font-semibold' : isDeadlineTomorrow ? 'text-orange-600 font-medium' : 'text-secondary-500';
            const deadlineText = isDeadlineToday ? `Today, ${deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : isDeadlineTomorrow ? `Tomorrow, ${deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : deadlineDate.toLocaleDateString();
            
            return (
              <div
                key={alert._id}
                className={`card p-6 border-l-4 ${config.borderColor} ${config.bgColor}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 ${config.bgColor} rounded-xl flex items-center justify-center border ${config.borderColor}`}>
                      <Icon className={`w-6 h-6 ${config.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-lg text-secondary-900">{alert.subject}</h3>
                        <span className={`badge ${config.badgeColor}`}>
                          {alert.category}
                        </span>
                      </div>
                      <p className="text-secondary-700 mb-3">{oneLineSummary}</p>
                      <div className="flex items-center space-x-4 text-sm text-secondary-500">
                        <div className="flex items-center space-x-1">
                          <CategoryIcon className="w-4 h-4" />
                          <span className="capitalize">{alert.category}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <ClockIcon className="w-4 h-4" />
                          <span className={deadlineColorClass}>{deadlineText}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button className={`btn text-white ${config.buttonColor}`}>
                    View Email
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
