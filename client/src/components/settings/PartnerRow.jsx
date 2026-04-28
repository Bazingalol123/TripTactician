import Avatar from '../ui/Avatar.jsx';
import Badge from '../ui/Badge.jsx';

export default function PartnerRow({ participant, isMe, hasPreferences }) {
  const name = participant?.userId?.name || 'Partner';
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <Avatar name={name} size="md" pending={!participant?.userId} />
        <div>
          <p className="text-sm font-medium text-gray-900">{name}{isMe && ' (you)'}</p>
          <p className="text-xs text-gray-400 capitalize">{participant?.role}</p>
        </div>
      </div>
      <Badge variant={hasPreferences ? 'success' : 'waiting'}>
        {hasPreferences ? '✓ Ready' : 'Waiting…'}
      </Badge>
    </div>
  );
}
