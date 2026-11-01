import { useEffect, useMemo, useState } from 'react';
import { MapPinned, Plus, RefreshCcw, Sprout, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '../services/api';

const assetCategories = [
  { value: 'CROP_FIELD', label: 'Crop Fields' },
  { value: 'FISH_POND', label: 'Fish Ponds' },
  { value: 'FRUIT_FARM', label: 'Fruit Farms' },
  { value: 'TIMBER_PLANT', label: 'Plants for Wood / Timber' },
  { value: 'SINGLE_PLANT', label: 'Single Individual Plant' },
];

const emptyForm = {
  category: 'CROP_FIELD',
  title: '',
  description: '',
  latitude: '19.0760',
  longitude: '72.8777',
  totalCapacity: '25',
  unitType: 'acres',
  minimumAdoptionUnit: 'WHOLE_FARM',
  price: '2400',
  expectedYield: '500',
  yieldUnit: 'kg',
  tenure: '1 Year',
  imageUrl: '',
};

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export default function AdoptionFarmsDashboard() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFetchingListings, setIsFetchingListings] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    }
    loadListings();
  }, []);

  const loadListings = async () => {
    setIsFetchingListings(true);
    try {
      const response = await api.get('/adoption/listings');
      setListings(response.data || []);
    } catch (error) {
      console.error('Unable to load adoption listings:', error);
      setListings([]);
    } finally {
      setIsFetchingListings(false);
    }
  };

  const selectedCategory = useMemo(
    () => assetCategories.find((item) => item.value === form.category) || assetCategories[0],
    [form.category]
  );

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const currentUser = getStoredUser();
    if (!currentUser?.id) {
      setErrorMessage('Please log in to create an adoption listing.');
      return;
    }

    if (!form.title.trim() || !form.description.trim()) {
      setErrorMessage('Asset title and description are required.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setStatusMessage('');

    try {
      const payload = {
        farmerId: currentUser.id,
        category: form.category,
        title: form.title.trim(),
        name: form.title.trim(),
        quantityAvailable: Number(form.totalCapacity) || 1,
        price: Number(form.price) || 0,
        pointsReward: Math.max(50, Math.round(Number(form.price || 0) / 40)),
        carbonOffsetKg: Number(form.expectedYield || 0) / 100,
        description: [
          form.description.trim(),
          `Capacity: ${form.totalCapacity} ${form.unitType}`,
          `Minimum adoption unit: ${form.minimumAdoptionUnit}`,
          `Expected yield: ${form.expectedYield} ${form.yieldUnit}`,
          `Tenure: ${form.tenure}`,
          `Location: ${form.latitude}, ${form.longitude}`,
        ].join(' | '),
        location: `${form.latitude}, ${form.longitude}`,
        imageUrl: form.imageUrl || '',
        unitLabel: form.minimumAdoptionUnit,
      };

      const response = await api.post('/fields/adoption-listing', payload).catch(async (error) => {
        if (error.response?.status === 404) {
          return api.post('/adoption/listings', payload);
        }
        throw error;
      });

      setStatusMessage('Adoption listing created successfully.');
      setForm(emptyForm);
      await loadListings();
      if (response?.data) {
        setListings((current) => [response.data, ...current]);
      }
    } catch (error) {
      console.error('Unable to create adoption listing:', error);
      setErrorMessage(error.response?.data?.message || 'Unable to create the adoption listing.');
    } finally {
      setLoading(false);
    }
  };

  const handleAvailabilityToggle = async (listingId, active) => {
    try {
      await api.patch(`/adoption/listings/${listingId}/active`, null, {
        params: { active },
      });
      setListings((current) => current.map((item) => (item.id === listingId ? { ...item, active } : item)));
      setStatusMessage(`Listing ${active ? 'resumed' : 'paused'} successfully.`);
    } catch (error) {
      console.error('Unable to toggle listing availability:', error);
      setErrorMessage(error.response?.data?.message || 'Unable to update listing availability.');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-emerald-700">Farmer tools</p>
          <h1 className="mt-2 text-3xl font-black text-stone-900">Adoption Farms Dashboard</h1>
        </div>

        <button
          type="button"
          onClick={loadListings}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
        >
          <RefreshCcw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {(statusMessage || errorMessage) && (
        <div className={`mb-6 rounded-xl border px-4 py-3 text-sm ${errorMessage ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
          {errorMessage || statusMessage}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <form onSubmit={handleSubmit} className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-100 p-2 text-emerald-700">
              <Sprout className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-stone-500">Create new asset listing</p>
              <h2 className="text-xl font-bold text-stone-900">Register a farm asset for public adoption</h2>
            </div>
          </div>

          <div className="mb-5 grid gap-3 md:grid-cols-2">
            {assetCategories.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setForm((current) => ({ ...current, category: option.value }))}
                className={`rounded-xl border p-3 text-left text-sm font-medium transition ${form.category === option.value ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-300'}`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="md:col-span-2 block">
              <span className="mb-2 block text-sm font-medium text-stone-700">Asset title</span>
              <input
                name="title"
                value={form.title}
                onChange={handleInputChange}
                placeholder={`${selectedCategory.label} - Organic Wheat Plot`}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none ring-0 transition focus:border-emerald-400"
              />
            </label>

            <label className="md:col-span-2 block">
              <span className="mb-2 block text-sm font-medium text-stone-700">Detailed description</span>
              <textarea
                name="description"
                value={form.description}
                onChange={handleInputChange}
                rows="4"
                placeholder="Describe soil health, seasonal output, irrigation, expected performance, and any unique adoption benefits."
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">Latitude</span>
              <input
                name="latitude"
                value={form.latitude}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">Longitude</span>
              <input
                name="longitude"
                value={form.longitude}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">Total capacity</span>
              <input
                name="totalCapacity"
                value={form.totalCapacity}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">Capacity unit</span>
              <select
                name="unitType"
                value={form.unitType}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400"
              >
                <option value="acres">Acres</option>
                <option value="hectares">Hectares</option>
                <option value="trees">Trees</option>
                <option value="plots">Plots</option>
                <option value="tanks">Tanks</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">Minimum adoption unit</span>
              <select
                name="minimumAdoptionUnit"
                value={form.minimumAdoptionUnit}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400"
              >
                <option value="WHOLE_FARM">Whole Farm</option>
                <option value="INDIVIDUAL_TREE">Individual Tree / Plot</option>
                <option value="PERCENTAGE_SHARE">Percentage Share</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">Price / adoption unit (₹)</span>
              <input
                name="price"
                value={form.price}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">Expected yield per unit</span>
              <input
                name="expectedYield"
                value={form.expectedYield}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">Yield unit</span>
              <select
                name="yieldUnit"
                value={form.yieldUnit}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400"
              >
                <option value="kg">Kg</option>
                <option value="tons">Tons</option>
                <option value="share">Output Share</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">Tenure / season duration</span>
              <input
                name="tenure"
                value={form.tenure}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400"
              />
            </label>

            <label className="md:col-span-2 block">
              <span className="mb-2 block text-sm font-medium text-stone-700">Map or image link</span>
              <input
                name="imageUrl"
                value={form.imageUrl}
                onChange={handleInputChange}
                placeholder="https://maps.google.com/… or image URL"
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400"
              />
            </label>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <a
              href="https://www.google.com/maps"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800"
            >
              <MapPinned className="h-4 w-4" /> Open map picker
            </a>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              {loading ? 'Publishing...' : 'Publish listing'}
            </button>
          </div>
        </form>

        <aside className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-stone-500">Your listings</p>
              <h2 className="text-xl font-bold text-stone-900">Active Adoption Listings</h2>
            </div>
          </div>

          {isFetchingListings ? (
            <p className="text-sm text-stone-500">Loading listings...</p>
          ) : listings.length === 0 ? (
            <p className="text-sm text-stone-500">No adoption listings have been created yet.</p>
          ) : (
            <div className="space-y-3">
              {listings.map((listing) => (
                <div key={listing.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-stone-900">{listing.title || listing.name}</p>
                      <p className="text-xs text-stone-500">{listing.farmerName || 'Farmer'} • {listing.category}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAvailabilityToggle(listing.id, !listing.active)}
                      className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-stone-700"
                    >
                      {listing.active ? <ToggleRight className="h-4 w-4 text-emerald-600" /> : <ToggleLeft className="h-4 w-4 text-stone-400" />}
                      {listing.active ? 'Active' : 'Paused'}
                    </button>
                  </div>
                  <div className="space-y-1 text-xs text-stone-600">
                    <p>Price: ₹{listing.price ?? 0} / {listing.unitLabel || 'unit'}</p>
                    <p>Available: {listing.quantityAvailable ?? 0}</p>
                    <p>Yield: {listing.pointsReward ?? 0} pts / {listing.carbonOffsetKg ?? 0} kg CO₂</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
