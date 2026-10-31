import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trees, User, Compass, LogOut, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  // Check login status on mount / when storage changes
// Check login status on mount AND listen for storage changes across the app
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('jwt_token');
      setIsLoggedIn(!!token);
    };

    // Check on initial load
    checkAuth();

    // Listen for storage updates triggered from login/logout
    window.addEventListener('storage', checkAuth);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, []);
  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    window.dispatchEvent(new Event('storage'));
    setIsLoggedIn(false);
    setDropdownOpen(false);
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-green-700 font-bold text-xl">
          <Trees className="w-8 h-8" />
          <span>BookMyTree</span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-6 relative">
          <Link to="/" className="hover:text-green-600 font-medium transition">Home</Link>
          <Link to="/farms" className="flex items-center gap-1 hover:text-green-600 font-medium transition">
            <Compass className="w-4 h-4" /> Explore Farms
          </Link>

          {/* Conditional Rendering: Login Button OR Profile Sidebar Toggle */}
          {!isLoggedIn ? (
            <Link to="/login" className="flex items-center gap-1 bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition shadow-sm">
              <User className="w-4 h-4" /> Login
            </Link>
          ) : (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-2 rounded-full hover:bg-green-200 transition focus:outline-none"
              >
                <div className="w-7 h-7 rounded-full bg-green-700 text-white flex items-center justify-center font-bold text-xs">
                  U
                </div>
              </button>

              {/* Profile Dropdown Sidebar / Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-stone-200 rounded-xl shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b border-stone-100">
                    <p className="text-xs text-stone-500">Signed in as</p>
                    <p className="text-sm font-semibold text-stone-800 truncate">Farmer / Adopter</p>
                  </div>
                  <Link
                    to="/dashboard"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 transition"
                  >
                    <LayoutDashboard className="w-4 h-4 text-stone-500" /> My Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition text-left"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}