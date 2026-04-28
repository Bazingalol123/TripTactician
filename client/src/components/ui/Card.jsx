/**
 * Card — surface container with optional border/shadow
 * @param {'default'|'elevated'|'outlined'|'conflict'} variant
 */
const VARIANTS = {
  default: 'bg-white border border-gray-200',
  elevated: 'bg-white shadow-md',
  outlined: 'bg-white border-2 border-gray-300',
  conflict: 'bg-red-50 border border-red-300',
};

export default function Card({ variant = 'default', children, className = '', ...props }) {
  return (
    <div className={`rounded-xl p-4 ${VARIANTS[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}
