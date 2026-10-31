import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    ArrowLeft,
    BadgeCheck,
    CircleDollarSign,
    Clock3,
    HandCoins,
    HeartHandshake,
    MapPinned,
    Percent,
    ShieldAlert,
    ShoppingCart,
    Sprout,
    Trees,
    Truck,
} from 'lucide-react';
import api from '../services/api';

const adoptionModes = [
    { value: 'WHOLE_TREE', label: 'Whole Tree', description: 'Adopt the full tree' },
    { value: 'BRANCH', label: 'Specific Branch', description: 'Adopt selected limb(s)' },
    { value: 'PERCENTAGE_SHARE', label: 'Percentage Share', description: 'Fractional ownership' },
];

const lifecycleStages = {
    FLOWERING: {
        label: 'Flowering',
        badge: 'bg-pink-100 text-pink-700',
        note: 'Flowers are opening and pollination is active. The harvest window is still developing and fruit set is expected in 4–6 weeks.',
    },
    FRUIT_SET: {
        label: 'Fruit Set',
        badge: 'bg-amber-100 text-amber-700',
        note: 'Fruit is setting across the canopy. This stage indicates a strong upcoming harvest, though the fruits are still maturing.',
    },
    MATURE: {
        label: 'Mature',
        badge: 'bg-emerald-100 text-emerald-700',
        note: 'The tree is in peak productivity. Mature trees are typically ready for harvest or expected to yield large, market-ready output.',
    },
    Mature: {
        label: 'Mature',
        badge: 'bg-emerald-100 text-emerald-700',
        note: 'The tree is in peak productivity. Mature trees are typically ready for harvest or expected to yield large, market-ready output.',
    },
    HARVESTED: {
        label: 'Harvested',
        badge: 'bg-slate-200 text-slate-700',
        note: 'The active crop has already been collected. This is a resting or regenerative stage for the next season cycle.',
    },
};

const yieldOptions = [
    {
        value: 'PARCEL_DELIVERY',
        label: 'Parcel Delivery',
        description: 'Direct orchard-to-doorstep delivery.',
        icon: Truck,
    },
    {
        value: 'RESELL_PROFIT_SHARE',
        label: 'Resell / Profit Share',
        description: 'The orchard sells the crop and shares the proceeds.',
        icon: HandCoins,
    },
    {
        value: 'DONATION',
        label: '100% Donation',
        description: 'Your harvest is donated to community programs.',
        icon: HeartHandshake,
    },
];

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

