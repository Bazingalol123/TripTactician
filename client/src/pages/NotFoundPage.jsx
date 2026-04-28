import { Link } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <p className="text-5xl font-bold text-gray-200">404</p>
      <h1 className="text-xl font-semibold text-gray-700">Page not found</h1>
      <Link to="/">
        <Button variant="secondary">Go home</Button>
      </Link>
    </div>
  );
}
