import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ApiTest from './pages/ApiTest'; // Import the new test page
import Login from './pages/Login';
import Register from './pages/Register';
import ExploreFarms from './pages/ExploreFarms';
import TreeBookingPage from './pages/TreeBookingPage';
import FarmerDashboard from './pages/FarmerDashboard';
import AdoptionFarmsDashboard from './pages/AdoptionFarmsDashboard';
import VirtualFarm from './pages/VirtualFarm';
import PlantAdoptionPage from './pages/PlantAdoptionPage';
import MyBookings from './pages/MyBookings';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-stone-50 text-stone-800">
        <Navbar />

        {/* Quick helper link banner for testing */}
        <div className="bg-green-100 border-b border-green-200 py-2 px-4 text-center text-sm font-medium text-green-800">
          🛠️ Developer Quick Link: <Link to="/test-api" className="underline hover:text-green-900">Open API Tester Page</Link>
        </div>

        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/explore-farms" element={<ExploreFarms />} />
            <Route path="/tree-booking" element={<TreeBookingPage />} />
            <Route path="/dashboard" element={<FarmerDashboard />} />
            <Route path="/farmer/adoption-farms" element={<AdoptionFarmsDashboard />} />
            <Route path="/virtual-farm" element={<VirtualFarm />} />
            <Route path="/plant-adoption" element={<PlantAdoptionPage />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/test-api" element={<ApiTest />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;