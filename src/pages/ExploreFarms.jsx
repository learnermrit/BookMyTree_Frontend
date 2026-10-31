import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRight,
    BadgeCheck,
    HandCoins,
    HeartHandshake,
    LocateFixed,
    MapPin,
    Search,
    SlidersHorizontal,
    Sparkles,
    Star,
    Sprout,
    Trees,
    Truck,
} from 'lucide-react';
import api from '../services/api';

const speciesOptions = ['ALL', 'Alphonso Mango', 'Nagpur Orange', 'Sweet Orange', 'Guava', 'Coconut', 'Pomegranate'];
const adoptionModes = [
    { value: 'WHOLE_TREE', label: 'Whole Tree', description: 'Full tree adoption' },
    { value: 'BRANCH', label: 'Branch', description: 'Selected branch' },
    { value: 'PERCENTAGE_SHARE', label: 'Share', description: 'Fractional ownership' },
];
const yieldOptions = [
    { value: 'PARCEL_DELIVERY', label: 'Parcel Delivery', description: 'Direct orchard-to-doorstep delivery.', icon: Truck },
    { value: 'RESELL_PROFIT_SHARE', label: 'Resell / Profit Share', description: 'The orchard sells the crop and shares the proceeds.', icon: HandCoins },
    { value: 'DONATION', label: '100% Donation', description: 'Your harvest is donated to community programs.', icon: HeartHandshake },
];
const stageStyles = {
    FLOWERING: 'bg-pink-100 text-pink-700',
    FRUIT_SET: 'bg-amber-100 text-amber-700',
    MATURE: 'bg-emerald-100 text-emerald-700',
    HARVESTED: 'bg-slate-200 text-slate-700',
};

const getDistanceKm = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const radius = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getCurrentUserId = () => {
    try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            if (parsed?.id) return parsed.id;
        }
    } catch {
        // ignore malformed local data
    }

    const token = localStorage.getItem('jwt_token');
    if (!token) return null;

    try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        return payload.sub || payload.userId || payload.id || null;
    } catch {
        return null;
    }
};