function Tree3DPreview() {
    return (
        <div className="relative h-[420px] w-full overflow-hidden rounded-[30px] border border-emerald-200 bg-gradient-to-b from-[#ebf9ee] via-[#dff4d0] to-[#a9d77d] shadow-inner shadow-emerald-200/60">
            <div className="absolute inset-x-10 bottom-0 h-10 rounded-full bg-emerald-900/15 blur-xl" />
            <div className="absolute inset-x-0 bottom-0 h-[72px] bg-gradient-to-t from-emerald-900/15 to-transparent" />

            <div className="absolute left-1/2 top-20 h-32 w-4 -translate-x-1/2 rounded-full bg-gradient-to-b from-amber-700 via-amber-800 to-amber-950 shadow-lg shadow-amber-900/20" />
            <div className="absolute left-1/2 top-28 h-2.5 w-16 -translate-x-1/2 rounded-full bg-amber-800/90" />

            <div className="absolute left-1/2 top-20 h-24 w-24 -translate-x-1/2 rounded-full bg-gradient-to-br from-emerald-200 via-emerald-400 to-green-600 opacity-90 shadow-[0_18px_30px_rgba(22,101,52,0.28)]" />
            <div className="absolute left-[34%] top-[22%] h-16 w-16 rounded-full bg-gradient-to-br from-green-100 via-lime-300 to-emerald-500 opacity-90" />
            <div className="absolute right-[34%] top-[19%] h-14 w-14 rounded-full bg-gradient-to-br from-green-100 via-lime-300 to-emerald-500 opacity-90" />
            <div className="absolute left-[25%] top-[31%] h-14 w-14 rounded-full bg-gradient-to-br from-lime-100 via-green-400 to-emerald-600 opacity-90" />
            <div className="absolute right-[25%] top-[31%] h-14 w-14 rounded-full bg-gradient-to-br from-lime-100 via-green-400 to-emerald-600 opacity-90" />
            <div className="absolute left-1/2 top-[18%] h-12 w-12 -translate-x-1/2 rounded-full bg-gradient-to-br from-lime-50 via-green-200 to-emerald-500 opacity-90" />

            <div className="absolute left-[42%] top-[30%] h-20 w-2 origin-left rotate-[-38deg] rounded-full bg-gradient-to-b from-amber-700 to-amber-900 shadow-md" />
            <div className="absolute left-[58%] top-[30%] h-20 w-2 origin-right rotate-[38deg] rounded-full bg-gradient-to-b from-amber-700 to-amber-900 shadow-md" />
            <div className="absolute left-[48%] top-[24%] h-[72px] w-2 origin-left rotate-[-22deg] rounded-full bg-gradient-to-b from-amber-700 to-amber-900 shadow-md" />
            <div className="absolute left-[52%] top-[24%] h-[72px] w-2 origin-right rotate-[22deg] rounded-full bg-gradient-to-b from-amber-700 to-amber-900 shadow-md" />

            <div className="absolute left-[26%] top-[47%] h-14 w-2 origin-left rotate-[-58deg] rounded-full bg-gradient-to-b from-amber-700 to-amber-900 shadow-md" />
            <div className="absolute right-[26%] top-[47%] h-14 w-2 origin-right rotate-[58deg] rounded-full bg-gradient-to-b from-amber-700 to-amber-900 shadow-md" />

            <div className="absolute left-[30%] top-[18%] h-3 w-3 rounded-full bg-amber-200 shadow-[0_0_14px_rgba(253,224,71,0.7)]" />
            <div className="absolute right-[31%] top-[16%] h-3 w-3 rounded-full bg-amber-200 shadow-[0_0_14px_rgba(253,224,71,0.7)]" />
            <div className="absolute left-[50%] top-[12%] h-4 w-4 rounded-full bg-amber-200 shadow-[0_0_14px_rgba(253,224,71,0.7)]" />
            <div className="absolute left-[58%] top-[35%] h-3 w-3 rounded-full bg-amber-200 shadow-[0_0_12px_rgba(253,224,71,0.7)]" />
            <div className="absolute left-[38%] top-[35%] h-3 w-3 rounded-full bg-amber-200 shadow-[0_0_12px_rgba(253,224,71,0.7)]" />
        </div>
    );
}

