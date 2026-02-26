import { useNavigate } from "react-router-dom";
import {
  InboxIcon,
  BellIcon,
  ClockIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  BoltIcon
} from "@heroicons/react/24/outline";
import { useLocation, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/me`, { withCredentials: true });
        setUser(res.data);
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/logout`, {}, { withCredentials: true });
      navigate('/');
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const menuItems = [
    { path: '/dashboard', icon: InboxIcon, label: 'Inbox' },
    { path: '/dashboard/alerts', icon: BellIcon, label: 'Alerts' },
    { path: '/dashboard/digest', icon: ClockIcon, label: 'Digest' },
    { path: '/dashboard/settings', icon: Cog6ToothIcon, label: 'Settings' }
  ];

  return (
    <div className={`fixed left-0 top-0 h-full w-64 bg-surface border-r border-border flex flex-col py-8 z-[50] font-sans transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Mobile Close Button */}
      <button
        onClick={onClose}
        className="lg:hidden absolute right-4 top-8 p-2 text-muted hover:text-white"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* App Logo */}
      <div className="px-8 mb-12 flex items-center">
        <h1 className="text-2xl font-black font-headline uppercase tracking-[-0.05em] text-white">
          <span className="text-primary">E</span>mailPro
        </h1>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => { if (window.innerWidth < 1024) onClose(); }}
              className={`flex items-center space-x-4 px-4 py-3 transition-all duration-200 ${isActive ? 'bg-primary text-white font-bold' : 'text-muted hover:text-white hover:bg-white/5 font-medium'
                }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-[10px] font-headline font-bold uppercase tracking-[0.2em]">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile - Premium Integrated Design */}
      <div className="mt-auto px-6 py-6 border-t border-border/50 bg-background/20">
        <div className="flex items-center space-x-4 mb-6 group/profile cursor-default">
          <div className="relative">
            {user?.picture ? (
              <img src={user.picture} alt={user.name} className="w-12 h-12 rounded-none border-2 border-primary/30 group-hover/profile:border-primary transition-all duration-500 p-0.5 object-cover" />
            ) : (
              <div className="w-12 h-12 bg-surface border-2 border-border flex items-center justify-center text-primary font-bold font-headline select-none">
                {user?.name?.[0] || "?"}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <p className="text-[10px] font-black text-white uppercase truncate tracking-tight">{user?.name || "AUTHENTICATING..."}</p>
            </div>
            <p className="text-[9px] text-muted truncate mt-0.5 lowercase font-medium">{user?.email || "session@active"}</p>
            <div className="flex items-center mt-2 space-x-2">
              <span className="w-1 h-1 bg-primary/50" />
              <p className="text-[8px] font-mono text-muted uppercase tracking-widest truncate">SYSTEM_ACTIVE</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between px-4 py-3 bg-surface border border-border hover:border-danger/50 hover:bg-danger/5 text-muted hover:text-danger transition-all group/logout"
        >
          <span className="text-[9px] font-black uppercase tracking-[0.2em]">Terminate Session</span>
          <ArrowRightOnRectangleIcon className="w-4 h-4 group-hover/logout:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
