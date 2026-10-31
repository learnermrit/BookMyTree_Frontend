import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPinned, Pencil, Plus, Sprout, Trash2, Trees, Warehouse, ArrowRight } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import api from '../services/api';

const defaultFieldForm = {
    name: '',
    latitude: '19.0760',
    longitude: '72.8777',
};

const defaultTreeForm = {
    species: 'Sweet Orange',
    stage: 'MATURE',
    quantity: 1,
    latitude: '19.0760',
    longitude: '72.8777',
};

const defaultBranchForm = {
    branchIdentifier: 'North-Canopy-Branch',
    estimatedYieldKg: 18,
    price: 420,
    available: true,
};

const defaultBulkEditForm = {
    stage: 'MATURE',
    branchIdentifier: 'North-Canopy-Branch',
    estimatedYieldKg: 18,
    basePrice: 420,
    addBranch: true,
};

export default function FarmerDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [fields, setFields] = useState([]);
    const [selectedFieldId, setSelectedFieldId] = useState('');
    const [trees, setTrees] = useState([]);
    const [selectedTreeId, setSelectedTreeId] = useState('');
    const [fieldForm, setFieldForm] = useState(defaultFieldForm);
    const [treeForm, setTreeForm] = useState(defaultTreeForm);
    const [branchForm, setBranchForm] = useState(defaultBranchForm);
    const [bulkEditForm, setBulkEditForm] = useState(defaultBulkEditForm);
    const [selectedTreeIds, setSelectedTreeIds] = useState([]);
    const [bulkEditOpen, setBulkEditOpen] = useState(false);
    const [expandedSpecies, setExpandedSpecies] = useState({});
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const isFarmer = user?.role === 'FARMER';
    const selectedTreeTargets = useMemo(
        () => (selectedTreeIds.length > 0 ? selectedTreeIds : selectedTreeId ? [selectedTreeId] : []),
        [selectedTreeId, selectedTreeIds]
    );

    const selectedField = useMemo(
        () => fields.find((field) => field.id === selectedFieldId) || null,
        [fields, selectedFieldId]
    );

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const loadFields = async () => {
        try {
            const response = await api.get('/farmers/fields');
            setFields(response.data);
            if (response.data.length > 0) {
                setSelectedFieldId((current) => current || response.data[0].id);
            }
        } catch (error) {
            setMessage(error.response?.data?.message || 'Unable to load farmer fields.');
        }
    };

    useEffect(() => {
        if (isFarmer) {
            loadFields();
        }
    }, [isFarmer]);

    const loadTrees = async (fieldId) => {
        if (!fieldId) {
            setTrees([]);
            return;
        }

        try {
            const response = await api.get(`/farmers/fields/${fieldId}/trees`);
            setTrees(response.data);
            if (response.data.length > 0) {
                setSelectedTreeId((current) => current || response.data[0].id);
            } else {
                setSelectedTreeId('');
            }
        } catch (error) {
            setMessage(error.response?.data?.message || 'Unable to load tree list.');
        }
    };

    useEffect(() => {
        if (selectedFieldId) {
            loadTrees(selectedFieldId);
        }
    }, [selectedFieldId]);

    useEffect(() => {
        if (!selectedFieldId) return;

        const field = fields.find((item) => item.id === selectedFieldId);
        if (!field) return;

        setTreeForm((current) => ({
            ...current,
            latitude: String(field.latitude ?? current.latitude ?? defaultTreeForm.latitude),
            longitude: String(field.longitude ?? current.longitude ?? defaultTreeForm.longitude),
        }));
    }, [selectedFieldId, fields]);

    const handleCreateField = async (event) => {
        event.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const response = await api.post('/farmers/fields', {
                name: fieldForm.name,
                latitude: Number(fieldForm.latitude),
                longitude: Number(fieldForm.longitude),
            });

            setFields((current) => [response.data, ...current]);
            setSelectedFieldId(response.data.id);
            setFieldForm(defaultFieldForm);
            setMessage('Field added successfully.');
        } catch (error) {
            setMessage(error.response?.data?.message || 'Unable to create field.');
        } finally {
            setLoading(false);
        }
    };

    const handleRenameField = async (fieldId) => {
        const field = fields.find((item) => item.id === fieldId);
        const nextName = window.prompt('Rename field', field?.name || '');
        if (!nextName || !nextName.trim()) return;

        try {
            const response = await api.patch(`/farmers/fields/${fieldId}`, { name: nextName.trim() });
            setFields((current) => current.map((item) => (item.id === fieldId ? { ...item, name: response.data.name } : item)));
            setMessage('Field renamed successfully.');
        } catch (error) {
            setMessage(error.response?.data?.message || 'Unable to rename field.');
        }
    };

    const handleDeleteField = async (fieldId) => {
        const field = fields.find((item) => item.id === fieldId);
        setConfirmDelete({
            type: 'field',
            id: fieldId,
            title: 'Delete field?',
            message: `This will permanently delete the field "${field?.name || 'this field'}" and all its trees. This action cannot be undone.`,
        });
    };

    const handleRenameTree = async (treeId) => {
        const tree = trees.find((item) => item.id === treeId);
        const nextSpecies = window.prompt('Rename tree species', tree?.species || '');
        if (!nextSpecies || !nextSpecies.trim()) return;

        try {
            const response = await api.patch(`/farmers/trees/${treeId}`, { species: nextSpecies.trim(), stage: tree?.stage || 'MATURE' });
            setTrees((current) => current.map((item) => (item.id === treeId ? { ...item, species: response.data.species, stage: response.data.stage } : item)));
            setMessage('Tree renamed successfully.');
        } catch (error) {
            setMessage(error.response?.data?.message || 'Unable to rename tree.');
        }
    };

    const handleDeleteTree = async (treeId) => {
        const tree = trees.find((item) => item.id === treeId);
        setConfirmDelete({
            type: 'tree',
            id: treeId,
            title: 'Delete tree?',
            message: `This will permanently delete the tree "${tree?.species || 'selected tree'}" and all its branches. It is blocked if the tree is already booked.`,
        });
    };

    const handleRenameBranch = async (treeId, branchId) => {
        const tree = trees.find((item) => item.id === treeId);
        const branch = (tree?.branches || []).find((item) => item.id === branchId);
        const nextName = window.prompt('Rename branch', branch?.branchIdentifier || '');
        if (!nextName || !nextName.trim()) return;

        try {
            const response = await api.patch(`/farmers/trees/${treeId}/branches/${branchId}`, { branchIdentifier: nextName.trim() });
            setTrees((current) => current.map((treeItem) => {
                if (treeItem.id !== treeId) return treeItem;
                return {
                    ...treeItem,
                    branches: (treeItem.branches || []).map((branchItem) =>
                        branchItem.id === branchId ? { ...branchItem, branchIdentifier: response.data.branchIdentifier } : branchItem
                    ),
                };
            }));
            setMessage('Branch renamed successfully.');
        } catch (error) {
            setMessage(error.response?.data?.message || 'Unable to rename branch.');
        }
    };

    const handleDeleteBranch = async (treeId, branchId) => {
        const tree = trees.find((item) => item.id === treeId);
        const branch = (tree?.branches || []).find((item) => item.id === branchId);
        setConfirmDelete({
            type: 'branch',
            id: branchId,
            treeId,
            title: 'Delete branch?',
            message: `This will permanently delete the branch "${branch?.branchIdentifier || 'selected branch'}". It is blocked if the branch is already booked.`,
        });
    };

    const confirmDeleteAction = async () => {
        if (!confirmDelete) return;

        try {
            if (confirmDelete.type === 'field') {
                await api.delete(`/farmers/fields/${confirmDelete.id}`);
                setFields((current) => current.filter((field) => field.id !== confirmDelete.id));
                if (selectedFieldId === confirmDelete.id) {
                    setSelectedFieldId('');
                }
                setMessage('Field deleted successfully.');
            }

            if (confirmDelete.type === 'tree') {
                await api.delete(`/farmers/trees/${confirmDelete.id}`);
                setTrees((current) => current.filter((tree) => tree.id !== confirmDelete.id));
                setSelectedTreeIds((current) => current.filter((treeId) => treeId !== confirmDelete.id));
                if (selectedTreeId === confirmDelete.id) {
                    setSelectedTreeId('');
                }
                setMessage('Tree deleted successfully.');
            }

            if (confirmDelete.type === 'branch') {
                await api.delete(`/farmers/trees/${confirmDelete.treeId}/branches/${confirmDelete.id}`);
                setTrees((current) => current.map((tree) => tree.id === confirmDelete.treeId
                    ? { ...tree, branches: (tree.branches || []).filter((branch) => branch.id !== confirmDelete.id) }
                    : tree));
                setMessage('Branch deleted successfully.');
            }
        } catch (error) {
            setMessage(error.response?.data?.message || 'Unable to complete delete action.');
        } finally {
            setConfirmDelete(null);
        }
    };

    const handleCreateTree = async (event) => {
        event.preventDefault();
        if (!selectedFieldId) {
            setMessage('Please select a field before adding a tree.');
            return;
        }

        const quantity = Number(treeForm.quantity || 1);
        if (quantity < 1) {
            setMessage('Quantity must be at least 1.');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            let resultTrees = [];

            if (quantity > 1) {
                const response = await api.post(`/farmers/fields/${selectedFieldId}/trees/bulk`, {
                    species: treeForm.species,
                    stage: treeForm.stage,
                    count: quantity,
                    latitude: Number(treeForm.latitude),
                    longitude: Number(treeForm.longitude),
                });
                resultTrees = response.data;
                setSelectedTreeId(response.data[0]?.id || '');
                setMessage(`Successfully created ${response.data.length} trees in the field.`);
            } else {
                const response = await api.post(`/farmers/fields/${selectedFieldId}/trees`, {
                    species: treeForm.species,
                    stage: treeForm.stage,
                    latitude: Number(treeForm.latitude),
                    longitude: Number(treeForm.longitude),
                });
                resultTrees = [response.data];
                setSelectedTreeId(response.data.id);
                setMessage('Tree added to the field successfully.');
            }

            setTrees((current) => [...resultTrees, ...current]);
            setSelectedTreeIds([]);
            setTreeForm(defaultTreeForm);
        } catch (error) {
            setMessage(error.response?.data?.message || 'Unable to create tree.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBranch = async (event) => {
        event.preventDefault();
        const targetTreeIds = selectedTreeTargets.length > 0 ? selectedTreeTargets : [];

        if (targetTreeIds.length === 0) {
            setMessage('Please select at least one tree before adding branches.');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            const payload = [{
                branchIdentifier: branchForm.branchIdentifier,
                estimatedYieldKg: Number(branchForm.estimatedYieldKg),
                price: Number(branchForm.price),
                available: branchForm.available,
            }];

            const results = await Promise.all(
                targetTreeIds.map(async (treeId) => {
                    const response = await api.post(`/farmers/trees/${treeId}/branches`, payload);
                    return { treeId, branches: response.data };
                })
            );

            setTrees((current) =>
                current.map((tree) => {
                    const result = results.find((item) => item.treeId === tree.id);
                    if (!result) return tree;

                    return {
                        ...tree,
                        branches: [...(tree.branches || []), ...result.branches],
                    };
                })
            );

            setBranchForm(defaultBranchForm);
            setMessage(
                targetTreeIds.length > 1
                    ? `Branch added successfully to ${targetTreeIds.length} selected trees.`
                    : 'Tree branch added successfully.'
            );
        } catch (error) {
            setMessage(error.response?.data?.message || 'Unable to add branch.');
        } finally {
            setLoading(false);
        }
    };

    const toggleTreeSelection = (treeId) => {
        setSelectedTreeIds((current) =>
            current.includes(treeId)
                ? current.filter((id) => id !== treeId)
                : [...current, treeId]
        );
    };

    const groupedTrees = useMemo(() => {
        const groups = new Map();

        trees.forEach((tree) => {
            const key = tree.species || 'Unknown';
            if (!groups.has(key)) {
                groups.set(key, { species: key, trees: [] });
            }
            groups.get(key).trees.push(tree);
        });

        return Array.from(groups.values());
    }, [trees]);

    const toggleSpeciesGroup = (species) => {
        setExpandedSpecies((current) => ({
            ...current,
            [species]: !current[species],
        }));
    };

    const toggleGroupSelection = (groupTrees) => {
        const groupTreeIds = groupTrees.map((tree) => tree.id);
        const allSelected = groupTreeIds.every((treeId) => selectedTreeIds.includes(treeId));

        setSelectedTreeIds((current) => {
            if (allSelected) {
                return current.filter((treeId) => !groupTreeIds.includes(treeId));
            }

            const next = new Set(current);
            groupTreeIds.forEach((treeId) => next.add(treeId));
            return Array.from(next);
        });
    };

    const handleBulkUpdateTrees = async () => {
        if (!selectedFieldId || selectedTreeIds.length === 0) {
            setMessage('Please select at least one tree before bulk editing.');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            const payload = {
                treeIds: selectedTreeIds,
                stage: bulkEditForm.stage,
                basePrice: bulkEditForm.basePrice ? Number(bulkEditForm.basePrice) : undefined,
                branchIdentifier: bulkEditForm.branchIdentifier,
                estimatedYieldKg: bulkEditForm.estimatedYieldKg ? Number(bulkEditForm.estimatedYieldKg) : undefined,
                addBranch: bulkEditForm.addBranch,
            };

            const response = await api.patch(`/farmers/fields/${selectedFieldId}/trees/bulk-update`, payload);
            setTrees(response.data);
            setSelectedTreeIds([]);
            setBulkEditOpen(false);
            setBulkEditForm(defaultBulkEditForm);
            setMessage(`Updated ${response.data.length} tree records in bulk.`);
        } catch (error) {
            setMessage(error.response?.data?.message || 'Unable to apply the bulk tree update.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="mx-auto max-w-3xl py-10 px-4">
                <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
                    <Trees className="mx-auto h-12 w-12 text-green-700" />
                    <h1 className="mt-4 text-2xl font-bold text-stone-900">Farmer dashboard</h1>
                    <p className="mt-3 text-stone-600">Please log in as a farmer profile to manage fields and tree inventory.</p>
                </div>
            </div>
        );
    }

    if (!isFarmer) {
        return (
            <div className="mx-auto max-w-3xl py-10 px-4">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
                    <Sprout className="mx-auto h-12 w-12 text-amber-700" />
                    <h1 className="mt-4 text-2xl font-bold text-stone-900">Farmer access only</h1>
                    <p className="mt-3 text-stone-600">This dashboard is for farmer accounts. Please switch to a farmer user to add fields, trees and branches.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-green-700">Farmer portal</p>
                    <h1 className="mt-2 text-3xl font-black text-stone-900">Manage orchard inventory</h1>
                </div>
                <div className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-800">
                    {user.fullName || user.email}
                </div>
            </div>

            {message && (
                <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
                    {message}
                </div>
            )}

            <div className="grid gap-6 xl:grid-cols-3">
                <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-2 text-green-700">
                        <Plus className="h-5 w-5" />
                        <h2 className="text-xl font-bold text-stone-900">Add field</h2>
                    </div>

                    <form className="space-y-4" onSubmit={handleCreateField}>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-stone-700">Field name</label>
                            <input
                                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none ring-0 focus:border-green-500"
                                value={fieldForm.name}
                                onChange={(e) => setFieldForm({ ...fieldForm, name: e.target.value })}
                                placeholder="Sunburst Plot"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-stone-700">Latitude</label>
                                <input
                                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-green-500"
                                    value={fieldForm.latitude}
                                    onChange={(e) => setFieldForm({ ...fieldForm, latitude: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-stone-700">Longitude</label>
                                <input
                                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-green-500"
                                    value={fieldForm.longitude}
                                    onChange={(e) => setFieldForm({ ...fieldForm, longitude: e.target.value })}
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60"
                        >
                            {loading ? 'Saving...' : 'Create field'}
                        </button>
                    </form>
                </section>

                <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm xl:col-span-2">
                    <div className="mb-4 flex items-center gap-2 text-green-700">
                        <Warehouse className="h-5 w-5" />
                        <h2 className="text-xl font-bold text-stone-900">My fields</h2>
                    </div>

                    {fields.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-6 text-sm text-stone-600">
                            No fields added yet. Create your first orchard field on the left.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {fields.map((field) => (
                                <div
                                    key={field.id}
                                    className={`rounded-xl border p-4 transition ${selectedFieldId === field.id ? 'border-green-500 bg-green-50' : 'border-stone-200 bg-stone-50 hover:border-stone-300'}`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => setSelectedFieldId(field.id)}
                                        className="w-full text-left"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-lg font-bold text-stone-900">{field.name}</p>
                                                <p className="mt-1 flex items-center gap-1 text-sm text-stone-600">
                                                    <MapPinned className="h-4 w-4" />
                                                    {field.latitude}, {field.longitude}
                                                </p>
                                            </div>
                                            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-green-800">
                                                {field.totalTreesCount || 0} trees
                                            </span>
                                        </div>
                                    </button>
                                    <div className="mt-3 flex items-center justify-end gap-2">
                                        <button
                                            type="button"
                                            title="Rename field"
                                            aria-label="Rename field"
                                            onClick={() => handleRenameField(field.id)}
                                            className="rounded-lg border border-stone-300 bg-white p-2 text-stone-700 transition hover:bg-stone-100"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            title="Delete field"
                                            aria-label="Delete field"
                                            onClick={() => handleDeleteField(field.id)}
                                            className="rounded-lg border border-red-300 bg-red-50 p-2 text-red-700 transition hover:bg-red-100"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-2">
                <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-2 text-green-700">
                        <Trees className="h-5 w-5" />
                        <h2 className="text-xl font-bold text-stone-900">Add tree to field</h2>
                    </div>

                    <form className="space-y-4" onSubmit={handleCreateTree}>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-stone-700">Selected field</label>
                            <select
                                value={selectedFieldId}
                                onChange={(e) => setSelectedFieldId(e.target.value)}
                                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-green-500"
                            >
                                <option value="">Choose a field</option>
                                {fields.map((field) => (
                                    <option key={field.id} value={field.id}>{field.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-stone-700">Species</label>
                            <input
                                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-green-500"
                                value={treeForm.species}
                                onChange={(e) => setTreeForm({ ...treeForm, species: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-stone-700">Stage</label>
                                <select
                                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-green-500"
                                    value={treeForm.stage}
                                    onChange={(e) => setTreeForm({ ...treeForm, stage: e.target.value })}
                                >
                                    <option value="FLOWERING">FLOWERING</option>
                                    <option value="FRUIT_SET">FRUIT_SET</option>
                                    <option value="MATURE">MATURE</option>
                                    <option value="HARVESTED">HARVESTED</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-stone-700">Quantity</label>
                                <input
                                    type="number"
                                    min="1"
                                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-green-500"
                                    value={treeForm.quantity}
                                    onChange={(e) => setTreeForm({ ...treeForm, quantity: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-stone-700">Latitude</label>
                                <input
                                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-green-500"
                                    value={treeForm.latitude}
                                    onChange={(e) => setTreeForm({ ...treeForm, latitude: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-stone-700">Longitude</label>
                                <input
                                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-green-500"
                                    value={treeForm.longitude}
                                    onChange={(e) => setTreeForm({ ...treeForm, longitude: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !selectedFieldId}
                            className="w-full rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60"
                        >
                            {loading ? 'Saving...' : 'Add tree'}
                        </button>
                    </form>

                </section>

                <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-2 text-green-700">
                        <ArrowRight className="h-5 w-5" />
                        <h2 className="text-xl font-bold text-stone-900">Tree list</h2>
                    </div>

                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="text-sm font-medium text-stone-600">
                            Selected {selectedTreeIds.length} / {trees.length}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setSelectedTreeIds(trees.map((tree) => tree.id))}
                                className="rounded-lg border border-stone-300 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100"
                            >
                                Select all
                            </button>
                            <button
                                type="button"
                                onClick={() => setBulkEditOpen(true)}
                                disabled={!selectedTreeIds.length}
                                className="rounded-lg bg-green-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Bulk edit
                            </button>
                        </div>
                    </div>

                    {trees.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-6 text-sm text-stone-600">
                            No trees yet in the selected field.
                        </div>
                    ) : (
                        <div className="max-h-[480px] space-y-3 overflow-y-auto pr-1">
                            {groupedTrees.map((group) => {
                                const groupTreeIds = group.trees.map((tree) => tree.id);
                                const allSelected = groupTreeIds.length > 0 && groupTreeIds.every((treeId) => selectedTreeIds.includes(treeId));
                                const isOpen = expandedSpecies[group.species] ?? true;

                                return (
                                    <div key={group.species} className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                                        <button
                                            type="button"
                                            onClick={() => toggleSpeciesGroup(group.species)}
                                            className="flex w-full items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white px-3 py-2 text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={allSelected}
                                                    onClick={(event) => event.stopPropagation()}
                                                    onChange={(event) => {
                                                        event.stopPropagation();
                                                        toggleGroupSelection(group.trees);
                                                    }}
                                                    className="h-4 w-4 rounded border-stone-300 text-green-700"
                                                />
                                                <div>
                                                    <p className="text-base font-bold text-stone-900">{group.species}</p>
                                                    <p className="text-xs text-stone-500">{group.trees.length} trees</p>
                                                </div>
                                            </div>
                                            <ArrowRight className={`h-4 w-4 text-stone-600 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                                        </button>

                                        {isOpen && (
                                            <div className="mt-3 space-y-2">
                                                {group.trees.map((tree, index) => (
                                                    <div key={tree.id} className="space-y-2">
                                                        <div
                                                            className={`flex items-center gap-3 rounded-xl border p-3 transition ${selectedTreeId === tree.id ? 'border-green-500 bg-green-50' : 'border-stone-200 bg-white'}`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedTreeIds.includes(tree.id)}
                                                                onChange={() => toggleTreeSelection(tree.id)}
                                                                className="h-4 w-4 rounded border-stone-300 text-green-700"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedTreeId(tree.id)}
                                                                className="flex-1 text-left"
                                                            >
                                                                <div className="flex items-center justify-between gap-3">
                                                                    <div>
                                                                        <p className="text-base font-bold text-stone-900">Tree {index + 1}</p>
                                                                        <p className="text-sm text-stone-600">{tree.species} · Stage: {tree.stage}</p>
                                                                    </div>
                                                                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                                                                        {(tree.branches || []).length} branches
                                                                    </span>
                                                                </div>
                                                            </button>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    title="Rename tree"
                                                                    aria-label="Rename tree"
                                                                    onClick={() => handleRenameTree(tree.id)}
                                                                    className="rounded-lg border border-stone-300 bg-white p-2 text-stone-700 transition hover:bg-stone-100"
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    title="Delete tree"
                                                                    aria-label="Delete tree"
                                                                    onClick={() => handleDeleteTree(tree.id)}
                                                                    className="rounded-lg border border-red-300 bg-red-50 p-2 text-red-700 transition hover:bg-red-100"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {(tree.branches || []).length > 0 && (
                                                            <div className="space-y-2 pl-2">
                                                                {(tree.branches || []).map((branch) => (
                                                                    <div key={branch.id} className="flex items-center justify-between gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2">
                                                                        <div>
                                                                            <p className="text-sm font-semibold text-stone-900">{branch.branchIdentifier}</p>
                                                                            <p className="text-xs text-stone-500">{branch.estimatedYieldKg} kg · ₹{branch.price}</p>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${branch.available ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                                                {branch.available ? 'Available' : 'Booked'}
                                                                            </span>
                                                                            <button
                                                                                type="button"
                                                                                title="Rename branch"
                                                                                aria-label="Rename branch"
                                                                                onClick={() => handleRenameBranch(tree.id, branch.id)}
                                                                                className="rounded border border-stone-300 bg-white p-1.5 text-stone-700 transition hover:bg-stone-100"
                                                                            >
                                                                                <Pencil className="h-3 w-3" />
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                title="Delete branch"
                                                                                aria-label="Delete branch"
                                                                                onClick={() => handleDeleteBranch(tree.id, branch.id)}
                                                                                className="rounded border border-red-300 bg-red-50 p-1.5 text-red-700 transition hover:bg-red-100"
                                                                            >
                                                                                <Trash2 className="h-3 w-3" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>

            <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-green-700">
                        <Plus className="h-5 w-5" />
                        <h2 className="text-xl font-bold text-stone-900">My Virtual Farm</h2>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate('/virtual-farm')}
                        className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
                    >
                        Open virtual farm
                    </button>
                </div>
                <p className="text-sm text-stone-600">
                    Launch the dedicated virtual farm planner to arrange trees, ponds, greenhouse plots, and irrigation zones without leaving the farmer dashboard.
                </p>
            </div>

            <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2 text-green-700">
                    <Plus className="h-5 w-5" />
                    <h2 className="text-xl font-bold text-stone-900">Add tree branch</h2>
                </div>

                <form className="grid gap-4 md:grid-cols-5" onSubmit={handleCreateBranch}>
                    <div className="md:col-span-2">
                        <label className="mb-1 block text-sm font-medium text-stone-700">Selected tree</label>
                        <select
                            value={selectedTreeId}
                            onChange={(e) => setSelectedTreeId(e.target.value)}
                            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-green-500"
                        >
                            <option value="">Choose tree</option>
                            {trees.map((tree) => (
                                <option key={tree.id} value={tree.id}>{tree.species}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-stone-700">Branch name</label>
                        <input
                            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-green-500"
                            value={branchForm.branchIdentifier}
                            onChange={(e) => setBranchForm({ ...branchForm, branchIdentifier: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-stone-700">Yield (kg)</label>
                        <input
                            type="number"
                            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-green-500"
                            value={branchForm.estimatedYieldKg}
                            onChange={(e) => setBranchForm({ ...branchForm, estimatedYieldKg: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-stone-700">Price</label>
                        <input
                            type="number"
                            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-green-500"
                            value={branchForm.price}
                            onChange={(e) => setBranchForm({ ...branchForm, price: e.target.value })}
                        />
                    </div>
                    <div className="md:col-span-5 flex items-center justify-between gap-3 pt-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
                            <input
                                type="checkbox"
                                checked={branchForm.available}
                                onChange={(e) => setBranchForm({ ...branchForm, available: e.target.checked })}
                                className="h-4 w-4 rounded border-stone-300 text-green-700"
                            />
                            Available for booking
                        </label>
                        <button
                            type="submit"
                            disabled={loading || selectedTreeTargets.length === 0}
                            className="rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60"
                        >
                            Add branch
                        </button>
                    </div>
                </form>
            </div>

            <ConfirmDialog
                open={Boolean(confirmDelete)}
                title={confirmDelete?.title || 'Confirm action'}
                message={confirmDelete?.message || ''}
                confirmText={confirmDelete?.type === 'field' ? 'Delete field' : confirmDelete?.type === 'tree' ? 'Delete tree' : 'Delete branch'}
                onConfirm={confirmDeleteAction}
                onCancel={() => setConfirmDelete(null)}
            />

            {bulkEditOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4">
                    <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-5 shadow-xl">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-green-700">Bulk edit</p>
                                <h3 className="mt-1 text-xl font-black text-stone-900">Apply to {selectedTreeIds.length} trees</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setBulkEditOpen(false)}
                                className="rounded-full border border-stone-300 px-3 py-1 text-xs font-semibold text-stone-700"
                            >
                                Close
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-stone-700">Growth stage</label>
                                <select
                                    value={bulkEditForm.stage}
                                    onChange={(e) => setBulkEditForm({ ...bulkEditForm, stage: e.target.value })}
                                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-green-500"
                                >
                                    <option value="FLOWERING">FLOWERING</option>
                                    <option value="FRUIT_SET">FRUIT_SET</option>
                                    <option value="MATURE">MATURE</option>
                                    <option value="HARVESTED">HARVESTED</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-stone-700">Branch name</label>
                                    <input
                                        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-green-500"
                                        value={bulkEditForm.branchIdentifier}
                                        onChange={(e) => setBulkEditForm({ ...bulkEditForm, branchIdentifier: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-stone-700">Base price</label>
                                    <input
                                        type="number"
                                        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-green-500"
                                        value={bulkEditForm.basePrice}
                                        onChange={(e) => setBulkEditForm({ ...bulkEditForm, basePrice: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-stone-700">Yield per branch</label>
                                    <input
                                        type="number"
                                        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-green-500"
                                        value={bulkEditForm.estimatedYieldKg}
                                        onChange={(e) => setBulkEditForm({ ...bulkEditForm, estimatedYieldKg: e.target.value })}
                                    />
                                </div>
                                <div className="flex items-end">
                                    <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
                                        <input
                                            type="checkbox"
                                            checked={bulkEditForm.addBranch}
                                            onChange={(e) => setBulkEditForm({ ...bulkEditForm, addBranch: e.target.checked })}
                                            className="h-4 w-4 rounded border-stone-300 text-green-700"
                                        />
                                        Add branch
                                    </label>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setBulkEditOpen(false)}
                                    className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleBulkUpdateTrees}
                                    className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
                                >
                                    Apply bulk update
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
