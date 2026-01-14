// src/App.tsx - MOBILE PERFECT VERSION
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import CustomersPage from './pages/CustomersPage';
import { Home, Users, DollarSign, FileText, Settings, Menu, X } from 'lucide-react';
import './App.css';
import AccountingPage from './pages/AccountingPage';
import AccountingDashboard from './pages/AccountingDashboard';
import ReportPage from './pages/ReportPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import ChangePassword from './components/ChangePassword';

// Add ProtectedRoute component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Component for dynamic top bar title
const TopBar = () => {
  const location = useLocation();
  
  const getPageTitle = () => {
    if (location.pathname === '/') return 'Dashboard';
    if (location.pathname === '/customers') return 'Customers';
    if (location.pathname.startsWith('/accounting/')) return 'Accounting';
    if (location.pathname === '/accounting') return 'Accounting';
    if (location.pathname === '/reports') return 'Reports';
    if (location.pathname === '/settings') return 'Settings';
    return 'NVH Agri';
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 mt-12 md:mt-0">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-base font-semibold text-gray-800 md:text-xl">{getPageTitle()}</h2>
        </div>
      </div>
    </header>
  );
};

// Main App component
function App() {
  const location = useLocation();
  const auth = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auto-close sidebar on mobile when route changes
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [location]);

  const closeSidebar = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile menu button */}
      <button
        className="md:hidden fixed top-3 left-3 z-50 p-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{ zIndex: 9999 }}
        aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <div className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 fixed md:relative
        w-64 bg-white border-r border-gray-200 min-h-screen p-4 flex flex-col
        transition-transform duration-200 z-40
      `}>
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">NVH</span>
            </div>
            <h1 className="text-lg font-bold text-green-800">Agri Green</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1 hidden md:block">Vetiver Farming</p>
        </div>

        <nav className="space-y-1 flex-1">
          <Link 
            to="/" 
            onClick={closeSidebar}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
              location.pathname === '/'
                ? 'bg-green-50 text-green-700 font-medium'
                : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          
          <Link 
            to="/customers" 
            onClick={closeSidebar}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
              location.pathname === '/customers' || location.pathname.startsWith('/accounting/')
                ? 'bg-green-50 text-green-700 font-medium'
                : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Customers</span>
          </Link>
          
          <Link 
            to="/accounting" 
            onClick={closeSidebar}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
              location.pathname === '/accounting' || location.pathname.startsWith('/accounting/')
                ? 'bg-green-50 text-green-700 font-medium'
                : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Accounting</span>
          </Link>
          
          <Link 
            to="/reports" 
            onClick={closeSidebar}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
              location.pathname === '/reports'
                ? 'bg-green-50 text-green-700 font-medium'
                : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Reports</span>
          </Link>
          
          <div className="pt-4 mt-4 border-t border-gray-200">
            <Link 
              to="/settings" 
              onClick={closeSidebar}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
                location.pathname === '/settings'
                  ? 'bg-green-50 text-green-700 font-medium'
                  : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Link>
          </div>
        </nav>

        <div className="mt-auto pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 p-2">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="font-semibold text-green-800 text-sm">AD</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-800 text-sm">Admin</p>
            </div>
            <button
              onClick={() => {
                auth.logout();
                closeSidebar();
              }}
              className="text-xs text-red-600 hover:text-red-800 px-2 py-1"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 p-3 md:p-6">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <div className="text-center py-8">
                  <h1 className="text-xl font-bold text-gray-800 mb-3">Welcome</h1>
                  <p className="text-gray-600">Select a section from the sidebar</p>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/customers" element={
              <ProtectedRoute>
                <CustomersPage />
              </ProtectedRoute>
            } />
            
            <Route path="/accounting/:customerId" element={
              <ProtectedRoute>
                <AccountingPage />
              </ProtectedRoute>
            } />
            
            <Route path="/accounting" element={
              <ProtectedRoute>
                <AccountingDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/reports" element={
              <ProtectedRoute>
                <ReportPage />
              </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute>
                <div className="p-3">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Settings</h2>
                  <ChangePassword />
                </div>
              </ProtectedRoute>
            } />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function AppWrapper() {
  return (
    <Router>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Router>
  );
}

export default AppWrapper;