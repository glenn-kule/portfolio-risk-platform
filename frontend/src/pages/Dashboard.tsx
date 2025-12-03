import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { portfolioApi } from '../services/api';
import { Navbar } from '../components/layout/Navbar';
import { Plus, Folder, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Portfolio, PortfolioCreate } from '../types';

export const Dashboard = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [portfolioName, setPortfolioName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch portfolios
  const { data: portfolios, isLoading } = useQuery({
    queryKey: ['portfolios'],
    queryFn: portfolioApi.getAll,
  });

  // Create portfolio mutation
  const createMutation = useMutation({
    mutationFn: (data: PortfolioCreate) => portfolioApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      setShowCreateModal(false);
      setPortfolioName('');
      setCurrency('USD');
    },
  });

  const handleCreatePortfolio = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name: portfolioName,
      base_currency: currency,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Portfolios</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage and analyze your investment portfolios
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="h-5 w-5" />
            <span>New Portfolio</span>
          </button>
        </div>

        {/* Portfolio Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading portfolios...</p>
          </div>
        ) : portfolios && portfolios.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolios.map((portfolio: Portfolio) => (
              <div
                key={portfolio.id}
                onClick={() => navigate(`/portfolio/${portfolio.id}`)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <Folder className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {portfolio.name}
                      </h3>
                      <p className="text-sm text-gray-500">{portfolio.base_currency}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center text-sm text-gray-500">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span>Click to view details</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <Folder className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No portfolios</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first portfolio
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Portfolio
            </button>
          </div>
        )}
      </div>

      {/* Create Portfolio Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Create New Portfolio
            </h2>
            <form onSubmit={handleCreatePortfolio}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Portfolio Name
                  </label>
                  <input
                    type="text"
                    required
                    value={portfolioName}
                    onChange={(e) => setPortfolioName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Retirement Fund"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="JPY">JPY</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};