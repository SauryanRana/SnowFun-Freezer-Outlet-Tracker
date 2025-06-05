'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FiHome, 
  FiMapPin, 
  FiUsers, 
  FiBox, 
  FiPieChart, 
  FiSettings, 
  FiMenu, 
  FiX, 
  FiLogOut, 
  FiBell, 
  FiChevronDown,
  FiUser
} from 'react-icons/fi';
import { RiIceCreamLine } from 'react-icons/ri';

/**
 * AdminLayout component for Snowfun Nepal admin dashboard
 * 
 * Provides consistent layout with responsive sidebar navigation,
 * header with user profile, and main content area.
 */
export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Navigation links for sidebar
  const navLinks = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: <FiHome size={20} /> },
    { name: 'Shops', href: '/admin/shops', icon: <FiMapPin size={20} /> },
    { name: 'Dealers', href: '/admin/dealers', icon: <FiUsers size={20} /> },
    { name: 'PSRs', href: '/admin/psrs', icon: <FiUsers size={20} /> },
    { name: 'Freezers', href: '/admin/freezers', icon: <RiIceCreamLine size={20} /> },
    { name: 'Reports', href: '/admin/reports', icon: <FiPieChart size={20} /> },
    { name: 'Settings', href: '/admin/settings', icon: <FiSettings size={20} /> },
  ];

  // Check if current route is active
  const isActiveRoute = (href) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // Handle window resize to toggle between desktop and mobile layouts
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileDropdownOpen && !event.target.closest('#profile-dropdown')) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  // Toggle sidebar on desktop
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Toggle profile dropdown
  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-20 bg-gray-600 bg-opacity-75 transition-opacity lg:hidden"
          onClick={toggleMobileMenu}
        ></div>
      )}

      {/* Sidebar for desktop */}
      <div 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isSidebarOpen ? 'lg:w-64' : 'lg:w-20'}`}
      >
        {/* Sidebar header */}
        <div className={`flex items-center justify-between h-16 px-4 border-b border-gray-200 ${
          isSidebarOpen ? 'lg:justify-between' : 'lg:justify-center'
        }`}>
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Image 
                src="/logo-snowfun.png" 
                alt="Snowfun Nepal Logo" 
                width={40} 
                height={40}
                className="rounded-md"
              />
            </div>
            {(isSidebarOpen || isMobile) && (
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-blue-900">Snowfun Nepal</h1>
                <p className="text-xs text-blue-600">Admin Dashboard</p>
              </div>
            )}
          </div>
          
          {/* Close button for mobile */}
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700 focus:outline-none"
            onClick={toggleMobileMenu}
          >
            <FiX size={24} />
          </button>
          
          {/* Toggle button for desktop */}
          {!isMobile && (
            <button
              className="hidden lg:block text-gray-500 hover:text-gray-700 focus:outline-none"
              onClick={toggleSidebar}
            >
              {isSidebarOpen ? <FiChevronDown size={20} className="rotate-90" /> : <FiChevronDown size={20} className="-rotate-90" />}
            </button>
          )}
        </div>

        {/* Sidebar content */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navLinks.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  isActiveRoute(item.href)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors duration-200`}
              >
                <div className={`${
                  isActiveRoute(item.href) ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                } mr-3 flex-shrink-0`}>
                  {item.icon}
                </div>
                {(isSidebarOpen || isMobile) && (
                  <span className="flex-1">{item.name}</span>
                )}
              </Link>
            ))}
          </nav>

          {/* Sidebar footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className={`w-full group flex items-center px-2 py-2 text-base font-medium rounded-md text-red-600 hover:bg-red-50 transition-colors duration-200`}
            >
              <FiLogOut className="mr-3 flex-shrink-0 text-red-500" size={20} />
              {(isSidebarOpen || isMobile) && (
                <span>Logout</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="bg-white shadow-sm z-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              {/* Left side - Mobile menu button */}
              <div className="flex items-center">
                <button
                  className="lg:hidden -ml-1 mr-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  onClick={toggleMobileMenu}
                >
                  <span className="sr-only">Open sidebar</span>
                  <FiMenu size={24} />
                </button>
                
                {/* Breadcrumb can go here */}
              </div>

              {/* Right side - User profile & notifications */}
              <div className="flex items-center">
                {/* Notifications */}
                <button className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 focus:outline-none">
                  <span className="sr-only">View notifications</span>
                  <div className="relative">
                    <FiBell size={20} />
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
                  </div>
                </button>

                {/* Profile dropdown */}
                <div className="ml-3 relative" id="profile-dropdown">
                  <div>
                    <button
                      onClick={toggleProfileDropdown}
                      className="flex items-center max-w-xs text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <span className="sr-only">Open user menu</span>
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        {user?.fullName?.charAt(0) || <FiUser size={16} />}
                      </div>
                      <span className="ml-2 hidden md:flex items-center">
                        <span className="text-sm font-medium text-gray-700 mr-1">{user?.fullName || 'Admin User'}</span>
                        <FiChevronDown size={16} className="text-gray-400" />
                      </span>
                    </button>
                  </div>

                  {/* Profile dropdown menu */}
                  {isProfileDropdownOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none">
                      <div className="py-1">
                        <p className="px-4 py-2 text-sm text-gray-700 truncate">
                          {user?.email || 'admin@snowfun.com'}
                        </p>
                      </div>
                      <div className="py-1">
                        <Link
                          href="/admin/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Your Profile
                        </Link>
                        <Link
                          href="/admin/settings"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Settings
                        </Link>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
