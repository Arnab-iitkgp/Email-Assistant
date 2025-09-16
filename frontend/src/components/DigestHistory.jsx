// src/components/DigestHistory.jsx
import { 
  ClockIcon,
  DocumentTextIcon,
  CalendarIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  ShareIcon
} from "@heroicons/react/24/outline";
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function DigestHistory() {
  const [digests, setDigests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDigests = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/digests`, { withCredentials: true });
        setDigests(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDigests();
  }, []);

  const formatDigestDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date.getTime() >= today.getTime()) {
      return 'Today';
    } else if (date.getTime() >= yesterday.getTime()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading digest history...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">Error: {error.message}. Please ensure you are logged in.</div>;
  }

  // Check if there are no digests after loading
  const hasDigests = digests.length > 0;

  if (!hasDigests) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900">Digest History</h1>
            <p className="text-secondary-500 mt-1">View your past email summaries and digests</p>
          </div>
          
        </div>

        {/* Empty State */}
        <div className="card p-12 text-center">
          <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <DocumentTextIcon className="w-12 h-12 text-primary-600" />
          </div>
          <h2 className="text-2xl font-semibold text-secondary-900 mb-3">No Digests Yet</h2>
          <p className="text-secondary-500 mb-8 max-w-md mx-auto">
            Your email digests will appear here once they're generated. 
            Set up your digest schedule in settings to get started.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn-primary">
              <CalendarIcon className="w-4 h-4 mr-2" />
              Schedule Digest
            </button>
            <button className="btn-outline">
              <DocumentTextIcon className="w-4 h-4 mr-2" />
              View Settings
            </button>
          </div>
        </div>

        {/* Help Section */}
        <div className="card p-8">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">How Email Digests Work</h3>
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-3">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <ClockIcon className="w-6 h-6 text-primary-600" />
              </div>
              <h4 className="font-medium text-secondary-900 mb-2">Scheduled Delivery</h4>
              <p className="text-sm text-secondary-500">
                Digests are automatically generated and delivered at your preferred time
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <DocumentTextIcon className="w-6 h-6 text-success-600" />
              </div>
              <h4 className="font-medium text-secondary-900 mb-2">Smart Summaries</h4>
              <p className="text-sm text-secondary-500">
                AI-powered summaries of your emails with key insights and action items
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <ArrowDownTrayIcon className="w-6 h-6 text-warning-600" />
              </div>
              <h4 className="font-medium text-secondary-900 mb-2">Easy Access</h4>
              <p className="text-sm text-secondary-500">
                Download, share, or view digests anytime from your dashboard
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Digest History</h1>
          <p className="text-secondary-500 mt-1">
            {digests.length} digests generated
          </p>
        </div>
       
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <DocumentTextIcon className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-500">Total Digests</p>
              <p className="text-2xl font-bold text-secondary-900">{digests.length}</p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
              <CalendarIcon className="w-6 h-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-500">This Month</p>
              <p className="text-2xl font-bold text-secondary-900">{digests.length}</p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center">
              <ClockIcon className="w-6 h-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-500">Last Generated</p>
              <p className="text-2xl font-bold text-secondary-900">2 days ago</p>
            </div>
          </div>
        </div>
      </div>

      {/* Digest List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-secondary-900">Recent Digests</h2>
        <div className="space-y-6">
          {digests.map((digest) => (
            <div key={digest._id} className="card p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <DocumentTextIcon className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl text-secondary-900">{formatDigestDate(digest.date)}</h3>
                    <div className="flex items-center space-x-4 text-sm text-secondary-500 mt-1">
                      <div className="flex items-center space-x-1">
                        <CalendarIcon className="w-4 h-4" />
                        <span>{new Date(digest.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DocumentTextIcon className="w-4 h-4" />
                        <span>{digest.emailCount || 0} emails</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <ClockIcon className="w-4 h-4" />
                        <span>{digest.alertCount || 0} alerts</span>
                      </div>
                    </div>
                  </div>
                </div>
                <span className="badge badge-success">Delivered</span>
              </div>

              {/* Digest Content */}
              <div className="bg-secondary-50 rounded-xl p-6 mb-6">
                <div className="space-y-4">
                  <p className="text-secondary-700 text-lg">{digest.greeting}</p>
                  
                  <div className="space-y-2">
                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: digest.digestText.replace(/\n/g, '<br/>') }}></div>
                  </div>
                  
                  <div className="pt-4 border-t border-secondary-200">
                    <p className="text-secondary-700 mb-2">{digest.closing}</p>
                    <p className="text-sm text-secondary-500 italic">{digest.signature}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button className="btn-outline">
                    <EyeIcon className="w-4 h-4 mr-2" />
                    View Full
                  </button>
                  <button className="btn-outline">
                    <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                    Download
                  </button>
                  <button className="btn-outline">
                    <ShareIcon className="w-4 h-4 mr-2" />
                    Share
                  </button>
                </div>
                <div className="text-sm text-secondary-400">
                  Generated automatically
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}