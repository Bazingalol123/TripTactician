import { useAuth } from '../hooks/useAuth.js';

export default function SettingsPanel() {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">Settings</h2>
      </div>
      <div className="flex-1 p-3">
        <div className="flex flex-col gap-1">
          <div className="px-3 py-2 rounded-lg">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-400">{user?.email}</p>
          </div>
          <div className="border-t border-gray-100 my-2" />
          <button
            onClick={logout}
            className="text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
