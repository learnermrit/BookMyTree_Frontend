import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Leaf, ShoppingCart, Sprout, Sparkles } from 'lucide-react';
import api from '../services/api';

const adoptionCatalog = [
    {
        id: '8d10ef67-0f1b-4a8a-97ce-9c4b0a2d1d11',
        cropSpecies: 'Tomato',
        unitLabel: 'plant',
        basePrice: 180,
        points: 120,
        carbonOffsetKg: 1.6,
        description: 'High-yield tomato crop ideal for kitchen garden adoption.',
    },
    {
        id: '8d10ef67-0f1b-4a8a-97ce-9c4b0a2d1d12',
        cropSpecies: 'Mango Sapling',
        unitLabel: 'sapling',
        basePrice: 350,
        points: 220,
        carbonOffsetKg: 3.2,
        description: 'A long-term shade and fruit tree for future harvests.',
    },
    {
        id: '8d10ef67-0f1b-4a8a-97ce-9c4b0a2d1d13',
        cropSpecies: 'Cucumber',
        unitLabel: 'vine',
        basePrice: 140,
        points: 95,
        carbonOffsetKg: 1.2,
        description: 'Fast-growing climate-friendly crop for quick farmer support.',
    },
    {
        id: '8d10ef67-0f1b-4a8a-97ce-9c4b0a2d1d14',
        cropSpecies: 'Banana',
        unitLabel: 'cluster',
        basePrice: 220,
        points: 150,
        carbonOffsetKg: 2.4,
        description: 'A nutrient-rich crop bundle with excellent soil support.',
    },
];

const getCurrentUserId = () => {
    try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser.id) return parsedUser.id;
            if (parsedUser.userId) return parsedUser.userId;
        }

        const token = localStorage.getItem('jwt_token');
        if (!token) return null;

        const payload = JSON.parse(atob(token.split('.')[1] || 'e30'));
        return payload.sub || payload.userId || payload.id || null;
    } catch {
        return null;
    }
};

