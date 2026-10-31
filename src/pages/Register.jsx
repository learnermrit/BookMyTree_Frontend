import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Trees, Lock, Mail, User, Phone, ArrowRight, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

export default function Register() {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        password: '',
        role: 'CONSUMER'
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const payload = {
                ...formData,
                phoneNumber: formData.phoneNumber.trim(),
                fullName: formData.fullName.trim(),
                email: formData.email.trim(),
            };

            const response = await api.post('/auth/register', payload);

            const token = response?.data?.token || response?.data?.accessToken;
            if (typeof token === 'string' && token.length > 20) {
                localStorage.setItem('jwt_token', token);
                window.dispatchEvent(new Event('storage'));
            }

            navigate('/login');
        } catch (err) {
            const backendMessage =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.response?.data?.details ||
                'Failed to register account. Please check your details and try again.';

            setError(backendMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-stone-200 p-8 space-y-6">

                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-green-100 text-green-700 mb-1">
                        <Trees className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold text-stone-900">Join BookMyTree</h1>
                    <p className="text-sm text-stone-600">Create an account to adopt trees or offer farm services</p>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {/* Register Form */}
                <form onSubmit={handleRegister} className="space-y-4">
                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Full Name</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                                <User className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                name="fullName"
                                required
                                value={formData.fullName}
                                onChange={handleChange}
                                placeholder="Mrityunjay Kumar"
                                className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-sm"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Email Address</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                                <Mail className="w-4 h-4" />
                            </span>
                            <input
                                type="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="farmer@bookmytree.com"
                                className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-sm"
                            />
                        </div>
                    </div>

                    {/* Phone Number */}
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Phone Number</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                                <Phone className="w-4 h-4" />
                            </span>
                            <input
                                type="tel"
                                name="phoneNumber"
                                required
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                placeholder="+91 98765 43210"
                                className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-sm"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Password</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                                <Lock className="w-4 h-4" />
                            </span>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-10 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 focus:outline-none"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    {/* Role Selection */}
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Account Type (Role)</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-sm bg-white"
                        >
                            <option value="CONSUMER">Consumer / Tree Adopter</option>
                            <option value="FARMER">Farmer / Orchard Owner</option>
                            <option value="REGIONAL_MANAGER">Regional Manager</option>
                            <option value="ADMIN">Administrator</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-700 text-white py-2.5 rounded-lg font-medium hover:bg-green-800 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                        {!loading && <ArrowRight className="w-4 h-4" />}
                    </button>
                </form>

                {/* Footer */}
                <div className="text-center text-sm text-stone-600">
                    Already have an account?{' '}
                    <Link to="/login" className="text-green-700 font-medium hover:underline">
                        Sign In
                    </Link>
                </div>

            </div>
        </div>
    );
}