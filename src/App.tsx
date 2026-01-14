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
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
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
    if (location.pathname === '/customers') return 'Customer Management';
    if (location.pathname.startsWith('/accounting/')) return 'Customer Accounting';
    if (location.pathname === '/accounting') return 'Accounting Dashboard';
    if (location.pathname === '/reports') return 'Reports & Analytics';
    if (location.pathname === '/settings') return 'System Settings';
    return 'NVH Agri Green';
  };

  const getPageDescription = () => {
    if (location.pathname === '/') return 'Welcome to your dashboard';
    if (location.pathname === '/customers') return 'Manage your vetiver farming customers';
    if (location.pathname.startsWith('/accounting/')) return 'Track customer expenses and investments';
    if (location.pathname === '/accounting') return 'Financial management system';
    if (location.pathname === '/reports') return 'View analytics and insights';
    if (location.pathname === '/settings') return 'Configure system preferences';
    return 'Vetiver Farming System';
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 mt-16 md:mt-0">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">{getPageTitle()}</h2>
          <p className="text-sm text-gray-500">{getPageDescription()}</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Removed "New Transaction" button */}
          <div className="w-10 h-10 bg-gray-100 rounded-full hidden md:block"></div>
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
    if (window.innerWidth < 768) { // 768px is Tailwind's md breakpoint
      setSidebarOpen(false);
    }
  }, [location]);

  // Close sidebar when clicking on overlay
  const closeSidebar = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile menu button - FIXED POSITIONING */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-3 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700 transition-colors"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{ zIndex: 9999, marginTop: '16px' }}
        aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar - MOBILE RESPONSIVE */}
      <div className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 fixed md:relative
        w-full md:w-64 bg-white border-r border-gray-200 min-h-screen p-6 flex flex-col
        transition-transform duration-300 ease-in-out z-40
        overflow-y-auto
      `}>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-green-800 flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">NVH</span>
            </div>
            Agri Green
          </h1>
          <p className="text-sm text-gray-500 mt-1">Vetiver Farming System</p>
        </div>

        <nav className="space-y-2">
          <Link 
            to="/" 
            onClick={closeSidebar}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors min-h-[44px] ${
              location.pathname === '/'
                ? 'bg-green-50 text-green-700 font-medium'
                : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
            }`}
          >
            <Home className="w-5 h-5" />
            Dashboard
          </Link>
          
          <Link 
            to="/customers" 
            onClick={closeSidebar}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors min-h-[44px] ${
              location.pathname === '/customers' || location.pathname.startsWith('/accounting/')
                ? 'bg-green-50 text-green-700 font-medium'
                : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
            }`}
          >
            <Users className="w-5 h-5" />
            Customers
          </Link>
          
          <Link 
            to="/accounting" 
            onClick={closeSidebar}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors min-h-[44px] ${
              location.pathname === '/accounting' || location.pathname.startsWith('/accounting/')
                ? 'bg-green-50 text-green-700 font-medium'
                : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
            }`}
          >
            <DollarSign className="w-5 h-5" />
            Accounting
          </Link>
          
          <Link 
            to="/reports" 
            onClick={closeSidebar}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors min-h-[44px] ${
              location.pathname === '/reports'
                ? 'bg-green-50 text-green-700 font-medium'
                : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
            }`}
          >
            <FileText className="w-5 h-5" />
            Reports
          </Link>
          
          <div className="pt-6 mt-6 border-t border-gray-200">
            <Link 
              to="/settings" 
              onClick={closeSidebar}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors min-h-[44px] ${
                location.pathname === '/settings'
                  ? 'bg-green-50 text-green-700 font-medium'
                  : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
            }`}
            >
              <Settings className="w-5 h-5" />
              Settings
            </Link>
          </div>
        </nav>

        {/* User Profile with Logout */}
        <div className="mt-auto pt-6">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <span className="font-semibold text-green-800">AD</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-800">Admin</p>
            </div>
            <button
              onClick={() => {
                auth.logout();
              }}
              className="text-xs text-red-600 hover:text-red-800 font-medium min-h-[44px] min-w-[44px] flex items-center"
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

      {/* Main Content - ADDED mobile padding top */}
      <div className="flex-1 flex flex-col md:pt-0 pt-16">
        {/* Top Bar - Now dynamic */}
        <TopBar />

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <div className="text-center py-12">
                  <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome to NVH Agri Green</h1>
                  <p className="text-gray-600">Select a section from the sidebar to begin</p>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/customers" element={
              <ProtectedRoute>
                <CustomersPage />
              </ProtectedRoute>
            } />
            
            {/* FIXED: This route MUST come before /accounting */}
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
                <div className="p-4 md:p-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">System Settings</h2>
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