export default function ExploreFarms() {
    const navigate = useNavigate();
    const [location, setLocation] = useState({
        latitude: '19.0760',
        longitude: '72.8777',
        zip: '',
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [searchWorldWide, setSearchWorldWide] = useState(false);
    const [radiusKm, setRadiusKm] = useState(12);
    const [selectedSpecies, setSelectedSpecies] = useState('ALL');
    const [minRating, setMinRating] = useState('0');
    const [fields, setFields] = useState([]);
    const [selectedField, setSelectedField] = useState(null);
    const [treeInventory, setTreeInventory] = useState([]);
    const [selectedTree, setSelectedTree] = useState(null);
    const [selectedBranchId, setSelectedBranchId] = useState('');
    const [adoptionMode, setAdoptionMode] = useState('WHOLE_TREE');
    const [yieldPreference, setYieldPreference] = useState('PARCEL_DELIVERY');
    const [percentageShare, setPercentageShare] = useState(25);
    const [loadingFields, setLoadingFields] = useState(false);
    const [loadingTrees, setLoadingTrees] = useState(false);
    const [geoLoading, setGeoLoading] = useState(false);
    const [expandedSpecies, setExpandedSpecies] = useState({});
    const [bookingStatus, setBookingStatus] = useState({ type: 'info', message: '' });

    const groupedTreeInventory = useMemo(() => {
        const map = new Map();

        (treeInventory || []).forEach((tree) => {
            const species = tree.species || 'Unknown species';
            if (!map.has(species)) {
                map.set(species, { species, trees: [] });
            }
            map.get(species).trees.push(tree);
        });

        return Array.from(map.values()).sort((a, b) => a.species.localeCompare(b.species));
    }, [treeInventory]);

    const selectedBranch = useMemo(() => {
        if (!selectedTree || !selectedTree.branches?.length) return null;
        return selectedTree.branches.find((branch) => branch.id === selectedBranchId)
            || selectedTree.branches.find((branch) => branch.available)
            || selectedTree.branches[0];
    }, [selectedBranchId, selectedTree]);

    const fetchFields = async (override = null) => {
        const lat = Number((override || location).latitude);
        const lng = Number((override || location).longitude);
        const trimmedQuery = searchQuery?.trim();
        const shouldSearchGlobally = searchWorldWide || Boolean(trimmedQuery);

        if (!shouldSearchGlobally && (!Number.isFinite(lat) || !Number.isFinite(lng))) {
            return;
        }

        setLoadingFields(true);
        setBookingStatus({ type: 'info', message: '' });

        try {
            const response = await api.get('/fields/search', {
                params: {
                    query: trimmedQuery || undefined,
                    ...(shouldSearchGlobally ? {} : {
                        lat: Number.isFinite(lat) ? lat : undefined,
                        lng: Number.isFinite(lng) ? lng : undefined,
                        radiusKm,
                    }),
                    species: selectedSpecies === 'ALL' ? undefined : selectedSpecies,
                    minRating: Number(minRating) > 0 ? Number(minRating) : undefined,
                },
            });

            const nextFields = response.data || [];
            setFields(nextFields);

            if (!nextFields.length) {
                setSelectedField(null);
                setTreeInventory([]);
                setSelectedTree(null);
                return;
            }

            const firstField = nextFields[0];
            if (!selectedField || !nextFields.some((field) => field.id === selectedField.id)) {
                setSelectedField(firstField);
                await loadTrees(firstField.id);
            }
        } catch (error) {
            setBookingStatus({
                type: 'error',
                message: error.response?.data?.message || 'Unable to load nearby orchard discovery feed right now.',
            });
        } finally {
            setLoadingFields(false);
        }
    };

    const loadTrees = async (fieldId) => {
        if (!fieldId) return;

        setLoadingTrees(true);

        try {
            const response = await api.get(`/fields/${fieldId}/trees`);
            const inventories = response.data || [];
            setTreeInventory(inventories);

            if (inventories.length) {
                const nextTree = inventories[0];
                setSelectedTree(nextTree);
                setSelectedBranchId(nextTree.branches?.find((branch) => branch.available)?.id || nextTree.branches?.[0]?.id || '');
            } else {
                setSelectedTree(null);
                setSelectedBranchId('');
            }
        } catch (error) {
            setBookingStatus({
                type: 'error',
                message: error.response?.data?.message || 'Unable to load tree inventory for this orchard.',
            });
        } finally {
            setLoadingTrees(false);
        }
    };

    useEffect(() => {
        fetchFields();
    }, [radiusKm, selectedSpecies, minRating, location.latitude, location.longitude]);

    const handleFieldSelect = async (field) => {
        setSelectedField(field);
        await loadTrees(field.id);
    };

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            setBookingStatus({ type: 'error', message: 'Geolocation is not supported in this browser.' });
            return;
        }

        setGeoLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const nextLocation = {
                    latitude: position.coords.latitude.toFixed(5).toString(),
                    longitude: position.coords.longitude.toFixed(5).toString(),
                    zip: location.zip,
                };
                setLocation(nextLocation);
                setGeoLoading(false);
            },
            () => {
                setGeoLoading(false);
                setBookingStatus({ type: 'error', message: 'Location access was denied. Please enter latitude and longitude manually.' });
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleCheckout = async () => {
        if (!selectedTree) {
            setBookingStatus({ type: 'error', message: 'Please select a tree before checkout.' });
            return;
        }

        const userId = getCurrentUserId();
        if (!userId) {
            setBookingStatus({ type: 'error', message: 'Please log in before confirming the adoption.' });
            return;
        }

        const itemType = adoptionMode === 'WHOLE_TREE' ? 'WHOLE_TREE' : adoptionMode === 'BRANCH' ? 'BRANCH' : 'PERCENTAGE_SHARE';
        const itemId = adoptionMode === 'BRANCH' ? selectedBranch?.id : selectedTree.id;

        if (adoptionMode === 'BRANCH' && !selectedBranch) {
            setBookingStatus({ type: 'error', message: 'Please choose an available branch.' });
            return;
        }

        const payload = {
            userId,
            itemId,
            itemType,
            yieldPreference,
            ...(adoptionMode === 'PERCENTAGE_SHARE' ? { percentageShare } : {}),
        };

        setBookingStatus({ type: 'info', message: 'Placing your adoption request...' });

        try {
            const response = await api.post('/orders/checkout', payload);
            const order = response.data || {};
            const orderBadge = order.id ? `Booking ID: ${order.id}` : 'Booking confirmed';
            const passLine = order.passCode ? `Pass: ${order.passCode}` : '';
            const otpLine = order.otpCode ? ` OTP: ${order.otpCode}` : '';
            const qrLine = order.qrCodeUrl ? ` QR available: ${order.qrCodeUrl}` : '';
            const detailText = [orderBadge, passLine, otpLine, qrLine].filter(Boolean).join(' • ');
            setBookingStatus({ type: 'success', message: `Your orchard adoption request was placed successfully. ${detailText}` });
        } catch (error) {
            if (error.response?.status === 409) {
                setBookingStatus({ type: 'error', message: 'This orchard item is currently locked by another user. Please select another option.' });
            } else {
                setBookingStatus({ type: 'error', message: error.response?.data?.message || 'Unable to complete checkout right now.' });
            }
        }
    };

    const totalTreeYieldKg = useMemo(
        () => (selectedTree?.branches || []).reduce((sum, branch) => sum + (Number(branch.estimatedYieldKg) || 0), 0),
        [selectedTree]
    );

    const totalTreePrice = useMemo(
        () => (selectedTree?.branches || []).reduce((sum, branch) => sum + (Number(branch.price) || 0), 0),
        [selectedTree]
    );

    const activePrice = useMemo(() => {
        if (!selectedTree) return 0;
        if (adoptionMode === 'PERCENTAGE_SHARE') {
            const basePrice = totalTreePrice || 0;
            return Math.round((basePrice * Number(percentageShare)) / 100);
        }
        if (adoptionMode === 'BRANCH') {
            return Number(selectedBranch?.price || 0);
        }
        return totalTreePrice;
    }, [adoptionMode, percentageShare, selectedBranch, selectedTree, totalTreePrice]);

    const activeYield = useMemo(() => {
        if (!selectedTree) return 0;
        if (adoptionMode === 'PERCENTAGE_SHARE') {
            return Math.round((totalTreeYieldKg * Number(percentageShare)) / 100);
        }
        if (adoptionMode === 'BRANCH') {
            return Number(selectedBranch?.estimatedYieldKg || 0);
        }
        return totalTreeYieldKg;
    }, [adoptionMode, percentageShare, selectedBranch, selectedTree, totalTreeYieldKg]);

    const renderStars = (rating = 0) => Array.from({ length: 5 }, (_, index) => (
        <Star
            key={index}
            className={`h-4 w-4 ${index < Math.round(rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`}
        />
    ));

    const openBookingPage = (tree) => {
        if (!selectedField || !tree) return;

        navigate('/tree-booking', {
            state: {
                field: selectedField,
                tree,
                selectedBranchId: tree.branches?.find((branch) => branch.available)?.id || tree.branches?.[0]?.id || '',
            },
        });
    };

    const selectedDistanceKm = selectedField
        ? getDistanceKm(
            Number(location.latitude),
            Number(location.longitude),
            Number(selectedField.latitude),
            Number(selectedField.longitude)
        )
        : 0;

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="mb-6 rounded-[28px] border border-emerald-200 bg-gradient-to-r from-emerald-700 via-green-700 to-lime-600 p-5 text-white shadow-lg shadow-emerald-200/60">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
                            <Sparkles className="h-4 w-4" />
                            Book My Tree discovery
                        </p>
                        <h1 className="text-3xl font-black tracking-tight">Discover orchards around you</h1>
                    </div>
                    <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/30 transition hover:bg-white/15"
                    >
                        <LocateFixed className="h-4 w-4" />
                        {geoLoading ? 'Finding location...' : 'Use my location'}
                    </button>
                </div>

                <div className="mt-6 grid gap-3 lg:grid-cols-[1.2fr_1fr_0.9fr_0.8fr_0.9fr]">
                    <label className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">Latitude</span>
                        <input
                            value={location.latitude}
                            onChange={(event) => setLocation((current) => ({ ...current, latitude: event.target.value }))}
                            className="w-full bg-transparent text-base font-medium text-white placeholder:text-emerald-100/80 focus:outline-none"
                            placeholder="19.0760"
                        />
                    </label>

                    <label className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">Longitude</span>
                        <input
                            value={location.longitude}
                            onChange={(event) => setLocation((current) => ({ ...current, longitude: event.target.value }))}
                            className="w-full bg-transparent text-base font-medium text-white placeholder:text-emerald-100/80 focus:outline-none"
                            placeholder="72.8777"
                        />
                    </label>

                    <label className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">ZIP / PIN</span>
                        <input
                            value={location.zip}
                            onChange={(event) => setLocation((current) => ({ ...current, zip: event.target.value }))}
                            className="w-full bg-transparent text-base font-medium text-white placeholder:text-emerald-100/80 focus:outline-none"
                            placeholder="400001"
                        />
                    </label>

                    <label className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">Radius</span>
                        <div className="flex items-center gap-2">
                            <input
                                type="range"
                                min="1"
                                max="50"
                                value={radiusKm}
                                onChange={(event) => setRadiusKm(Number(event.target.value))}
                                className="w-full accent-emerald-200"
                            />
                            <span className="text-sm font-semibold">{radiusKm} km</span>
                        </div>
                    </label>

                    <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">Search</span>
                        <div className="flex items-center gap-2">
                            <Search className="h-4 w-4 text-emerald-100" />
                            <input
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder="Mango, field name, farmer name"
                                className="w-full bg-transparent text-base font-medium text-white placeholder:text-emerald-100/80 focus:outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <button
                            type="button"
                            onClick={() => fetchFields()}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
                        >
                            <Search className="h-4 w-4" />
                            Search farms
                        </button>
                        <label className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-emerald-50 ring-1 ring-white/15">
                            <input
                                type="checkbox"
                                checked={searchWorldWide}
                                onChange={(event) => setSearchWorldWide(event.target.checked)}
                                className="h-4 w-4 accent-emerald-300"
                            />
                            Search anywhere in the world
                        </label>
                    </div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr]">
                    <label className="flex items-center gap-3 rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
                        <SlidersHorizontal className="h-4 w-4 text-emerald-100" />
                        <select
                            value={selectedSpecies}
                            onChange={(event) => setSelectedSpecies(event.target.value)}
                            className="w-full bg-transparent text-sm font-medium text-white focus:outline-none"
                        >
                            {speciesOptions.map((species) => (
                                <option key={species} value={species} className="text-stone-800">
                                    {species === 'ALL' ? 'All tree species' : species}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="flex items-center gap-3 rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
                        <Star className="h-4 w-4 text-emerald-100" />
                        <select
                            value={minRating}
                            onChange={(event) => setMinRating(event.target.value)}
                            className="w-full bg-transparent text-sm font-medium text-white focus:outline-none"
                        >
                            <option value="0" className="text-stone-800">Any rating</option>
                            <option value="3" className="text-stone-800">3.0+ rating</option>
                            <option value="4" className="text-stone-800">4.0+ rating</option>
                            <option value="4.5" className="text-stone-800">4.5+ rating</option>
                        </select>
                    </label>
                </div>
            </div>

            {bookingStatus.message && (
                <div className={`mb-6 rounded-2xl border px-4 py-3 text-sm font-medium ${bookingStatus.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : bookingStatus.type === 'error'
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                    {bookingStatus.message}
                </div>
            )}

            <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
                <aside className="space-y-4">
                    <div className="rounded-[28px] border border-stone-200 bg-white p-4 shadow-md shadow-stone-100/60">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-black text-stone-900">Nearby orchards</h2>
                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">{fields.length}</span>
                        </div>

                        {loadingFields ? (
                            <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-6 text-sm text-stone-500">
                                Finding orchards near your location...
                            </div>
                        ) : fields.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-6 text-sm text-stone-500">
                                No matching orchards were found for the selected filters.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {fields.map((field) => {
                                    const distance = getDistanceKm(
                                        Number(location.latitude),
                                        Number(location.longitude),
                                        Number(field.latitude),
                                        Number(field.longitude)
                                    );

                                    return (
                                        <button
                                            key={field.id}
                                            type="button"
                                            onClick={() => handleFieldSelect(field)}
                                            className={`w-full rounded-2xl border p-4 text-left transition ${selectedField?.id === field.id ? 'border-emerald-400 bg-emerald-50 shadow-sm' : 'border-stone-200 bg-stone-50 hover:border-emerald-200 hover:bg-emerald-50/30'}`}
                                        >
                                            <div className="mb-3 flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-lg font-black text-stone-900">{field.name}</p>
                                                    <p className="mt-1 flex items-center gap-1 text-xs text-stone-500">
                                                        <MapPin className="h-3.5 w-3.5" />
                                                        {distance.toFixed(1)} km away
                                                    </p>
                                                </div>
                                                <div className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
                                                    {field.totalTreesCount || 0} trees
                                                </div>
                                            </div>

                                            <div className="mb-3 flex items-center gap-2">
                                                <div className="flex items-center gap-1">{renderStars(field.rating || 0)}</div>
                                                <span className="text-sm font-semibold text-stone-700">{Number(field.rating || 0).toFixed(1)}</span>
                                            </div>

                                            <div className="flex items-center justify-between text-sm text-stone-600">
                                                <span>Farmer</span>
                                                <span className="font-medium text-stone-800">#{field.farmerId?.slice(0, 8) || 'Local grower'}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </aside>

                <main className="space-y-6">
                    {selectedField ? (
                        <>
                            <section className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-md shadow-stone-100/60">
                                <div className="border-b border-stone-200 bg-gradient-to-r from-emerald-50 via-white to-lime-50 p-5">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Orchard detail</p>
                                            <h2 className="mt-2 text-3xl font-black text-stone-900">{selectedField.name}</h2>
                                        </div>
                                        <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-800">
                                            <BadgeCheck className="h-4 w-4" />
                                            {Number(selectedField.rating || 0).toFixed(1)} rating
                                        </div>
                                    </div>

                                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                                        <div className="rounded-2xl border border-stone-200 bg-white p-4">
                                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Distance</p>
                                            <p className="mt-2 text-xl font-black text-stone-900">
                                                {getDistanceKm(
                                                    Number(location.latitude),
                                                    Number(location.longitude),
                                                    Number(selectedField.latitude),
                                                    Number(selectedField.longitude)
                                                ).toFixed(1)} km
                                            </p>
                                        </div>
                                        <div className="rounded-2xl border border-stone-200 bg-white p-4">
                                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">ETA</p>
                                            <p className="mt-2 text-xl font-black text-stone-900">{Math.max(12, Math.round(selectedDistanceKm * 7.5))} min</p>
                                        </div>
                                        <div className="rounded-2xl border border-stone-200 bg-white p-4">
                                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Farmer</p>
                                            <p className="mt-2 text-lg font-black text-stone-900">Verified grower</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5">
                                    <div className="mb-4 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2 text-green-700">
                                            <Trees className="h-5 w-5" />
                                            <h3 className="text-xl font-black text-stone-900">Tree inventory</h3>
                                        </div>
                                        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
                                            {treeInventory.length} trees found
                                        </span>
                                    </div>

                                    {loadingTrees ? (
                                        <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-6 text-sm text-stone-500">
                                            Loading orchard trees and branch data...
                                        </div>
                                    ) : treeInventory.length === 0 ? (
                                        <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-6 text-sm text-stone-500">
                                            No trees available in this field yet.
                                        </div>
                                    ) : (
                                        <div className="max-h-[680px] space-y-3 overflow-y-auto pr-1">
                                            {groupedTreeInventory.map((group) => {
                                                const isExpanded = expandedSpecies[group.species] ?? true;
                                                const totalBranches = group.trees.reduce((sum, tree) => sum + (tree.branches?.length || 0), 0);
                                                const availableBranches = group.trees.reduce((sum, tree) => sum + (tree.branches?.filter((branch) => branch.available).length || 0), 0);

                                                return (
                                                    <div key={group.species} className="rounded-[24px] border border-stone-200 bg-stone-50 p-3 shadow-sm">
                                                        <button
                                                            type="button"
                                                            onClick={() => setExpandedSpecies((current) => ({ ...current, [group.species]: !isExpanded }))}
                                                            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-3 text-left transition hover:border-emerald-300"
                                                        >
                                                            <div>
                                                                <p className="text-lg font-black text-stone-900">{group.species}</p>
                                                                <p className="text-xs text-stone-500">{group.trees.length} trees • {availableBranches} available branches</p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                                                                    {group.trees.length}
                                                                </span>
                                                                <ArrowRight className={`h-4 w-4 text-stone-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                            </div>
                                                        </button>

                                                        {isExpanded && (
                                                            <div className="mt-3 space-y-3">
                                                                {group.trees.map((tree) => (
                                                                    <div
                                                                        key={tree.id}
                                                                        className={`rounded-[20px] border p-3 text-left transition ${selectedTree?.id === tree.id ? 'border-emerald-400 bg-emerald-50 shadow-sm' : 'border-stone-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/30'}`}
                                                                    >
                                                                        <div className="mb-2 flex items-start justify-between gap-3">
                                                                            <div>
                                                                                <p className="text-base font-black text-stone-900">Tree #{String(tree.id).slice(0, 6)}</p>
                                                                                <div className="mt-1 flex items-center gap-2 text-xs text-stone-500">
                                                                                    <MapPin className="h-3.5 w-3.5" />
                                                                                    {tree.latitude}, {tree.longitude}
                                                                                </div>
                                                                            </div>
                                                                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${stageStyles[tree.stage] || 'bg-stone-200 text-stone-700'}`}>
                                                                                {tree.stage || 'MATURE'}
                                                                            </span>
                                                                        </div>

                                                                        <div className="mb-3 flex items-center justify-between text-sm text-stone-600">
                                                                            <span>{(tree.branches || []).length} branches</span>
                                                                            <span className="font-semibold text-stone-800">{(tree.branches || []).filter((branch) => branch.available).length} available</span>
                                                                        </div>

                                                                        <div className="flex items-center gap-2">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setSelectedTree(tree);
                                                                                    setSelectedBranchId(tree.branches?.find((branch) => branch.available)?.id || tree.branches?.[0]?.id || '');
                                                                                }}
                                                                                className="flex-1 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                                                                            >
                                                                                {selectedTree?.id === tree.id ? 'Selected' : 'Select tree'}
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => openBookingPage(tree)}
                                                                                className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800"
                                                                            >
                                                                                Book
                                                                                <ArrowRight className="h-3.5 w-3.5" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </section>

                            {selectedTree && (
                                <section className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-md shadow-stone-100/60">
                                    <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Tree booking</p>
                                            <h3 className="mt-2 text-2xl font-black text-stone-900">{selectedTree.species}</h3>
                                        </div>
                                        <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-700">
                                            <Sprout className="h-4 w-4" />
                                            {activeYield} kg selected
                                        </div>
                                    </div>

                                    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                                        <div className="space-y-4">
                                            <div className="grid gap-2 sm:grid-cols-3">
                                                {adoptionModes.map((mode) => (
                                                    <button
                                                        key={mode.value}
                                                        type="button"
                                                        onClick={() => setAdoptionMode(mode.value)}
                                                        className={`rounded-2xl border p-3 text-left transition ${adoptionMode === mode.value ? 'border-emerald-400 bg-emerald-50' : 'border-stone-200 bg-stone-50 hover:border-stone-300'}`}
                                                    >
                                                        <p className="text-sm font-bold text-stone-900">{mode.label}</p>
                                                        <p className="mt-1 text-xs text-stone-500">{mode.description}</p>
                                                    </button>
                                                ))}
                                            </div>

                                            {selectedTree.branches?.length ? (
                                                <div className="space-y-3">
                                                    {selectedTree.branches.map((branch) => (
                                                        <button
                                                            key={branch.id}
                                                            type="button"
                                                            onClick={() => setSelectedBranchId(branch.id)}
                                                            className={`flex w-full items-center justify-between rounded-2xl border p-3 text-left transition ${selectedBranchId === branch.id ? 'border-emerald-400 bg-emerald-50' : 'border-stone-200 bg-stone-50 hover:border-stone-300'}`}
                                                            disabled={!branch.available && adoptionMode === 'BRANCH'}
                                                        >
                                                            <div>
                                                                <p className="text-base font-bold text-stone-900">{branch.branchIdentifier}</p>
                                                                <p className="text-sm text-stone-600">{branch.estimatedYieldKg} kg • ₹{Number(branch.price).toLocaleString()}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${branch.available ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                                    {branch.available ? 'Available' : 'Booked'}
                                                                </span>
                                                                {!branch.available && branch.bookingId && (
                                                                    <p className="mt-1 text-[10px] font-semibold text-red-700">Booking #{String(branch.bookingId).slice(0, 8)}</p>
                                                                )}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-4 text-sm text-stone-500">
                                                    This tree does not yet have branch-level inventory.
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Summary</p>
                                                <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                                                    <div className="rounded-xl bg-white p-3">
                                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Yield</p>
                                                        <p className="mt-1 text-2xl font-black text-stone-900">{activeYield} kg</p>
                                                    </div>
                                                    <div className="rounded-xl bg-white p-3">
                                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Price</p>
                                                        <p className="mt-1 text-2xl font-black text-stone-900">₹{activePrice.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                                                <p className="mb-3 text-sm font-bold text-stone-900">Delivery preference</p>
                                                <div className="space-y-2">
                                                    {yieldOptions.map((option) => {
                                                        const Icon = option.icon;
                                                        return (
                                                            <button
                                                                key={option.value}
                                                                type="button"
                                                                onClick={() => setYieldPreference(option.value)}
                                                                className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${yieldPreference === option.value ? 'border-emerald-400 bg-emerald-50' : 'border-stone-200 bg-white hover:border-stone-300'}`}
                                                            >
                                                                <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                                                                    <Icon className="h-4 w-4" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-stone-900">{option.label}</p>
                                                                    <p className="mt-1 text-xs text-stone-500">{option.description}</p>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {adoptionMode === 'PERCENTAGE_SHARE' && (
                                                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                                                    <div className="mb-2 flex items-center justify-between text-sm font-semibold text-stone-700">
                                                        <span>Share percentage</span>
                                                        <span>{percentageShare}%</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="5"
                                                        max="100"
                                                        value={percentageShare}
                                                        onChange={(event) => setPercentageShare(Number(event.target.value))}
                                                        className="w-full accent-emerald-600"
                                                    />
                                                </div>
                                            )}

                                            <button
                                                type="button"
                                                onClick={handleCheckout}
                                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-700 to-green-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:from-emerald-800 hover:to-green-700"
                                            >
                                                Confirm adoption
                                                <ArrowRight className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </section>
                            )}
                        </>
                    ) : (
                        <div className="rounded-[28px] border border-dashed border-stone-300 bg-white p-12 text-center text-stone-500 shadow-sm">
                            Select an orchard to inspect the field and book a tree.
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
