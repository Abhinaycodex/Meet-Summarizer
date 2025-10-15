import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from '../src/pages/Home';
import Dashboard from '../src/pages/Dashboard';
import SummaryView from './pages/SummaryView';
import Navbar from './components/Navbar';
import Working from './pages/working';
import Recorder from './components/Recoder';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = AuthProvider();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Toaster position="top-right" />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />}/>
            <Route path="/SummaryView" element={<SummaryView />}/>
            <Route path="/working" element={<Working />} />
            <Route path="/record" element={<Recorder />} />
            <Route
              path="/summary/:id"
              element={
                <ProtectedRoute>
                  <SummaryView />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;