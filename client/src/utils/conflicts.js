export const formatConflictReason = (conflict, partnerName = 'Your partner') => {
  if (!conflict?.flagged) return null;
  return conflict.reason || `${partnerName} may not enjoy this`;
};
