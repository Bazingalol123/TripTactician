export const checkConflict = ({ activity, preferenceA, preferenceB }) => {
  for (const [label, prefs] of [['A', preferenceA], ['B', preferenceB]]) {
    if (!prefs?.hardAvoids) continue;
    const avoidWords = prefs.hardAvoids.toLowerCase().split(/[,\s]+/).filter((w) => w.length > 2);
    const activityText = `${activity.name} ${activity.category}`.toLowerCase();
    const match = avoidWords.find((w) => activityText.includes(w));
    if (match) {
      return {
        flagged: true,
        partner: label,
        reason: `${label === 'A' ? 'Partner A' : 'Partner B'} avoids "${match}"`,
        overridden: false,
      };
    }
  }

  if (activity.timeOfDay === 'morning') {
    if (preferenceA && !preferenceA.morningPerson) {
      return { flagged: true, partner: 'A', reason: 'Partner A prefers slow mornings', overridden: false };
    }
    if (preferenceB && !preferenceB.morningPerson) {
      return { flagged: true, partner: 'B', reason: 'Partner B prefers slow mornings', overridden: false };
    }
  }

  if (activity.source === 'manual' && preferenceA && preferenceB) {
    const allInterests = [...new Set([...preferenceA.interests, ...preferenceB.interests])];
    const hasMatch = allInterests.some((i) => activity.category?.toLowerCase().includes(i));
    if (!hasMatch) {
      return { flagged: true, partner: null, reason: "Not in either partner's interests", overridden: false };
    }
  }

  return { flagged: false, partner: null, reason: null, overridden: false };
};