const getStoredAdoptionInventory = (userId) => {
    if (!userId) return [];

    try {
        const raw = localStorage.getItem(`bookmytree_adoption_inventory_${userId}`);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

const saveStoredAdoptionInventory = (userId, inventory) => {
    if (!userId) return;
    localStorage.setItem(`bookmytree_adoption_inventory_${userId}`, JSON.stringify(inventory));
};

export default function PlantAdoptionPage() {
    const navigate = useNavigate();
    const [selectedItemId, setSelectedItemId] = useState(adoptionCatalog[0].id);
    const [quantity, setQuantity] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');

    const selectedItem = useMemo(
        () => adoptionCatalog.find((item) => item.id === selectedItemId) || adoptionCatalog[0],
        [selectedItemId]
    );

    const currentUserId = getCurrentUserId();
    const storedAdoptionInventory = currentUserId ? getStoredAdoptionInventory(currentUserId) : [];

    const subtotal = selectedItem.basePrice * quantity;
    const totalPoints = selectedItem.points * quantity;
    const totalCarbon = Number((selectedItem.carbonOffsetKg * quantity).toFixed(2));

    const handleAdoptNow = async () => {
        const userId = getCurrentUserId();
        if (!userId) {
            navigate('/login');
            return;
        }

        setIsSubmitting(true);
        setError('');
        setStatus('');

        try {
            const checkoutPayload = {
                userId,
                itemId: selectedItem.id,
                itemType: 'WHOLE_TREE',
                yieldPreference: 'PARCEL_DELIVERY',
            };

            await api.post('/orders/checkout', checkoutPayload);

            const adoptedRecord = {
                id: `${selectedItem.id}-${Date.now()}`,
                cropSpecies: selectedItem.cropSpecies,
                unitLabel: selectedItem.unitLabel,
                quantity,
                basePrice: selectedItem.basePrice,
                points: totalPoints,
                carbonOffsetKg: totalCarbon,
                description: selectedItem.description,
                adoptedAt: new Date().toISOString(),
            };

            const nextInventory = [...storedAdoptionInventory, adoptedRecord];
            saveStoredAdoptionInventory(userId, nextInventory);

            await api.post('/metaverse/green-points/award', null, {
                params: {
                    userId,
                    points: totalPoints,
                    carbonOffsetKg: totalCarbon,
                },
            });

            setStatus(`Adoption confirmed. ${quantity} ${selectedItem.cropSpecies} units added to your unplaced inventory.`);
            setQuantity(1);
            setSelectedItemId(adoptionCatalog[0].id);
        } catch (err) {
            console.error('Plant adoption failed:', err);
            setError(err.response?.data?.message || 'Unable to complete plant adoption right now.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Plant adoption</p>
                    <h1 className="mt-2 text-3xl font-black text-stone-900">Adopt plants and grow your digital farm</h1>
                </div>

                <button
                    type="button"
                    onClick={() => navigate('/virtual-farm')}
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
                >
                    View virtual farm
                    <ArrowRight className="h-4 w-4" />
                </button>
            </div>

            {(status || error) && (
                <div className={`mb-6 rounded-xl border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
                    {error || status}
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
                <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex items-center gap-3">
                        <div className="rounded-2xl bg-emerald-100 p-2 text-emerald-700">
                            <Sprout className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-stone-500">Farmer demand discovery</p>
                            <h2 className="text-xl font-bold text-stone-900">Choose a crop to support</h2>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {adoptionCatalog.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setSelectedItemId(item.id)}
                                className={`rounded-2xl border p-4 text-left transition ${selectedItem.id === item.id ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-stone-200 bg-stone-50 hover:border-stone-300'}`}
                            >
                                <div className="mb-3 flex items-center justify-between">
                                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-green-700">
                                        {item.unitLabel}
                                    </span>
                                    <span className="text-lg font-black text-stone-900">₹{item.basePrice}</span>
                                </div>

                                <h3 className="text-lg font-bold text-stone-900">{item.cropSpecies}</h3>
                                <p className="mt-2 text-sm text-stone-600">{item.description}</p>

                                <div className="mt-4 flex items-center justify-between text-xs text-stone-500">
                                    <span>{item.points} Green Points</span>
                                    <span>{item.carbonOffsetKg} kg CO₂</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <aside className="rounded-3xl border border-stone-200 bg-stone-900 p-6 text-white shadow-sm">
                    <div className="mb-5 flex items-center gap-2 text-emerald-300">
                        <ShoppingCart className="h-5 w-5" />
                        <span className="text-sm font-semibold uppercase tracking-[0.2em]">Checkout</span>
                    </div>

                    <div className="rounded-2xl bg-white/5 p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-stone-300">Selected crop</p>
                            <p className="font-bold text-white">{selectedItem.cropSpecies}</p>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                            <label htmlFor="quantity" className="text-sm text-stone-300">Quantity</label>
                            <input
                                id="quantity"
                                type="number"
                                min={1}
                                max={20}
                                value={quantity}
                                onChange={(event) => setQuantity(Math.max(1, Number(event.target.value || 1)))}
                                className="w-20 rounded-lg border border-stone-700 bg-stone-800 px-2 py-2 text-right text-white outline-none ring-0"
                            />
                        </div>
                    </div>

                    <div className="mt-5 space-y-3 text-sm">
                        <div className="flex items-center justify-between text-stone-300">
                            <span>Subtotal</span>
                            <span>₹{subtotal}</span>
                        </div>
                        <div className="flex items-center justify-between text-stone-300">
                            <span>Rewards</span>
                            <span>{totalPoints} points</span>
                        </div>
                        <div className="flex items-center justify-between text-stone-300">
                            <span>Carbon sink</span>
                            <span>{totalCarbon} kg</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleAdoptNow}
                        disabled={isSubmitting}
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting ? 'Processing adoption...' : 'Adopt now'}
                        <CheckCircle2 className="h-4 w-4" />
                    </button>

                    <div className="mt-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4">
                        <div className="flex items-center gap-2 text-emerald-300">
                            <Leaf className="h-4 w-4" />
                            <span className="text-sm font-semibold">What happens next?</span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-stone-200">
                            The adopted crop is saved to your profile and appears in the farm placement dock to be dragged into your virtual farm.
                        </p>
                    </div>
                </aside>
            </div>

            {storedAdoptionInventory.length > 0 && (
                <div className="mt-8 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-2 text-emerald-700">
                        <Sparkles className="h-5 w-5" />
                        <h3 className="text-xl font-bold text-stone-900">Your adoption inventory</h3>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {storedAdoptionInventory.map((item) => (
                            <div key={item.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                                <div className="flex items-center justify-between">
                                    <p className="font-bold text-stone-900">{item.cropSpecies}</p>
                                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">{item.quantity} units</span>
                                </div>
                                <p className="mt-2 text-sm text-stone-600">{item.description}</p>
                                <div className="mt-4 flex items-center justify-between text-xs text-stone-500">
                                    <span>{item.points} pts</span>
                                    <span>{item.carbonOffsetKg} kg CO₂</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
