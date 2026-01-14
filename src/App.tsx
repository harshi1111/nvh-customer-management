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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
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

// Component for dynamic top bar title - MOBILE OPTIMIZED
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

  const getPageDescription = () => {
    if (location.pathname === '/') return 'Welcome';
    if (location.pathname === '/customers') return 'Manage customers';
    if (location.pathname.startsWith('/accounting/')) return 'Track expenses';
    if (location.pathname === '/accounting') return 'Financial management';
    if (location.pathname === '/reports') return 'View analytics';
    if (location.pathname === '/settings') return 'System preferences';
    return 'Vetiver Farming';
  };

  return (
    <header className="bg-white border-b border-gray-200 px-3 md:px-6 py-3 mt-14 md:mt-0">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 md:text-xl">{getPageTitle()}</h2>
          <p className="text-xs text-gray-500 md:text-sm">{getPageDescription()}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Removed empty div for mobile */}
          <div className="w-8 h-8 bg-gray-100 rounded-full hidden md:block"></div>
        </div>
      </div>
    </header>
  );
};

// Main App component - MOBILE FIRST DESIGN
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

  // Close sidebar
  const closeSidebar = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile menu button - COMPACT SIZE */}
      <button
        className="md:hidden fixed top-3 left-3 z-50 p-2.5 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{ zIndex: 9999 }}
        aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar - COMPACT MOBILE DESIGN */}
      <div className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 fixed md:relative
        w-64 md:w-56 bg-white border-r border-gray-200 min-h-screen p-4 md:p-5 flex flex-col
        transition-transform duration-200 ease-in-out z-40
        overflow-y-auto
      `}>
        {/* Logo - Smaller on mobile */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-green-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">NVH</span>
            </div>
            <h1 className="text-lg font-bold text-green-800">Agri Green</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1 hidden md:block">Vetiver Farming System</p>
        </div>

        {/* Navigation - Compact */}
        <nav className="space-y-1 flex-1">
          <Link 
            to="/" 
            onClick={closeSidebar}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors text-sm ${
              location.pathname === '/'
                ? 'bg-green-50 text-green-700 font-medium'
                : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
            }`}
          >
            <Home className="w-4 h-4 flex-shrink-0" />
            <span>Dashboard</span>
          </Link>
          
          <Link 
            to="/customers" 
            onClick={closeSidebar}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors text-sm ${
              location.pathname === '/customers' || location.pathname.startsWith('/accounting/')
                ? 'bg-green-50 text-green-700 font-medium'
                : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
            }`}
          >
            <Users className="w-4 h-4 flex-shrink-0" />
            <span>Customers</span>
          </Link>
          
          <Link 
            to="/accounting" 
            onClick={closeSidebar}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors text-sm ${
              location.pathname === '/accounting' || location.pathname.startsWith('/accounting/')
                ? 'bg-green-50 text-green-700 font-medium'
                : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
            }`}
          >
            <DollarSign className="w-4 h-4 flex-shrink-0" />
            <span>Accounting</span>
          </Link>
          
          <Link 
            to="/reports" 
            onClick={closeSidebar}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors text-sm ${
              location.pathname === '/reports'
                ? 'bg-green-50 text-green-700 font-medium'
                : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
            }`}
          >
            <FileText className="w-4 h-4 flex-shrink-0" />
            <span>Reports</span>
          </Link>
          
          <div className="pt-4 mt-4 border-t border-gray-200">
            <Link 
              to="/settings" 
              onClick={closeSidebar}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors text-sm ${
                location.pathname === '/settings'
                  ? 'bg-green-50 text-green-700 font-medium'
                  : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
              }`}
            >
              <Settings className="w-4 h-4 flex-shrink-0" />
              <span>Settings</span>
            </Link>
          </div>
        </nav>

        {/* User Profile - Compact */}
        <div className="mt-auto pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="font-semibold text-green-800 text-sm">AD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 text-sm truncate">Admin</p>
            </div>
            <button
              onClick={() => {
                auth.logout();
                closeSidebar();
              }}
              className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1"
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

      {/* Main Content - Proper mobile spacing */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <TopBar />

        {/* Page Content - Better mobile padding */}
        <main className="flex-1 p-3 md:p-6">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <div className="text-center py-8 md:py-12">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3 md:mb-4">Welcome to NVH Agri Green</h1>
                  <p className="text-gray-600 text-sm md:text-base">Select a section from the sidebar</p>
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
                <div className="p-3 md:p-6">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">System Settings</h2>
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

// Wrap App with Router and AuthProvider
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