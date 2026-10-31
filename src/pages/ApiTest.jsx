import { useState } from 'react';
import api from '../services/api'; // Uses the Axios client we configured earlier

export default function ApiTest() {
  const [userId, setUserId] = useState('1d39c6de-c5bf-45ef-8e08-09ff9c781f14'); // Default from your Swagger screenshot
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUserProfile = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      // Calls http://localhost:8080/api/v1/users/{userId}/profile
      const res = await api.get(`/users/${userId}/profile`);
      setResponse(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to connect to backend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
        <h1 className="text-2xl font-bold text-green-800 mb-2">🔌 Backend API Connection Test</h1>
        <p className="text-stone-600 mb-6">
          Test live communication with your Spring Boot backend endpoints (matching your Swagger configuration).
        </p>

        {/* Input & Button Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              User ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter UUID..."
              className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none font-mono text-sm"
            />
          </div>

          <button
            onClick={fetchUserProfile}
            disabled={loading}
            className="bg-green-700 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Connecting to Backend...' : 'GET /api/v1/users/{userId}/profile'}
          </button>
        </div>
      </div>

      {/* Response Display Box */}
      {(response || error) && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
          <h2 className="text-lg font-semibold mb-3 text-stone-800">Response Output</h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}

          {response && (
            <div className="bg-stone-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
              <pre>{JSON.stringify(response, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}