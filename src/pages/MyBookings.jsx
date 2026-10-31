import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, MapPin, Ticket, TreePine } from 'lucide-react';
import api from '../services/api';

const statusStyles = {
    PENDING: 'bg-amber-100 text-amber-700',
    CONFIRMED: 'bg-emerald-100 text-emerald-700',
    COMPLETED: 'bg-sky-100 text-sky-700',
    CANCELLED: 'bg-red-100 text-red-700',
    REJECTED: 'bg-stone-200 text-stone-700',
};

export default function MyBookings() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const user = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem('user') || 'null');
        } catch {
            return null;
        }
    }, []);

    useEffect(() => {
        const loadBookings = async () => {
            if (!user?.id) {
                setError('Please log in to view your bookings.');
                setLoading(false);
                return;
            }

            try {
                const response = await api.get(`/orders/user/${user.id}`);
                setOrders(response.data || []);
            } catch (err) {
                setError(err.response?.data?.message || 'Unable to load your bookings.');
            } finally {
                setLoading(false);
            }
        };

        loadBookings();
    }, [user?.id]);

    if (!user) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-10">
                <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
                    <Ticket className="mx-auto h-12 w-12 text-emerald-700" />
                    <h1 className="mt-4 text-2xl font-bold text-stone-900">My Bookings</h1>
                    <p className="mt-3 text-stone-600">Log in to see your booking history and access the pass details for each adoption.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">User profile</p>
                <h1 className="mt-2 text-3xl font-black text-stone-900">My Bookings</h1>
            </div>

            {error && (
                <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-stone-600 shadow-sm">
                    Loading your bookings...
                </div>
            ) : orders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-stone-600 shadow-sm">
                    You have no booking history yet. Explore a farm and confirm an adoption to start.
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {orders.map((order) => (
                        <div key={order.id} className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 text-emerald-700">
                                    <TreePine className="h-4 w-4" />
                                    <span className="text-xs font-bold uppercase tracking-[0.2em]">{order.itemType}</span>
                                </div>
                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${statusStyles[order.status] || 'bg-stone-200 text-stone-700'}`}>
                                    {order.status}
                                </span>
                            </div>

                            <div className="space-y-3 text-sm text-stone-600">
                                <div className="flex items-center justify-between gap-3">
                                    <span>Booking ID</span>
                                    <span className="font-semibold text-stone-900">{String(order.id).slice(0, 8)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span>Amount</span>
                                    <span className="font-semibold text-stone-900">₹{Number(order.totalAmount || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span>Yield</span>
                                    <span className="font-semibold text-stone-900">{order.yieldPreference}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span>Share</span>
                                    <span className="font-semibold text-stone-900">{order.percentageShare ? `${order.percentageShare}%` : '—'}</span>
                                </div>
                            </div>

                            <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-3 text-xs text-stone-600">
                                <div className="mb-2 flex items-center gap-2 font-semibold text-stone-800">
                                    <CalendarDays className="h-4 w-4 text-emerald-700" />
                                    Booking date
                                </div>
                                <p>{order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Not available'}</p>
                            </div>

                            {(order.passCode || order.otpCode || order.qrCodeUrl) && (
                                <div className="mt-4 space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                                    {order.passCode && <p><span className="font-semibold">Pass:</span> {order.passCode}</p>}
                                    {order.otpCode && <p><span className="font-semibold">OTP:</span> {order.otpCode}</p>}
                                    {order.qrCodeUrl && <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> QR available: {order.qrCodeUrl}</p>}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
