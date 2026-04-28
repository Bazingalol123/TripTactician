/**
 * Notification — toast-style banner
 * @param {'info'|'success'|'warning'|'error'} type
 * @param {string} message
 * @param {function} onDismiss
 */
const STYLES = {
  info: 'bg-blue-50 text-blue-800 border-blue-200',
  success: 'bg-green-50 text-green-800 border-green-200',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  error: 'bg-red-50 text-red-800 border-red-200',
};

export default function Notification({ type = 'info', message, onDismiss }) {
  return (
    <div className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${STYLES[type]}`}>
      <p>{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="text-current opacity-60 hover:opacity-100 shrink-0">
          ✕
        </button>
      )}
    </div>
  );
}
