import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Trees, Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Send credentials to your Spring Boot Auth endpoint 
      // (Update '/auth/login' if your backend controller route is different)
      const response = await api.post('/auth/login', { email, password });

      // Assuming your backend returns a JWT token in response.data.token or directly as a string
      const token = response.data.token || response.data;
      const user = response.data.user || null;

      // Store token so Axios interceptors can attach it to future requests
      localStorage.setItem('jwt_token', token);
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }
      window.dispatchEvent(new Event('storage'));

      // Redirect user back to home or dashboard after successful login
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-stone-200 p-8 space-y-6">

        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-green-100 text-green-700 mb-1">
            <Trees className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900">Welcome Back to BookMyTree</h1>
          <p className="text-sm text-stone-600">Enter your credentials to access your tree dashboard</p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="farmer@bookmytree.com"
                className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'} // <--- Changes dynamically
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-sm"
              />
              {/* Toggle Button for Eye Icon */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 text-white py-2.5 rounded-lg font-medium hover:bg-green-800 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center text-sm text-stone-600">
          Don't have an account yet?{' '}
          <Link to="/register" className="text-green-700 font-medium hover:underline">
            Register a farm
          </Link>
        </div>

      </div>
    </div>
  );
}