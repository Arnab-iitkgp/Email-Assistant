// src/components/Sidebar.jsx
import { useState } from "react";
import { 
  Bars3Icon, 
  XMarkIcon,
  InboxIcon,
  BellIcon,
  ClockIcon,
  Cog6ToothIcon,
  EnvelopeIcon
} from "@heroicons/react/24/outline";

export default function Sidebar({ setView, currentView }) {
  const [open, setOpen] = useState(false); // mobile sidebar toggle
  
  const menuItems = [
    { 
      id: 'inbox', 
      label: 'Inbox', 
      icon: InboxIcon,
      description: 'View your emails'
    },
    { 
      id: 'alerts', 
      label: 'Alerts', 
      icon: BellIcon,
      description: 'Important notifications'
    },
    { 
      id: 'digest', 
      label: 'Digest History', 
      icon: ClockIcon,
      description: 'Past summaries'
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Cog6ToothIcon,
      description: 'App preferences'
    }
  ];

  const handleItemClick = (itemId) => {
    setView(itemId);
    setOpen(false);
  };

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between bg-white border-b border-secondary-200 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <EnvelopeIcon className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-secondary-900">Email Dashboard</h1>
        </div>
        <button 
          onClick={() => setOpen(!open)}
          className="p-2 rounded-xl hover:bg-secondary-100 transition-colors"
        >
          {open ? <XMarkIcon className="h-6 w-6 text-secondary-600" /> : <Bars3Icon className="h-6 w-6 text-secondary-600" />}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white border-r border-secondary-200 transform lg:translate-x-0 transition-transform duration-300 ease-in-out z-50
        ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-8 border-b border-secondary-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                <EnvelopeIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-secondary-900">Email Dashboard</h2>
                <p className="text-sm text-secondary-500">Smart email management</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6">
            <div className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group ${
                      isActive 
                        ? 'bg-primary-50 text-primary-700 border border-primary-200' 
                        : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-secondary-400 group-hover:text-secondary-600'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{item.label}</div>
                      <div className={`text-xs ${isActive ? 'text-primary-500' : 'text-secondary-400'}`}>
                        {item.description}
                      </div>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-secondary-100">
            <div className="text-xs text-secondary-400 text-center">
              Version 1.0.0
            </div>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden" 
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