export default function TreeBookingPage() {
    const location = useLocation();
    const routeState = location.state || {};
    const [fieldDetails, setFieldDetails] = useState(routeState.field || null);
    const [treeSummary, setTreeSummary] = useState(routeState.tree || null);
    const [branches, setBranches] = useState(routeState.tree?.branches || []);
    const [selectedBranchId, setSelectedBranchId] = useState(routeState.selectedBranchId || '');
    const [selectedYield, setSelectedYield] = useState('PARCEL_DELIVERY');
    const [selectedMode, setSelectedMode] = useState('BRANCH');
    const [percentageShare, setPercentageShare] = useState(25);
    const [checkpoint, setCheckpoint] = useState('');
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [isLoading, setIsLoading] = useState(!routeState.tree);

    useEffect(() => {
        const hydrateFromApi = async () => {
            if (routeState.field && routeState.tree) {
                setFieldDetails(routeState.field);
                setTreeSummary(routeState.tree);
                setBranches(routeState.tree.branches || []);
                setSelectedBranchId(routeState.selectedBranchId || routeState.tree.branches?.find((branch) => branch.available)?.id || routeState.tree.branches?.[0]?.id || '');
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);

                const nearbyFields = await api.get('/fields/search', {
                    params: {
                        query: 'mango',
                        lat: 19.076,
                        lng: 72.8777,
                        radiusKm: 12,
                    },
                });

                const nextField = nearbyFields.data?.[0];
                if (!nextField) {
                    setCheckpoint('No orchard is currently available for booking.');
                    setIsLoading(false);
                    return;
                }

                setFieldDetails(nextField);

                const inventory = await api.get(`/fields/${nextField.id}/trees`);
                const nextTree = inventory.data?.[0];
                if (!nextTree) {
                    setTreeSummary(null);
                    setBranches([]);
                    setIsLoading(false);
                    return;
                }

                setTreeSummary(nextTree);
                setBranches(nextTree.branches || []);
                setSelectedBranchId(nextTree.branches?.find((branch) => branch.available)?.id || nextTree.branches?.[0]?.id || '');
            } catch (error) {
                setCheckpoint(error.response?.data?.message || 'Unable to load orchard data right now.');
            } finally {
                setIsLoading(false);
            }
        };

        hydrateFromApi();
    }, [routeState.field, routeState.tree, routeState.selectedBranchId]);

    const selectedBranch = useMemo(
        () => branches.find((branch) => branch.id === selectedBranchId) || branches[0] || null,
        [branches, selectedBranchId]
    );

    const stage = treeSummary ? (lifecycleStages[treeSummary.stage] || lifecycleStages.MATURE) : lifecycleStages.MATURE;

    const totalYieldKg = Number(treeSummary?.branches?.reduce((sum, branch) => sum + (Number(branch.estimatedYieldKg) || 0), 0) || 0);
    const totalPrice = Number(treeSummary?.branches?.reduce((sum, branch) => sum + (Number(branch.price) || 0), 0) || 0);

    const shareYieldKg = Math.round((totalYieldKg * percentageShare) / 100);
    const sharePrice = Math.round((totalPrice * percentageShare) / 100);

    const activeItemType = selectedMode === 'WHOLE_TREE' ? 'WHOLE_TREE' : selectedMode === 'BRANCH' ? 'BRANCH' : 'PERCENTAGE_SHARE';
    const activeItemId = selectedMode === 'BRANCH' ? selectedBranch?.id : treeSummary?.id;
    const activeYield = selectedMode === 'PERCENTAGE_SHARE' ? shareYieldKg : selectedMode === 'WHOLE_TREE' ? totalYieldKg : selectedBranch?.estimatedYieldKg || 0;
    const activePrice = selectedMode === 'PERCENTAGE_SHARE' ? sharePrice : selectedMode === 'WHOLE_TREE' ? totalPrice : Number(selectedBranch?.price || 0);

    const handleCheckout = async () => {
        const userId = getCurrentUserId();

        if (selectedMode === 'BRANCH' && (!selectedBranch || selectedBranch.status === 'booked')) {
            setCheckpoint('This branch is no longer available. Please choose another one.');
            return;
        }

        if (!userId) {
            setCheckpoint('Please log in before confirming the tree adoption.');
            return;
        }

        setIsCheckingOut(true);
        setCheckpoint('');

        const payload = {
            userId,
            itemId: activeItemId,
            branchId: selectedMode === 'BRANCH' ? activeItemId : undefined,
            itemType: activeItemType,
            yieldPreference: selectedYield,
            ...(activeItemType === 'PERCENTAGE_SHARE' ? { percentageShare } : {}),
        };

        try {
            const response = await api.post('/orders/checkout', payload);
            const order = response?.data || {};
            const successMessage = order.passCode
                ? `Your booking request has been placed successfully. Pass: ${order.passCode} • OTP: ${order.otpCode || 'n/a'}`
                : 'Your booking request has been placed successfully.';

            if (selectedMode === 'BRANCH') {
                setBranches((current) =>
                    current.map((branch) =>
                        branch.id === selectedBranch.id ? { ...branch, available: false, booked: true, bookingId: order.id || branch.bookingId } : branch
                    )
                );
            }

            setCheckpoint(successMessage);
        } catch (error) {
            if (error.response?.status === 409) {
                setCheckpoint('This branch is currently locked by another user. Please select another item and try again.');
            } else {
                setCheckpoint(error.response?.data?.message || 'Unable to complete checkout right now. Please try again in a moment.');
            }
        } finally {
            setIsCheckingOut(false);
        }
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to home
                    </Link>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-700">
                    <Sprout className="h-4 w-4" />
                    Orchard booking available
                </div>
            </div>

            {isLoading ? (
                <div className="rounded-[28px] border border-dashed border-stone-300 bg-white p-12 text-center text-stone-500 shadow-sm">
                    Loading orchard inventory and booking details...
                </div>
            ) : !treeSummary ? (
                <div className="rounded-[28px] border border-dashed border-stone-300 bg-white p-12 text-center text-stone-500 shadow-sm">
                    No tree inventory is available for this orchard right now.
                </div>
            ) : (
                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <section className="rounded-[28px] border border-emerald-200 bg-white p-5 shadow-xl shadow-emerald-100/60">
                        <div className="mb-5 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Tree profile</p>
                                <h1 className="mt-2 text-3xl font-black text-stone-900">{treeSummary.species} Orchard - {fieldDetails?.name || 'Selected Plot'}</h1>
                            </div>
                            <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${stage.badge}`}>
                                {stage.label}
                            </span>
                        </div>

                        <Tree3DPreview />

                        <div className="mt-6 grid gap-4 md:grid-cols-3">
                            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                                <div className="mb-2 flex items-center gap-2 text-emerald-700">
                                    <Trees className="h-4 w-4" />
                                    <span className="text-xs font-semibold uppercase tracking-[0.18em]">Species</span>
                                </div>
                                <p className="text-xl font-black text-stone-900">{treeSummary.species}</p>
                            </div>

                            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                                <div className="mb-2 flex items-center gap-2 text-emerald-700">
                                    <MapPinned className="h-4 w-4" />
                                    <span className="text-xs font-semibold uppercase tracking-[0.18em]">GPS</span>
                                </div>
                                <p className="text-sm font-bold text-stone-900">
                                    {treeSummary.latitude ?? fieldDetails?.latitude ?? '19.0760'}° N • {treeSummary.longitude ?? fieldDetails?.longitude ?? '72.8777'}° E
                                </p>
                            </div>

                            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                                <div className="mb-2 flex items-center gap-2 text-emerald-700">
                                    <Clock3 className="h-4 w-4" />
                                    <span className="text-xs font-semibold uppercase tracking-[0.18em]">Timeline</span>
                                </div>
                                <p className="text-xl font-black text-stone-900">4–6 weeks</p>
                                <p className="text-sm text-stone-600">to peak harvest</p>
                            </div>
                        </div>

                        <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50 p-4">
                            <div className="mb-2 flex items-center gap-2 text-stone-700">
                                <BadgeCheck className="h-5 w-5 text-emerald-600" />
                                <span className="text-sm font-bold uppercase tracking-[0.18em]">Growth stage note</span>
                            </div>
                            <p className="text-sm leading-6 text-stone-600">{stage.note}</p>
                        </div>
                    </section>

                    <aside className="space-y-6">
                        <div className="rounded-[28px] border border-emerald-200 bg-white p-5 shadow-xl shadow-emerald-100/60">
                            <div className="mb-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Adoption type</p>
                                <h2 className="mt-1 text-xl font-black text-stone-900">Choose booking mode</h2>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-3">
                                {adoptionModes.map((mode) => (
                                    <button
                                        key={mode.value}
                                        type="button"
                                        onClick={() => setSelectedMode(mode.value)}
                                        className={`rounded-2xl border p-3 text-left transition ${selectedMode === mode.value
                                            ? 'border-emerald-400 bg-emerald-50 shadow-md'
                                            : 'border-stone-200 bg-stone-50 hover:border-emerald-300'
                                            }`}
                                    >
                                        <div className="text-sm font-bold text-stone-900">{mode.label}</div>
                                        <div className="mt-1 text-[11px] text-stone-600">{mode.description}</div>
                                    </button>
                                ))}
                            </div>

                            {selectedMode === 'WHOLE_TREE' && (
                                <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                                    <div className="flex items-center justify-between text-sm text-stone-600">
                                        <span>Estimated yield</span>
                                        <strong className="text-stone-900">{totalYieldKg} kg</strong>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between text-sm text-stone-600">
                                        <span>Total price</span>
                                        <strong className="text-stone-900">₹{totalPrice}</strong>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between text-sm text-stone-600">
                                        <span>Lifecycle</span>
                                        <strong className="text-stone-900">{stage.label}</strong>
                                    </div>
                                </div>
                            )}

                            {selectedMode === 'PERCENTAGE_SHARE' && (
                                <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                                    <div className="mb-2 flex items-center justify-between text-sm text-stone-700">
                                        <span className="font-medium">Ownership share</span>
                                        <strong className="text-stone-900">{percentageShare}%</strong>
                                    </div>
                                    <input
                                        type="range"
                                        min="10"
                                        max="100"
                                        step="5"
                                        value={percentageShare}
                                        onChange={(event) => setPercentageShare(Number(event.target.value))}
                                        className="h-2 w-full accent-emerald-600"
                                    />
                                    <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[11px] font-semibold text-stone-600">
                                        {[10, 25, 50, 100].map((value) => (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => setPercentageShare(value)}
                                                className={`rounded-full px-2 py-1 ${percentageShare === value ? 'bg-emerald-700 text-white' : 'bg-white text-stone-600'}`}
                                            >
                                                {value}%
                                            </button>
                                        ))}
                                    </div>
                                    <div className="mt-4 grid gap-2 text-sm text-stone-600">
                                        <div className="flex items-center justify-between">
                                            <span>Pro-rata yield</span>
                                            <strong className="text-stone-900">{shareYieldKg} kg</strong>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span>Pro-rata price</span>
                                            <strong className="text-stone-900">₹{sharePrice}</strong>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {selectedMode === 'BRANCH' && (
                                <div className="mt-5 space-y-3">
                                    {branches.map((branch) => {
                                        const isSelected = branch.id === selectedBranchId;
                                        const isBooked = !branch.available || !!branch.bookingId;

                                        return (
                                            <button
                                                key={branch.id}
                                                type="button"
                                                onClick={() => !isBooked && setSelectedBranchId(branch.id)}
                                                className={`w-full rounded-2xl border p-3 text-left transition ${isSelected
                                                    ? 'border-emerald-400 bg-emerald-50 shadow-md'
                                                    : 'border-stone-200 bg-stone-50 hover:border-emerald-300 hover:bg-emerald-50/50'
                                                    } ${isBooked ? 'cursor-not-allowed opacity-75' : ''}`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-sm font-bold text-stone-900">{branch.branchIdentifier || branch.name || 'Branch'}</p>
                                                        <p className="mt-1 text-xs text-stone-500">{branch.quality || 'Available fruiting branch'}</p>
                                                    </div>
                                                    <span
                                                        className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${isBooked ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                                                            }`}
                                                    >
                                                        {isBooked ? 'Booked' : 'Available'}
                                                    </span>
                                                </div>

                                                <div className="mt-3 flex items-center justify-between text-sm text-stone-600">
                                                    <span>Estimated yield</span>
                                                    <strong className="font-bold text-stone-900">{branch.estimatedYieldKg || branch.yieldKg || 0} kg</strong>
                                                </div>
                                                <div className="mt-2 flex items-center justify-between text-sm text-stone-600">
                                                    <span>Price</span>
                                                    <strong className="font-bold text-stone-900">₹{Number(branch.price || 0).toLocaleString()}</strong>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="rounded-[28px] border border-emerald-200 bg-white p-5 shadow-xl shadow-emerald-100/60">
                            <div className="mb-4 flex items-center gap-2">
                                <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                                    <ShoppingCart className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Options</p>
                                    <h2 className="text-xl font-black text-stone-900">Yield preference</h2>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {yieldOptions.map((option) => {
                                    const Icon = option.icon;
                                    const active = selectedYield === option.value;

                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setSelectedYield(option.value)}
                                            className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition ${active ? 'border-emerald-400 bg-emerald-50' : 'border-stone-200 bg-stone-50 hover:border-emerald-300'
                                                }`}
                                        >
                                            <div className={`rounded-xl p-2 ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600'}`}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="font-bold text-stone-900">{option.label}</div>
                                                <div className="text-xs text-stone-600">{option.description}</div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-5 rounded-2xl border border-stone-200 bg-stone-50 p-4">
                                <div className="mb-3 flex items-center justify-between text-sm text-stone-600">
                                    <span>Selected adoption</span>
                                    <strong className="text-stone-900">
                                        {selectedMode === 'WHOLE_TREE' ? 'Whole Tree' : selectedMode === 'BRANCH' ? (selectedBranch?.branchIdentifier || selectedBranch?.name || 'Branch') : `${percentageShare}% share`}
                                    </strong>
                                </div>
                                <div className="mb-3 flex items-center justify-between text-sm text-stone-600">
                                    <span>Estimated yield</span>
                                    <strong className="text-stone-900">{activeYield} kg</strong>
                                </div>
                                <div className="flex items-center justify-between text-sm text-stone-600">
                                    <span>Price</span>
                                    <strong className="text-stone-900">₹{Number(activePrice || 0).toLocaleString()}</strong>
                                </div>
                            </div>

                            {checkpoint && (
                                <div
                                    className={`mt-4 flex items-start gap-2 rounded-2xl border px-3 py-2 text-sm ${checkpoint.toLowerCase().includes('success')
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                        : 'border-red-200 bg-red-50 text-red-700'
                                        }`}
                                >
                                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                                    <span>{checkpoint}</span>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={handleCheckout}
                                disabled={isCheckingOut || (selectedMode === 'BRANCH' && (!selectedBranch || !selectedBranch.available))}
                                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-green-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-stone-300"
                            >
                                {isCheckingOut ? 'Processing booking...' : 'Checkout & Confirm Adoption'}
                                {!isCheckingOut && <CircleDollarSign className="h-4 w-4" />}
                            </button>
                        </div>
                    </aside>
                </div>
            )}
        </div>
    );
}
