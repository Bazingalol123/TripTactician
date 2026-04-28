/**
 * Avatar — user initials circle
 * @param {string} name - full name used to derive initials
 * @param {'sm'|'md'|'lg'} size
 * @param {boolean} pending - shows dashed border for unjoined partner
 */
const SIZES = { sm: 'w-6 h-6 text-xs', md: 'w-8 h-8 text-sm', lg: 'w-10 h-10 text-base' };

const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

export default function Avatar({ name = '', size = 'md', pending = false, className = '' }) {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-full font-semibold select-none
        ${SIZES[size]}
        ${pending ? 'border-2 border-dashed border-gray-400 text-gray-400 bg-gray-50' : 'bg-blue-600 text-white'}
        ${className}`}
    >
      {pending ? '?' : initials(name)}
    </div>
  );
}
