import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ApiTest from './pages/ApiTest'; // Import the new test page

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
            <Route path="/test-api" element={<ApiTest />} /> {/* Route added */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;