import { Link } from 'react-router-dom';
import { Trees, User, Compass } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-green-700 font-bold text-xl">
          <Trees className="w-8 h-8" />
          <span>BookMyTree</span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-6">
          <Link to="/" className="hover:text-green-600 font-medium transition">Home</Link>
          <Link to="/farms" className="flex items-center gap-1 hover:text-green-600 font-medium transition">
            <Compass className="w-4 h-4" /> Explore Farms
          </Link>
          <Link to="/login" className="flex items-center gap-1 bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition">
            <User className="w-4 h-4" /> Login
          </Link>
        </div>
      </div>
    </nav>
  );
}