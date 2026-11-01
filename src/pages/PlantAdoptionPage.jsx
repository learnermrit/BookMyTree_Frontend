import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, MapPin, Search, ShoppingCart, Sprout, X } from 'lucide-react';
import api from '../services/api';

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

const currency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

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

const defaultFilters = {
    query: '',
    radiusKm: 25,
    category: 'ALL',
    farmerName: '',
};

export default function PlantAdoptionPage() {
    const navigate = useNavigate();
    const [listings, setListings] = useState([]);
    const [filters, setFilters] = useState(defaultFilters);
    const [selectedListingId, setSelectedListingId] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [adoptionMode, setAdoptionMode] = useState('WHOLE_FARM');
    const [quantityOrPercentage, setQuantityOrPercentage] = useState(1);
    const [yieldPreference, setYieldPreference] = useState('PARCEL_DELIVERY');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');

    const selectedListing = useMemo(
        () => listings.find((item) => item.id === selectedListingId) || listings[0] || null,
        [listings, selectedListingId]
    );

    const loadListings = async () => {
        setIsLoading(true);
        setError('');
        try {
            const params = {
                forAdoption: true,
                radiusKm: filters.radiusKm,
                query: filters.query || undefined,
                category: filters.category && filters.category !== 'ALL' ? filters.category : undefined,
            };

            const { data } = await api.get('/fields/search', { params });
            const filtered = (data || []).filter((listing) => {
                if (!filters.farmerName) return true;
                const normalized = filters.farmerName.trim().toLowerCase();
                const farmerName = (listing.farmerName || '').toLowerCase();
                return farmerName.includes(normalized);
            });

            setListings(filtered);
            if (filtered.length > 0 && (!selectedListingId || !filtered.some((item) => item.id === selectedListingId))) {
                setSelectedListingId(filtered[0].id);
            }
            if (filtered.length === 0) {
                setSelectedListingId('');
            }
        } catch (err) {
            console.error('Unable to load adoption listings:', err);
            setError(err.response?.data?.message || 'Unable to load public adoption listings.');
            setListings([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadListings();
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            loadListings();
        }, 250);
        return () => window.clearTimeout(timer);
    }, [filters.query, filters.category, filters.radiusKm, filters.farmerName]);

    const openAdoptionModal = (listing) => {
        setSelectedListingId(listing.id);
        setAdoptionMode('WHOLE_FARM');
        setQuantityOrPercentage(1);
        setYieldPreference('PARCEL_DELIVERY');
        setIsModalOpen(true);
    };

    const handleCheckout = async () => {
        const userId = getCurrentUserId();
        if (!selectedListing || !userId) {
            navigate('/login');
            return;
        }

        setIsSubmitting(true);
        setError('');
        setStatus('');

        try {
            const quantityValue = Number(quantityOrPercentage || 1);
            const checkoutPayload = {
                userId,
                itemId: selectedListing.id,
                itemType: adoptionMode === 'PERCENTAGE_SHARE' ? 'PERCENTAGE_SHARE' : 'WHOLE_TREE',
                quantityOrPercentage: quantityValue,
                percentageShare: adoptionMode === 'PERCENTAGE_SHARE' ? quantityValue : undefined,
                yieldPreference,
            };

            const checkoutResponse = await api.post('/orders/checkout', checkoutPayload).catch(async (err) => {
                if (err.response?.status === 404 || err.response?.status === 400) {
                    return api.post('/adoption/adopt', {
                        userId,
                        listingId: selectedListing.id,
                        quantity: adoptionMode === 'PERCENTAGE_SHARE' ? 1 : quantityValue,
                    });
                }
                throw err;
            });

            const awardPoints = Math.max(50, Number(selectedListing.pointsReward || 100) * quantityValue);
            const carbonOffset = Number(selectedListing.carbonOffsetKg || 0) * quantityValue;

            await api.post('/metaverse/green-points/award', null, {
                params: {
                    userId,
                    points: awardPoints,
                    carbonOffsetKg: carbonOffset,
                },
            });

            const inventoryEntry = {
                id: `${selectedListing.id}-${Date.now()}`,
                cropSpecies: selectedListing.name || selectedListing.title,
                quantity: quantityValue,
                basePrice: Number(selectedListing.price || 0),
                points: awardPoints,
                carbonOffsetKg: carbonOffset,
                description: selectedListing.description,
                adoptedAt: new Date().toISOString(),
            };

            const nextInventory = [...getStoredAdoptionInventory(userId), inventoryEntry];
            saveStoredAdoptionInventory(userId, nextInventory);

            setStatus(`Adoption successfully checked out. ${awardPoints} Green Points credited and saved to your virtual farm inventory.`);
            setIsModalOpen(false);
            setQuantityOrPercentage(1);
            setYieldPreference('PARCEL_DELIVERY');
            setSelectedListingId(selectedListing.id);
            if (checkoutResponse?.data) {
                navigate('/virtual-farm');
            }
        } catch (err) {
            console.error('Adoption checkout failed:', err);
            setError(err.response?.data?.message || 'Unable to complete the adoption checkout.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Public discovery</p>
                    <h1 className="mt-2 text-3xl font-black text-stone-900">Plant adoption marketplace</h1>
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

            <div className="mb-6 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <label className="xl:col-span-2 block">
                        <span className="mb-2 block text-sm font-medium text-stone-700">Search farm / field name</span>
                        <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5">
                            <Search className="h-4 w-4 text-stone-500" />
                            <input
                                value={filters.query}
                                onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
                                placeholder="Organic Wheat, Mango Orchard..."
                                className="w-full border-0 bg-transparent text-sm outline-none"
                            />
                        </div>
                    </label>

                    <label className="block">
                        <span className="mb-2 block text-sm font-medium text-stone-700">Distance radius</span>
                        <select
                            value={filters.radiusKm}
                            onChange={(event) => setFilters((current) => ({ ...current, radiusKm: Number(event.target.value) }))}
                            className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none"
                        >
                            <option value={5}>5 km</option>
                            <option value={15}>15 km</option>
                            <option value={25}>25 km</option>
                            <option value={50}>50 km</option>
                            <option value={100}>100 km</option>
                        </select>
                    </label>

                    <label className="block">
                        <span className="mb-2 block text-sm font-medium text-stone-700">Asset category</span>
                        <select
                            value={filters.category}
                            onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
                            className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none"
                        >
                            <option value="ALL">All</option>
                            <option value="CROP_FIELD">Crop Fields</option>
                            <option value="FISH_POND">Fish Ponds</option>
                            <option value="FRUIT_FARM">Fruit Farms</option>
                            <option value="TIMBER_PLANT">Timber Plants</option>
                            <option value="SINGLE_PLANT">Single Plant</option>
                        </select>
                    </label>

                    <label className="block">
                        <span className="mb-2 block text-sm font-medium text-stone-700">Farmer name</span>
                        <input
                            value={filters.farmerName}
                            onChange={(event) => setFilters((current) => ({ ...current, farmerName: event.target.value }))}
                            placeholder="Farmer name"
                            className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none"
                        />
                    </label>
                </div>
            </div>

            {isLoading ? (
                <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-500">Searching nearby adoption listings…</div>
            ) : listings.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
                    No adoption assets match the current discovery filters.
                </div>
            ) : (
                <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    <div className="space-y-4">
                        {listings.map((listing) => (
                            <button
                                key={listing.id}
                                type="button"
                                onClick={() => openAdoptionModal(listing)}
                                className={`w-full rounded-3xl border bg-white p-4 text-left shadow-sm transition ${selectedListing?.id === listing.id ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-stone-200 hover:border-stone-300'}`}
                            >
                                <div className="flex flex-col gap-4 md:flex-row">
                                    <div className="h-32 w-full rounded-2xl bg-gradient-to-br from-emerald-100 via-lime-100 to-yellow-100 p-4 md:w-40">
                                        <div className="flex h-full items-center justify-center rounded-xl border border-emerald-200 bg-white/60 text-emerald-700">
                                            <Sprout className="h-10 w-10" />
                                        </div>
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                            <div>
                                                <div className="mb-2 flex items-center gap-2">
                                                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">
                                                        {listing.category || 'CROP_FIELD'}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-1 text-[10px] font-semibold text-stone-600">
                                                        <MapPin className="h-3 w-3" />
                                                        {(listing.location || 'Nearby')}
                                                    </span>
                                                </div>
                                                <h2 className="text-xl font-bold text-stone-900">{listing.title || listing.name}</h2>
                                                <p className="mt-1 text-sm text-stone-600">{listing.farmerName || 'Farmer'} • {listing.unitLabel || 'unit'}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-black text-emerald-700">{currency(listing.price)}</div>
                                                <div className="text-xs text-stone-500">per unit</div>
                                            </div>
                                        </div>

                                        <p className="mt-4 text-sm text-stone-600">{listing.description}</p>

                                        <div className="mt-4 flex flex-wrap gap-2 text-xs text-stone-600">
                                            <span className="rounded-full bg-stone-100 px-2 py-1">Available: {listing.quantityAvailable ?? 0}</span>
                                            <span className="rounded-full bg-stone-100 px-2 py-1">{listing.pointsReward ?? 0} Green Points</span>
                                            <span className="rounded-full bg-stone-100 px-2 py-1">{listing.carbonOffsetKg ?? 0} kg CO₂</span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {selectedListing && (
                        <aside className="rounded-3xl border border-stone-200 bg-stone-900 p-6 text-white shadow-sm">
                            <div className="mb-5 flex items-center gap-2 text-emerald-300">
                                <ShoppingCart className="h-5 w-5" />
                                <span className="text-sm font-semibold uppercase tracking-[0.2em]">Adoption detail</span>
                            </div>

                            <div className="rounded-2xl bg-white/5 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm text-stone-300">Selected asset</p>
                                    <p className="font-bold text-white">{selectedListing.title || selectedListing.name}</p>
                                </div>
                                <div className="mt-4 flex items-center justify-between text-sm text-stone-300">
                                    <span>Base price</span>
                                    <span>{currency(selectedListing.price)}</span>
                                </div>
                                <div className="mt-2 flex items-center justify-between text-sm text-stone-300">
                                    <span>Green points</span>
                                    <span>{selectedListing.pointsReward ?? 0}</span>
                                </div>
                            </div>

                            <div className="mt-5 space-y-4">
                                <div>
                                    <p className="mb-2 text-sm text-stone-300">Adoption mode</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['WHOLE_FARM', 'INDIVIDUAL_TREE', 'PERCENTAGE_SHARE'].map((mode) => (
                                            <button
                                                key={mode}
                                                type="button"
                                                onClick={() => setAdoptionMode(mode)}
                                                className={`rounded-xl px-2 py-2 text-xs font-semibold ${adoptionMode === mode ? 'bg-emerald-500 text-white' : 'bg-white/5 text-stone-200'}`}
                                            >
                                                {mode === 'WHOLE_FARM' ? 'Whole' : mode === 'INDIVIDUAL_TREE' ? 'Individual' : 'Share'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <label className="block">
                                    <span className="mb-2 block text-sm text-stone-300">
                                        {adoptionMode === 'PERCENTAGE_SHARE' ? 'Share %' : 'Quantity'}
                                    </span>
                                    <input
                                        type="number"
                                        min={1}
                                        max={adoptionMode === 'PERCENTAGE_SHARE' ? 100 : 50}
                                        value={quantityOrPercentage}
                                        onChange={(event) => setQuantityOrPercentage(Math.max(1, Number(event.target.value || 1)))}
                                        className="w-full rounded-xl border border-stone-700 bg-stone-800 px-3 py-2.5 text-white outline-none"
                                    />
                                </label>

                                <label className="block">
                                    <span className="mb-2 block text-sm text-stone-300">Yield preference</span>
                                    <select
                                        value={yieldPreference}
                                        onChange={(event) => setYieldPreference(event.target.value)}
                                        className="w-full rounded-xl border border-stone-700 bg-stone-800 px-3 py-2.5 text-white outline-none"
                                    >
                                        <option value="PARCEL_DELIVERY">Parcel delivery</option>
                                        <option value="RESELL_PROFIT_SHARE">Resell / profit share</option>
                                        <option value="DONATION">100% donation</option>
                                    </select>
                                </label>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsModalOpen(true)}
                                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-400"
                            >
                                Checkout adoption
                                <CheckCircle2 className="h-4 w-4" />
                            </button>
                        </aside>
                    )}
                </div>
            )}

            {isModalOpen && selectedListing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4">
                    <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Confirm adoption</p>
                                <h3 className="mt-2 text-2xl font-black text-stone-900">{selectedListing.title || selectedListing.name}</h3>
                            </div>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-full bg-stone-100 p-2 text-stone-600 hover:bg-stone-200">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-4 text-sm text-stone-600">
                            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-800">
                                <div className="flex items-center justify-between">
                                    <span>Mode</span>
                                    <strong>{adoptionMode}</strong>
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                    <span>Selected amount</span>
                                    <strong>{quantityOrPercentage}</strong>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span>Yield preference</span>
                                <span className="font-semibold text-stone-800">{yieldPreference}</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span>Estimated points</span>
                                <span className="font-semibold text-stone-800">{Math.max(50, Number(selectedListing.pointsReward || 100) * Number(quantityOrPercentage || 1))}</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span>Estimated CO₂</span>
                                <span className="font-semibold text-stone-800">{Number(selectedListing.carbonOffsetKg || 0) * Number(quantityOrPercentage || 1)} kg</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleCheckout}
                            disabled={isSubmitting}
                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting ? 'Submitting adoption...' : 'Confirm adoption'}
                            <CheckCircle2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
