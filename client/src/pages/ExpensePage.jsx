import { useParams } from 'react-router-dom';
import { useActivities } from '../hooks/useActivities.js';
import { useExpenses } from '../hooks/useExpenses.js';
import { useTrip } from '../hooks/useTrip.js';
import Breadcrumb from '../components/ui/Breadcrumb.jsx';
import { tripPath } from '../constants/routes.js';

export default function ExpensePage() {
  const { id } = useParams();
  const { trip } = useTrip(id);
  const { activities } = useActivities(id);
  const { perPerson, forTwo, byDay } = useExpenses(activities);

  const days = [...new Set(activities.map((a) => a.dayNumber))].sort((a, b) => a - b);
  const maxDay = Object.entries(byDay).reduce((max, [day, val]) => val > (byDay[max] || 0) ? day : max, null);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <Breadcrumb items={[
          { label: trip?.name || 'Trip', href: tripPath(id) },
          { label: 'Expenses' },
        ]} />
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Total est." value={`$${forTwo.toLocaleString()}`} sub="for two" />
          <StatCard label="Per person" value={`$${perPerson.toLocaleString()}`} sub="estimated" />
        </div>

        <section>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Per day</p>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {days.map((dayNumber) => (
              <div key={dayNumber} className="flex justify-between px-4 py-3 text-sm">
                <span className="text-gray-700">Day {dayNumber}</span>
                <span className={`font-medium ${String(dayNumber) === String(maxDay) ? 'text-red-500' : 'text-gray-900'}`}>
                  ~${(byDay[dayNumber] || 0).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-xl font-semibold text-gray-900 mt-0.5">{value}</p>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  );
}
