import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import TripsPanel from './TripsPanel.jsx';
import SettingsPanel from './SettingsPanel.jsx';
import { Map, Settings } from 'lucide-react';

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activePanel, setActivePanel] = useState('trips');
  const [contextPanelOpen, setContextPanelOpen] = useState(true);

  const onTripRoute = location.pathname.startsWith('/trips/');

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'TT';

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* Icon rail — always visible */}
      <div className="flex flex-col items-center w-14 bg-zinc-900 shrink-0 py-3 gap-1">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mb-4 shrink-0">
          <span className="text-white text-xs font-bold">TT</span>
        </div>

        <NavItem
          icon={<Map size={18} />}
          active={activePanel === 'trips'}
          tooltip="My trips"
          onClick={() => {
            setActivePanel('trips');
            setContextPanelOpen(true);
          }}
        />
        <NavItem
          icon={<Settings size={18} />}
          active={activePanel === 'settings'}
          tooltip="Settings"
          onClick={() => {
            setActivePanel('settings');
            setContextPanelOpen(true);
          }}
        />

        <div className="flex-1" />

        <button
          onClick={logout}
          title="Sign out"
          className="w-8 h-8 rounded-full bg-zinc-700 hover:bg-zinc-600 flex items-center justify-center text-white text-xs font-medium transition-colors"
        >
          {initials}
        </button>
      </div>

      {/* Context panel */}
      {contextPanelOpen && (
        <div className="w-64 shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-hidden">
          {activePanel === 'trips' && (
            <TripsPanel onClose={onTripRoute ? () => navigate('/') : undefined} />
          )}
          {activePanel === 'settings' && (
            <SettingsPanel onClose={() => setContextPanelOpen(false)} />
          )}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 overflow-hidden">
        {children}
      </div>

    </div>
  );
}

function NavItem({ icon, active, tooltip, onClick }) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      className={`
        w-9 h-9 rounded-lg flex items-center justify-center transition-colors relative group
        ${active
          ? 'bg-zinc-700 text-white'
          : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
        }
      `}
    >
      {icon}
      <span className="
        absolute left-12 bg-zinc-800 text-white text-xs px-2 py-1 rounded
        whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity
        pointer-events-none z-50
      ">
        {tooltip}
      </span>
    </button>
  );
}
