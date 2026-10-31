import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Layers3, Leaf, Map, Plus, Save, Trees, Trash2 } from 'lucide-react';
import api from '../services/api';

const assetLibrary = [
    { id: 'tree', label: 'Tree', color: 'bg-emerald-500', shadow: 'shadow-emerald-500/30', icon: Leaf },
    { id: 'pond', label: 'Pond', color: 'bg-sky-500', shadow: 'shadow-sky-500/30', icon: Map },
    { id: 'greenhouse', label: 'Greenhouse', color: 'bg-lime-500', shadow: 'shadow-lime-500/30', icon: Layers3 },
    { id: 'path', label: 'Path', color: 'bg-amber-500', shadow: 'shadow-amber-500/30', icon: ArrowRight },
];

const initialLayout = [
    { id: 'A1', type: 'tree', x: 12, y: 20, label: 'Mango' },
    { id: 'A2', type: 'tree', x: 34, y: 38, label: 'Orange' },
    { id: 'A3', type: 'pond', x: 66, y: 58, label: 'Pond' },
    { id: 'A4', type: 'greenhouse', x: 76, y: 26, label: 'Polyhouse' },
    { id: 'A5', type: 'path', x: 48, y: 70, label: 'Path' },
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

const getInventoryStorageKey = (userId) => `bookmytree_adoption_inventory_${userId}`;

const getStoredAdoptionInventory = (userId) => {
    if (!userId) return [];

    try {
        const stored = localStorage.getItem(getInventoryStorageKey(userId));
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

const saveStoredAdoptionInventory = (userId, inventory) => {
    if (!userId) return;
    localStorage.setItem(getInventoryStorageKey(userId), JSON.stringify(inventory));
};

const mapTypeToCropSpecies = (type, label) => {
    if (type === 'tree') return label || 'Mango';
    if (type === 'pond') return 'Pond';
    if (type === 'greenhouse') return 'Greenhouse';
    if (type === 'path') return 'Path';
    return label || 'Tree';
};

const mapBackendItemToUi = (item, index) => {
    const type = item.cropSpecies?.toLowerCase().includes('pond')
        ? 'pond'
        : item.cropSpecies?.toLowerCase().includes('greenhouse')
            ? 'greenhouse'
            : item.cropSpecies?.toLowerCase().includes('path')
                ? 'path'
                : 'tree';

    const meta = assetLibrary.find((asset) => asset.id === type) || assetLibrary[0];
    const x = Number(item.xPercent ?? ((Number(item.longitude ?? 72.8777) - 72.8777) / 0.025) * 100);
    const y = Number(item.yPercent ?? ((Number(item.latitude ?? 19.076) - 19.076) / 0.02) * 100);

    return {
        id: item.id || `load-${type}-${index}`,
        type,
        x: Math.min(96, Math.max(4, x)),
        y: Math.min(92, Math.max(9, y)),
        label: item.cropSpecies || meta.label,
    };
};

export default function VirtualFarm() {
    const [selectedAsset, setSelectedAsset] = useState('tree');
    const [items, setItems] = useState(initialLayout);
    const [activeDragId, setActiveDragId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [greenPoints, setGreenPoints] = useState(150);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [adoptionInventory, setAdoptionInventory] = useState([]);
    const [draggingInventoryId, setDraggingInventoryId] = useState(null);
    const farmRef = useRef(null);

    const selectedAssetMeta = useMemo(
        () => assetLibrary.find((asset) => asset.id === selectedAsset) || assetLibrary[0],
        [selectedAsset]
    );

    useEffect(() => {
        const userId = getCurrentUserId();
        if (!userId) {
            setLoading(false);
            setStatus('Log in to save your own virtual farm.');
            return;
        }

        const loadFarm = async () => {
            try {
                const [farmResponse, pointsResponse] = await Promise.all([
                    api.get(`/metaverse/virtual-farm/${userId}`),
                    api.get(`/metaverse/green-points/balance?userId=${userId}`),
                ]);

                if (farmResponse.data?.length) {
                    setItems(farmResponse.data.map(mapBackendItemToUi));
                } else {
                    setItems(initialLayout);
                }

                setAdoptionInventory(getStoredAdoptionInventory(userId));
                setGreenPoints(pointsResponse.data?.pointsBalance ?? 150);
                setStatus('Your farm is synced to your account.');
            } catch (err) {
                console.error('Unable to load virtual farm:', err);
                setAdoptionInventory(getStoredAdoptionInventory(userId));
                setStatus('Using a local starter layout until your saved farm loads.');
            } finally {
                setLoading(false);
            }
        };

        loadFarm();
    }, []);

    const buildItem = (type, index) => {
        const meta = assetLibrary.find((asset) => asset.id === type) || assetLibrary[0];
        const nextX = 15 + ((index * 18) % 58);
        const nextY = 16 + ((index * 13) % 56);

        return {
            id: `${type}-${Date.now()}-${index}`,
            type,
            x: nextX,
            y: nextY,
            label: meta.label,
        };
    };

    const handleAddItem = () => {
        setItems((current) => [...current, buildItem(selectedAsset, current.length)]);
    };

    const handleDeleteItem = (id) => {
        setItems((current) => current.filter((item) => item.id !== id));
    };

    const placeInventoryItem = async (inventoryItem, clientX, clientY) => {
        const userId = getCurrentUserId();
        if (!userId) {
            setError('Please log in before placing plants in your virtual farm.');
            return;
        }

        if (!farmRef.current) return;

        const rect = farmRef.current.getBoundingClientRect();
        const x = ((clientX - rect.left) / rect.width) * 100;
        const y = ((clientY - rect.top) / rect.height) * 100;
        const clampedX = Math.min(96, Math.max(4, x));
        const clampedY = Math.min(92, Math.max(9, y));

        const cropSpecies = inventoryItem.cropSpecies || 'Tomato';
        const itemType = cropSpecies.toLowerCase().includes('mango') || cropSpecies.toLowerCase().includes('sapling') ? 'tree' : 'tree';

        const payload = {
            userId,
            cropSpecies,
            latitude: Number((19.076 + (clampedY / 100) * 0.02).toFixed(6)),
            longitude: Number((72.8777 + (clampedX / 100) * 0.025).toFixed(6)),
            xPercent: Number(clampedX.toFixed(2)),
            yPercent: Number(clampedY.toFixed(2)),
            metaversePlotId: `adoption-plant-${inventoryItem.id}`,
        };

        try {
            const response = await api.post('/metaverse/virtual-farm/plant', payload);
            const placedItem = mapBackendItemToUi(response.data);

            setItems((current) => [...current, { ...placedItem, id: placedItem.id || `adoption-${Date.now()}` }]);
            setAdoptionInventory((current) => {
                const next = current.filter((item) => item.id !== inventoryItem.id);
                saveStoredAdoptionInventory(userId, next);
                return next;
            });

            const awardPoints = Number(inventoryItem.points || 75);
            const carbonOffset = Number(inventoryItem.carbonOffsetKg || 1.2);
            await api.post('/metaverse/green-points/award', null, {
                params: {
                    userId,
                    points: awardPoints,
                    carbonOffsetKg: carbonOffset,
                },
            });

            const pointsResponse = await api.get(`/metaverse/green-points/balance?userId=${userId}`);
            setGreenPoints(pointsResponse.data?.pointsBalance ?? greenPoints + awardPoints);
            setStatus(`${cropSpecies} placed successfully and rewarded with ${awardPoints} Green Points.`);
        } catch (err) {
            console.error('Unable to place adopted plant:', err);
            setError(err.response?.data?.message || 'Unable to place this adopted plant on the farm.');
        }
    };

    const handlePointerDown = (event, itemId) => {
        setActiveDragId(itemId);
        event.preventDefault();
    };

    const handlePointerMove = (event) => {
        if (!activeDragId || !farmRef.current) return;

        const rect = farmRef.current.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;

        setItems((current) => current.map((item) =>
            item.id === activeDragId
                ? {
                    ...item,
                    x: Math.min(96, Math.max(4, x)),
                    y: Math.min(92, Math.max(9, y)),
                }
                : item
        ));
    };

    const handleSaveFarm = async () => {
        const userId = getCurrentUserId();
        if (!userId) {
            setError('Please login to save your farm.');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const payload = items.map((item, index) => ({
                userId,
                cropSpecies: mapTypeToCropSpecies(item.type, item.label),
                latitude: Number((19.076 + (item.y / 100) * 0.02).toFixed(6)),
                longitude: Number((72.8777 + (item.x / 100) * 0.025).toFixed(6)),
                xPercent: Number(item.x.toFixed(2)),
                yPercent: Number(item.y.toFixed(2)),
                metaversePlotId: `plot-${userId}-${index + 1}`,
            }));

            const response = await api.put(`/metaverse/virtual-farm/${userId}`, payload);
            const savedLayout = response.data?.map(mapBackendItemToUi) || items;
            setItems(savedLayout);

            const pointsResponse = await api.get(`/metaverse/green-points/balance?userId=${userId}`);
            setGreenPoints(pointsResponse.data?.pointsBalance ?? greenPoints + 25);
            setStatus('Farm saved successfully. Green points updated.');
        } catch (err) {
            console.error('Save farm failed:', err);
            setError(err.response?.data?.message || 'Unable to save this farm layout.');
        } finally {
            setSaving(false);
        }
    };

    const stopDragging = () => setActiveDragId(null);

    const handleDropOnCanvas = async (event) => {
        event.preventDefault();
        const inventoryPayload = event.dataTransfer.getData('application/json');
        if (!inventoryPayload) return;

        try {
            const parsed = JSON.parse(inventoryPayload);
            await placeInventoryItem(parsed, event.clientX, event.clientY);
        } catch {
            setError('Unable to place the selected plant on the farm.');
        } finally {
            setDraggingInventoryId(null);
        }
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Farmer workspace</p>
                    <h1 className="mt-2 text-3xl font-black text-stone-900">My Virtual Farm</h1>
                </div>

                <div className="flex items-center gap-3">
                    <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
                        🌿 {greenPoints} Green Points
                    </div>
                    <button
                        type="button"
                        onClick={handleSaveFarm}
                        disabled={saving || loading}
                        className="flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Save className="h-4 w-4" />
                        {saving ? 'Saving...' : 'Save farm'}
                    </button>
                </div>
            </div>

            {(status || error) && (
                <div className={`mb-4 rounded-xl border px-3 py-2 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
                    {error || status}
                </div>
            )}

            <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
                <aside className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-2 text-emerald-700">
                        <Trees className="h-5 w-5" />
                        <h2 className="text-xl font-bold text-stone-900">Asset library</h2>
                    </div>

                    <div className="space-y-3">
                        {assetLibrary.map((asset) => {
                            const Icon = asset.icon;
                            const isSelected = selectedAsset === asset.id;

                            return (
                                <button
                                    key={asset.id}
                                    type="button"
                                    onClick={() => setSelectedAsset(asset.id)}
                                    className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition ${isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-stone-200 bg-stone-50 hover:border-stone-300'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`flex h-10 w-10 items-center justify-center rounded-lg text-white ${asset.color}`}>
                                            <Icon className="h-4 w-4" />
                                        </span>
                                        <div>
                                            <p className="font-semibold text-stone-900">{asset.label}</p>
                                            <p className="text-xs text-stone-500">Drag into farm</p>
                                        </div>
                                    </div>
                                    {isSelected && <span className="text-xs font-semibold text-emerald-700">Selected</span>}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        type="button"
                        onClick={handleAddItem}
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
                    >
                        <Plus className="h-4 w-4" />
                        Add to layout
                    </button>

                    {adoptionInventory.length > 0 && (
                        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                            <div className="mb-3 flex items-center justify-between">
                                <p className="text-sm font-bold text-emerald-800">Unplaced adoption inventory</p>
                                <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-emerald-700">{adoptionInventory.length}</span>
                            </div>

                            <div className="space-y-2">
                                {adoptionInventory.map((item) => (
                                    <div
                                        key={item.id}
                                        draggable
                                        onDragStart={(event) => {
                                            event.dataTransfer.setData('application/json', JSON.stringify(item));
                                            setDraggingInventoryId(item.id);
                                        }}
                                        onDragEnd={() => setDraggingInventoryId(null)}
                                        className={`cursor-grab rounded-xl border border-emerald-200 bg-white p-2 text-left shadow-sm ${draggingInventoryId === item.id ? 'opacity-70' : ''}`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-semibold text-stone-900">{item.cropSpecies}</span>
                                            <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">{item.quantity} units</span>
                                        </div>
                                        <p className="mt-1 text-xs text-stone-500">Drag into the farm to plant it</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                        <p className="font-bold uppercase tracking-[0.2em]">Tip</p>
                        <p className="mt-2">Click any object, then drag it anywhere on the farm to arrange your plan.</p>
                    </div>
                </aside>

                <section className="rounded-2xl border border-stone-200 bg-gradient-to-br from-emerald-50 via-lime-50 to-stone-50 p-4 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-medium text-stone-600">Farm planner</p>
                            <h2 className="text-xl font-bold text-stone-900">3D orchard layout</h2>
                        </div>
                        <div className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-800">
                            {items.length} objects
                        </div>
                    </div>

                    <div
                        ref={farmRef}
                        className="relative h-[620px] overflow-hidden rounded-2xl border border-emerald-200 bg-[radial-gradient(circle_at_top,#d9f99d_0%,#f0fdf4_30%,#ecfccb_100%)] shadow-inner"
                        onPointerMove={handlePointerMove}
                        onPointerUp={stopDragging}
                        onPointerLeave={stopDragging}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={handleDropOnCanvas}
                    >
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.25)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.25)_1px,transparent_1px)] bg-[size:32px_32px]" />
                        <div className="absolute inset-x-6 bottom-4 h-28 rounded-[30px] bg-emerald-900/10 blur-2xl" />
                        <div className="absolute left-6 top-6 h-24 w-24 rounded-full bg-white/30 blur-2xl" />
                        <div className="absolute right-10 top-8 h-20 w-20 rounded-full bg-lime-200/50 blur-2xl" />

                        {items.map((item) => {
                            const meta = assetLibrary.find((asset) => asset.id === item.type) || assetLibrary[0];
                            const Icon = meta.icon;
                            const isActive = activeDragId === item.id;

                            return (
                                <div
                                    key={item.id}
                                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing"
                                    style={{ left: `${item.x}%`, top: `${item.y}%` }}
                                    onPointerDown={(event) => handlePointerDown(event, item.id)}
                                >
                                    <div className="relative flex flex-col items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteItem(item.id)}
                                            className="absolute -right-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-white bg-red-500 text-white shadow-md"
                                            aria-label={`Delete ${meta.label}`}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-white/80 shadow-xl text-white ${meta.color} ${meta.shadow} ${isActive ? 'scale-110' : ''}`}>
                                            <Icon className="h-7 w-7" />
                                        </div>
                                        <span className="rounded-full border border-white/80 bg-white/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-stone-700 shadow-sm">
                                            {item.label}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>
        </div>
    );
}
