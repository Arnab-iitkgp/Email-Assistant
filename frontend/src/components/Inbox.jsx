// src/components/Inbox.jsx
import EmailCard from "./EmailCard";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  EyeSlashIcon,
  ArrowLeftOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import axios from "axios";

export default function Inbox({ setView }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmail, setSelectedEmail] = useState(null);

  const handleLogout = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/logout`,
        {},
        { withCredentials: true }
      );
      setView("landing"); // Redirect to landing page on successful logout
    } catch (error) {
      console.error("Logout failed:", error);
      // Optionally, show an error message to the user
    }
  };

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/emails/today`,
          { withCredentials: true }
        );
        console.log(response.data); // inspect data
        setEmails(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmails();
  }, []);

  const categories = [
    { id: "all", label: "All", icon: EnvelopeIcon, count: emails.length },
    {
      id: "urgent",
      label: "Urgent",
      icon: ExclamationTriangleIcon,
      count: emails.filter((e) => e.category === "Urgent").length,
    },
    {
      id: "important",
      label: "Important",
      icon: CheckCircleIcon,
      count: emails.filter((e) => e.category === "Important").length,
    },
    {
      id: "fyi",
      label: "FYI",
      icon: InformationCircleIcon,
      count: emails.filter((e) => e.category === "FYI").length,
    },
    {
      id: "spam",
      label: "Spam",
      icon: EyeSlashIcon,
      count: emails.filter((e) => e.category === "Spam").length,
    },
  ];

  const filteredEmails = emails.filter((email) => {
    const normalizedSelectedCategory =
      selectedCategory === "all"
        ? "all"
        : selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1);
    const matchesCategory =
      normalizedSelectedCategory === "all" ||
      email.category === normalizedSelectedCategory;
    const matchesSearch =
      email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.body.toLowerCase().includes(searchTerm.toLowerCase()); // Search body as well
    return matchesCategory && matchesSearch;
  });

  const unreadCount = filteredEmails.filter((email) => !email.read).length; // Assuming 'read' property exists
  const totalCount = filteredEmails.length;

  if (loading) {
    return <div className="text-center py-10">Loading emails...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-500">
        Error: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Inbox</h1>
          <p className="text-secondary-500 mt-1">
            {unreadCount} unread of {totalCount} emails
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={handleLogout} className="btn-outline">Logout</button>
        </div>
      </div>

      {/* Search Bar */}
      {/* <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-secondary-400" />
        </div>
        <input
          type="text"
          placeholder="Search emails..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input pl-12"
        />
      </div> */}

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const Icon = category.icon;
          const isActive = selectedCategory === category.id;

          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-primary-600 text-white shadow-medium"
                  : "bg-white text-secondary-600 border border-secondary-200 hover:bg-secondary-50 hover:border-secondary-300"
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {category.label}
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  isActive
                    ? "bg-primary-500 text-white"
                    : "bg-secondary-100 text-secondary-600"
                }`}
              >
                {category.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <EnvelopeIcon className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-500">
                Total Emails
              </p>
              <p className="text-2xl font-bold text-secondary-900">
                {totalCount}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center">
              <EnvelopeIcon className="w-6 h-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-500">Unread</p>
              <p className="text-2xl font-bold text-secondary-900">
                {unreadCount}
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
              <p className="text-sm font-medium text-secondary-500">Read</p>
              <p className="text-2xl font-bold text-secondary-900">
                {totalCount - unreadCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Email List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-secondary-900">
          {selectedCategory === "all"
            ? "Recent Emails"
            : `${
                categories.find((c) => c.id === selectedCategory)?.label
              } Emails`}
        </h2>
        {filteredEmails.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {filteredEmails.map((email) => (
              <EmailCard
                key={email._id}
                email={email}
                onShowEmail={setSelectedEmail}
              />
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <EnvelopeIcon className="w-8 h-8 text-secondary-400" />
            </div>
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              No emails found
            </h3>
            <p className="text-secondary-500">
              {searchTerm
                ? "Try adjusting your search terms"
                : "No emails in this category"}
            </p>
          </div>
        )}
      </div>
      {/* Email Detail Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-secondary-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setSelectedEmail(null)}
              className="absolute top-3 right-3 text-secondary-500 hover:text-secondary-700"
            >
              <PlusIcon className="w-6 h-6 rotate-45" />
            </button>
            <h2 className="text-2xl font-bold text-secondary-900 mb-4">
              Subject: {selectedEmail.subject}
            </h2>
            <p className="text-secondary-700 mb-2">
              <strong>From:</strong> {selectedEmail.sender}
            </p>
            <p className="text-secondary-700 mb-4">
              <strong>Time:</strong>{" "}
              {new Date(selectedEmail.timestamp).toLocaleString()}
            </p>
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}
