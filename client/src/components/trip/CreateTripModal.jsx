import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTrip } from '../../services/tripService.js';
import { queryKeys } from '../../constants/queryKeys.js';
import Input from '../ui/Input.jsx';
import Button from '../ui/Button.jsx';

export default function CreateTripModal({ onClose }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState({});

  const createMutation = useMutation({
    mutationFn: createTrip,
    onSuccess: (trip) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.all });
      navigate(`/trips/${trip._id}`);
      onClose?.();
    },
  });

  const validate = () => {
    const e = {};
    if (!destination.trim()) e.destination = 'Required';
    if (!startDate) e.startDate = 'Required';
    if (!endDate) e.endDate = 'Required';
    if (startDate && endDate && endDate < startDate) e.endDate = 'Must be after start date';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    createMutation.mutate({
      name: name.trim() || undefined,
      destination: { name: destination.trim() },
      startDate,
      endDate,
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-gray-900">New trip</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Destination"
            placeholder="Tokyo, Japan"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            error={errors.destination}
            autoFocus
          />

          <div className="flex gap-3">
            <Input
              label="From"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              error={errors.startDate}
              className="flex-1"
              min={new Date().toISOString().split('T')[0]}
            />
            <Input
              label="To"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              error={errors.endDate}
              className="flex-1"
              min={startDate || new Date().toISOString().split('T')[0]}
            />
          </div>

          <Input
            label="Trip name (optional)"
            placeholder="Leave blank to auto-generate"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {createMutation.error && (
            <p className="text-xs text-red-600">
              {createMutation.error?.response?.data?.error || 'Something went wrong'}
            </p>
          )}

          <Button type="submit" fullWidth loading={createMutation.isPending}>
            Create trip →
          </Button>
        </form>
      </div>
    </div>
  );
}
