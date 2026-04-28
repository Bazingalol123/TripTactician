import { useMemo } from 'react';

export const useConflicts = (activities) => {
  const conflicted = useMemo(
    () => (activities ?? []).filter((a) => a.conflict?.flagged && !a.conflict?.overridden),
    [activities]
  );

  const conflictCount = conflicted.length;

  const hasConflict = (activityId) =>
    conflicted.some((a) => a._id === activityId);

  return { conflicted, conflictCount, hasConflict };
};
