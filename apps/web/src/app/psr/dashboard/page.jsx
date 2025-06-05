'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import PsrLayout from '@/components/layouts/PsrLayout';
import DashboardCard from '@/components/ui/DashboardCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ShopVisitModal from '@/components/modals/ShopVisitModal';
import NewShopModal from '@/components/modals/NewShopModal';
import toast from 'react-hot-toast';
import { 
  FiMapPin, 
  FiCheckCircle, 
  FiAlertCircle,
  FiPlus,
  FiRefreshCw,
  FiFilter,
  FiCheckSquare,
  FiList,
  FiMap
} from 'react-icons/fi';
import { RiIceCreamLine } from 'react-icons/ri';
import api from '@/lib/api';

// Import map component dynamically to avoid SSR issues with Leaflet
const NepalMap = dynamic(() => import('@/components/maps/NepalMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full flex items-center justify-center bg-sky-50 rounded-xl border border-sky-100">
      <LoadingSpinner size="lg" text="Loading map..." />
    </div>
  ),
});

export default function PsrDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'list'
  const [stats, setStats] = useState({
    totalAssignedShops: 0,
    visitedToday: 0,
    pendingVisits: 0,
    fridgeCount: 0
  });
  const [mapData, setMapData] = useState({
    dealers: [],
    shops: [],
    selectedShop: null
  });
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [districts, setDistricts] = useState(['All']);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [isNewShopModalOpen, setIsNewShopModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Redirect if not PSR
  useEffect(() => {
    if (!authLoading && user && user.role !== 'psr') {
      router.push('/unauthorized');
    }
  }, [user, authLoading, router]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchPsrDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch PSR's assigned shops
        const shopsResponse = await api.get('/shops/assigned');
        
        // Fetch PSR's assigned dealers
        const dealersResponse = await api.get('/dealers/assigned');
        
        // Fetch visit statistics
        const statsResponse = await api.get('/visits/stats');
        
        // Extract unique districts
        const uniqueDistricts = ['All', ...new Set(dealersResponse.data.map(dealer => dealer.district))];
        setDistricts(uniqueDistricts);
        
        // Set shop and dealer data
        setMapData({
          dealers: dealersResponse.data,
          shops: shopsResponse.data,
          selectedShop: null
        });
        
        // Set statistics
        setStats({
          totalAssignedShops: shopsResponse.data.length,
          visitedToday: statsResponse.data.visitedToday,
          pendingVisits: shopsResponse.data.length - statsResponse.data.visitedToday,
          fridgeCount: statsResponse.data.fridgeCount
        });
        
      } catch (error) {
        console.error('Error fetching PSR dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    if (user && user.role === 'psr') {
      fetchPsrDashboardData();
    }
  }, [user, refreshTrigger]);

  // Handle shop selection on map
  const handleShopSelect = (shopId) => {
    const selected = mapData.shops.find(s => s.id === shopId);
    setMapData(prev => ({
      ...prev,
      selectedShop: selected
    }));
    setIsVisitModalOpen(true);
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

  // Handle visit submission
  const handleVisitSubmit = async (visitData) => {
    try {
      await api.post('/visits', visitData);
      toast.success('Visit recorded successfully');
      setIsVisitModalOpen(false);
      // Refresh data
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error recording visit:', error);
      toast.error('Failed to record visit');
    }
  };

  // Handle new shop submission
  const handleNewShopSubmit = async (shopData) => {
    try {
      await api.post('/shops', shopData);
      toast.success('New shop added successfully');
      setIsNewShopModalOpen(false);
      // Refresh data
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error adding new shop:', error);
      toast.error('Failed to add new shop');
    }
  };

  // Refresh data
  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (authLoading || (user && user.role !== 'psr')) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <LoadingSpinner size="xl" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <PsrLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {/* Dashboard Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 font-poppins">
            Welcome, {user?.fullName || 'PSR'}
          </h1>
          <p className="mt-1 text-gray-600">
            Track your assigned shops and record visits
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <DashboardCard 
            title="Assigned Shops" 
            value={stats.totalAssignedShops} 
            icon={<FiMapPin className="text-blue-500" />}
            loading={isLoading}
          />
          <DashboardCard 
            title="Shops Visited Today" 
            value={stats.visitedToday} 
            icon={<FiCheckCircle className="text-green-500" />}
            loading={isLoading}
            progressValue={stats.totalAssignedShops ? (stats.visitedToday / stats.totalAssignedShops) * 100 : 0}
          />
          <DashboardCard 
            title="Pending Visits" 
            value={stats.pendingVisits} 
            icon={<FiAlertCircle className="text-amber-500" />}
            loading={isLoading}
          />
          <DashboardCard 
            title="Total Freezers" 
            value={stats.fridgeCount} 
            icon={<RiIceCreamLine className="text-pink-500" />}
            loading={isLoading}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => setIsNewShopModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm transition-colors"
          >
            <FiPlus className="mr-2" />
            Add New Shop
          </button>
          
          <button
            onClick={refreshData}
            className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md shadow-sm transition-colors"
          >
            <FiRefreshCw className="mr-2" />
            Refresh Data
          </button>

          <div className="flex-grow"></div>
          
          {/* View Toggle */}
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode('map')}
              className={`px-4 py-2 rounded-l-md ${
                viewMode === 'map' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-300 transition-colors`}
            >
              <FiMap className="inline mr-1" />
              Map
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-r-md ${
                viewMode === 'list' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-300 border-l-0 transition-colors`}
            >
              <FiList className="inline mr-1" />
              List
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center">
            <FiFilter className="mr-2 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filter:</span>
          </div>
          
          <div className="relative">
            <select
              value={selectedDistrict}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="pl-3 pr-8 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              {districts.map(district => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-grow"></div>
          
          <div className="text-sm text-gray-500">
            Showing {filteredShops.length} of {stats.totalAssignedShops} shops
          </div>
        </div>

        {/* Map View */}
        {viewMode === 'map' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
            <div className="p-0">
              <NepalMap 
                shops={filteredShops}
                dealers={mapData.dealers}
                selectedShop={mapData.selectedShop}
                onShopSelect={handleShopSelect}
                height={500}
                isLoading={isLoading}
                showVisitStatus={true}
              />
            </div>
            
            {/* Map Legend */}
            <div className="px-5 py-3 bg-sky-50 border-t border-sky-100 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span>Visited Today</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                <span>Not Visited Today</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                <span>Needs Attention</span>
              </div>
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Shop Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Freezers
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Visit Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center">
                        <LoadingSpinner size="md" text="Loading shops..." />
                      </td>
                    </tr>
                  ) : filteredShops.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                        No shops found in this area
                      </td>
                    </tr>
                  ) : (
                    filteredShops.map((shop) => (
                      <tr key={shop.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <FiMapPin className="text-blue-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{shop.name}</div>
                              <div className="text-sm text-gray-500">ID: {shop.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{shop.addressText || 'N/A'}</div>
                          <div className="text-xs text-gray-500">
                            {shop.latitude.toFixed(6)}, {shop.longitude.toFixed(6)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{shop.fridgeCount || 0} units</div>
                          {shop.fridgeCount > 0 && (
                            <div className="text-xs text-gray-500">
                              {shop.workingFridges || 0} working
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {shop.visitedToday ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Visited Today
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
                              Not Visited
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setMapData(prev => ({
                                ...prev,
                                selectedShop: shop
                              }));
                              setIsVisitModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            <FiCheckSquare className="inline mr-1" />
                            Record Visit
                          </button>
                          <button
                            onClick={() => router.push(`/psr/shops/${shop.id}`)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Visit Modal */}
      {isVisitModalOpen && mapData.selectedShop && (
        <ShopVisitModal
          isOpen={isVisitModalOpen}
          onClose={() => setIsVisitModalOpen(false)}
          shop={mapData.selectedShop}
          onSubmit={handleVisitSubmit}
        />
      )}

      {/* New Shop Modal */}
      {isNewShopModalOpen && (
        <NewShopModal
          isOpen={isNewShopModalOpen}
          onClose={() => setIsNewShopModalOpen(false)}
          dealers={mapData.dealers}
          onSubmit={handleNewShopSubmit}
        />
      )}
    </PsrLayout>
  );
}
