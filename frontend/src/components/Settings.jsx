// src/components/Settings.jsx
import { 
  Cog6ToothIcon,
  ClockIcon,
  PhoneIcon,
  BellIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  UserIcon,
  GlobeAltIcon,
  CheckIcon,
  PlayCircleIcon,
  PauseCircleIcon
} from "@heroicons/react/24/outline";

import { useState } from "react";

export default function Settings() {
  const [serviceRunning, setServiceRunning] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleService = async () => {
    setLoading(true);
    try {
      const action = serviceRunning ? "stop" : "start";
      const res = await fetch(`http://localhost:5000/scheduler/${action}`, {
        method: "POST",
      });
      if (res.ok) {
        setServiceRunning(!serviceRunning);
      } else {
        console.error("Failed to toggle service");
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-indigo-500 text-white p-4 rounded-lg shadow-md text-center mb-6">
        <h2 className="text-xl font-bold">More features are coming soon!</h2>
        <p className="text-indigo-200">Stay tuned for exciting updates to your settings.</p>
      </div>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-secondary-900">Settings</h1>
        <p className="text-secondary-500 mt-1">
          Manage your email dashboard preferences and notifications
        </p>
      </div>

      <div className="space-y-8">
        {/* Scheduler Service Control */}
        <div className="relative">
          <div className="absolute inset-0 bg-white bg-opacity-60 backdrop-filter backdrop-blur-sm rounded-xl z-10 pointer-events-none"></div>
          <div className="card p-8 opacity-60 pointer-events-none">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Cog6ToothIcon className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-secondary-900">
                  Scheduler Service
                </h2>
                <p className="text-secondary-500">
                  Start or pause the background scheduler
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-6 bg-secondary-50 rounded-xl">
              <div>
                <p className="font-medium text-secondary-900">
                  Status:{" "}
                  <span
                    className={
                      serviceRunning ? "text-green-600" : "text-red-600"
                    }
                  >
                    {serviceRunning ? "Running" : "Stopped"}
                  </span>
                </p>
                <p className="text-sm text-secondary-500">
                  {serviceRunning
                    ? "Emails and alerts are being processed."
                    : "Scheduler is currently paused."}
                </p>
              </div>
              <button
                onClick={toggleService}
                disabled={loading}
                className={`flex items-center px-5 py-2 rounded-lg font-medium text-white transition ${
                  serviceRunning
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                } ${loading && "opacity-50 cursor-not-allowed"}`}
              >
                {loading ? (
                  "Processing..."
                ) : serviceRunning ? (
                  <>
                    <PauseCircleIcon className="w-5 h-5 mr-2" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <PlayCircleIcon className="w-5 h-5 mr-2" />
                    Activate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="relative">
          <div className="absolute inset-0 bg-white bg-opacity-60 backdrop-filter backdrop-blur-sm rounded-xl z-10 pointer-events-none"></div>
          <div className="card p-8 opacity-60 pointer-events-none">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <BellIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-secondary-900">
                  Notification Settings
                </h2>
                <p className="text-secondary-500">
                  Manage how you receive alerts and digests.
                </p>
              </div>
            </div>
            {/* Notification content here */}
            <p className="text-secondary-400">Coming soon: Customize your notification preferences.</p>
          </div>
        </div>

        {/* Communication Preferences */}
        <div className="relative">
          <div className="absolute inset-0 bg-white bg-opacity-60 backdrop-filter backdrop-blur-sm rounded-xl z-10 pointer-events-none"></div>
          <div className="card p-8 opacity-60 pointer-events-none">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                <PhoneIcon className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-secondary-900">
                  Communication Preferences
                </h2>
                <p className="text-secondary-500">
                  Choose your preferred communication channels.
                </p>
              </div>
            </div>
            {/* Communication content here */}
            <p className="text-secondary-400">Coming soon: Set up WhatsApp, Telegram, and other communication channels.</p>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="relative">
          <div className="absolute inset-0 bg-white bg-opacity-60 backdrop-filter backdrop-blur-sm rounded-xl z-10 pointer-events-none"></div>
          <div className="card p-8 opacity-60 pointer-events-none">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <ShieldCheckIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-secondary-900">
                  Privacy Settings
                </h2>
                <p className="text-secondary-500">
                  Control your data and privacy options.
                </p>
              </div>
            </div>
            {/* Privacy content here */}
            <p className="text-secondary-400">Coming soon: Manage your data privacy and security settings.</p>
          </div>
        </div>

        {/* Account Settings */}
        <div className="relative">
          <div className="absolute inset-0 bg-white bg-opacity-60 backdrop-filter backdrop-blur-sm rounded-xl z-10 pointer-events-none"></div>
          <div className="card p-8 opacity-60 pointer-events-none">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-secondary-900">
                  Account Settings
                </h2>
                <p className="text-secondary-500">
                  Manage your profile and account information.
                </p>
              </div>
            </div>
            {/* Account content here */}
            <p className="text-secondary-400">Coming soon: Update your profile, email, and password.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
