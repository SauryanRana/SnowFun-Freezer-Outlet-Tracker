'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/layouts/AdminLayout';
import DashboardCard from '@/components/ui/DashboardCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { 
  FiMapPin, 
  FiUsers, 
  FiCheckCircle, 
  FiAlertCircle,
  FiBox,
  FiPlusCircle,
  FiFilter,
  FiRefreshCw
} from 'react-icons/fi';
import { RiIceCreamLine } from 'react-icons/ri';
import api from '@/lib/api';

// Import map component dynamically to avoid SSR issues with Leaflet
const NepalMap = dynamic(() => import('@/components/maps/NepalMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full flex items-center justify-center bg-sky-50 rounded-xl border border-sky-100">
      <LoadingSpinner size="lg" text="Loading map..." />
    </div>
  ),
});

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalShops: 0,
    totalDealers: 0,
    totalPsrs: 0,
    totalFridges: 0,
    visitedToday: 0,
    pendingVisits: 0,
    fridgesByType: {
      'Hard Top': 0,
      'Curve Glass': 0,
      'Side Class': 0
    },
    fridgesByStatus: {
      working: 0,
      repair: 0,
      missing: 0
    }
  });
  const [mapData, setMapData] = useState({
    dealers: [],
    shops: [],
    selectedDealer: null
  });
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [districts, setDistricts] = useState(['All']);

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && user && user.role !== 'admin') {
      router.push('/unauthorized');
    }
  }, [user, authLoading, router]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch summary statistics
        const statsResponse = await api.get('/reports/dashboard-summary');
        setStats(statsResponse.data);
        
        // Fetch dealers for map
        const dealersResponse = await api.get('/dealers');
        
        // Fetch shops with coordinates for map
        const shopsResponse = await api.get('/shops', {
          params: { includeCoordinates: true }
        });
        
        // Extract unique districts
        const uniqueDistricts = ['All', ...new Set(dealersResponse.data.map(dealer => dealer.district))];
        setDistricts(uniqueDistricts);
        
        setMapData({
          dealers: dealersResponse.data,
          shops: shopsResponse.data,
          selectedDealer: null
        });
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user && user.role === 'admin') {
      fetchDashboardData();
    }
  }, [user]);

  // Handle dealer selection on map
  const handleDealerSelect = (dealerId) => {
    const selected = mapData.dealers.find(d => d.id === dealerId);
    setMapData(prev => ({
      ...prev,
      selectedDealer: selected
    }));
  };

  // Handle district filter change
  const handleDistrictChange = (district) => {
    setSelectedDistrict(district);
  };

  // Filter shops based on selected district
  const filteredShops = selectedDistrict === 'All' 
    ? mapData.shops 
    : mapData.shops.filter(shop => {
        const dealer = mapData.dealers.find(d => d.id === shop.dealerId);
        return dealer && dealer.district === selectedDistrict;
      });

  if (authLoading || (user && user.role !== 'admin')) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <LoadingSpinner size="xl" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 font-poppins">
            Welcome, {user?.fullName || 'Admin'}
          </h1>
          <p className="mt-2 text-gray-600">
            Here's an overview of Snowfun Nepal's freezer distribution and outlet status
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <DashboardCard 
            title="Total Shops" 
            value={stats.totalShops} 
            icon={<FiMapPin className="text-blue-500" />}
            trend={+5}
            trendLabel="from last week"
            loading={isLoading}
          />
          <DashboardCard 
            title="Total Freezers" 
            value={stats.totalFridges} 
            icon={<RiIceCreamLine className="text-pink-500" />}
            trend={+2}
            trendLabel="from last week"
            loading={isLoading}
          />
          <DashboardCard 
            title="Shops Visited Today" 
            value={stats.visitedToday} 
            icon={<FiCheckCircle className="text-green-500" />}
            trend={null}
            trendLabel="of total shops"
            loading={isLoading}
            progressValue={stats.totalShops ? (stats.visitedToday / stats.totalShops) * 100 : 0}
          />
          <DashboardCard 
            title="Pending Visits" 
            value={stats.pendingVisits} 
            icon={<FiAlertCircle className="text-amber-500" />}
            trend={null}
            trendLabel="require attention"
            loading={isLoading}
          />
        </div>

        {/* Map Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <FiMapPin className="mr-2 text-blue-500" />
                Nepal Distribution Map
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Interactive map of all shops and dealers across Nepal
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={selectedDistrict}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  {districts.map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
                <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              
              <button 
                onClick={() => setSelectedDistrict('All')}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              >
                <FiRefreshCw />
              </button>
            </div>
          </div>
          
          <div className="p-0">
            <NepalMap 
              dealers={mapData.dealers}
              shops={filteredShops}
              selectedDealer={mapData.selectedDealer}
              onDealerSelect={handleDealerSelect}
              height={500}
              isLoading={isLoading}
            />
          </div>
          
          {/* Map Legend */}
          <div className="px-5 py-3 bg-sky-50 border-t border-sky-100 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
              <span>Dealer Location</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span>Visited Shop</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
              <span>Pending Visit</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
              <span>Needs Attention</span>
            </div>
          </div>
        </div>

        {/* Quick Actions and Freezer Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Freezer Distribution */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden lg:col-span-2">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <FiBox className="mr-2 text-blue-500" />
                Freezer Distribution
              </h2>
            </div>
            <div className="p-5">
              {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <LoadingSpinner size="md" text="Loading freezer data..." />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Freezer Types */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">BY TYPE</h3>
                    <div className="space-y-4">
                      {Object.entries(stats.fridgesByType).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full ${
                              type === 'Hard Top' ? 'bg-blue-500' : 
                              type === 'Curve Glass' ? 'bg-pink-500' : 'bg-purple-500'
                            } mr-2`}></div>
                            <span>{type}</span>
                          </div>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Freezer Status */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">BY STATUS</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                          <span>Working</span>
                        </div>
                        <span className="font-medium">{stats.fridgesByStatus.working}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                          <span>Needs Repair</span>
                        </div>
                        <span className="font-medium">{stats.fridgesByStatus.repair}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                          <span>Missing</span>
                        </div>
                        <span className="font-medium">{stats.fridgesByStatus.missing}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <FiPlusCircle className="mr-2 text-blue-500" />
                Quick Actions
              </h2>
            </div>
            <div className="p-5">
              <div className="space-y-4">
                <button 
                  onClick={() => router.push('/admin/shops/new')}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <FiMapPin />
                  Add New Shop
                </button>
                
                <button 
                  onClick={() => router.push('/admin/dealers/new')}
                  className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <FiUsers />
                  Add New Dealer
                </button>
                
                <button 
                  onClick={() => router.push('/admin/fridges/new')}
                  className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <RiIceCreamLine />
                  Add New Freezer
                </button>
                
                <button 
                  onClick={() => router.push('/admin/users/new')}
                  className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <FiUsers />
                  Add New PSR
                </button>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-500 mb-3">RECENT ACTIVITY</h3>
                {isLoading ? (
                  <div className="h-32 flex items-center justify-center">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <FiCheckCircle className="text-blue-600" size={16} />
                      </div>
                      <div>
                        <p className="text-sm">
                          <span className="font-medium">Ramesh Sharma</span> visited 5 shops in Lalitpur
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Today, 10:45 AM</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <FiBox className="text-green-600" size={16} />
                      </div>
                      <div>
                        <p className="text-sm">
                          <span className="font-medium">Aarti Thapa</span> added 2 new freezers in Bhaktapur
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Yesterday, 2:30 PM</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
