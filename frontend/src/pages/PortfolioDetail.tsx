import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { portfolioApi, holdingsApi, riskApi } from '../services/api';
import { Navbar } from '../components/layout/Navbar';
import { 
  Plus, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign, 
  PieChart,
  ArrowLeft,
  Trash2,
  Calculator
} from 'lucide-react';
import type { HoldingCreate, AssetClass } from '../types';

export const PortfolioDetail = () => {
  const { id } = useParams<{ id: string }>();
  const portfolioId = parseInt(id || '0');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showAddHolding, setShowAddHolding] = useState(false);
  const [holdingForm, setHoldingForm] = useState<HoldingCreate>({
    ticker: '',
    asset_class: 'equity' as AssetClass,
    quantity: 0,
    avg_cost: 0,
    current_price: 0,
    sector: '',
  });

  // Fetch portfolio
  const { data: portfolio } = useQuery({
    queryKey: ['portfolio', portfolioId],
    queryFn: () => portfolioApi.getById(portfolioId),
  });

  // Fetch holdings
  const { data: holdings, isLoading: holdingsLoading } = useQuery({
    queryKey: ['holdings', portfolioId],
    queryFn: () => holdingsApi.getAll(portfolioId),
  });

  // Fetch risk data
  const { data: riskData, isLoading: riskLoading } = useQuery({
    queryKey: ['risk', portfolioId],
    queryFn: () => riskApi.getLatest(portfolioId),
    retry: false,
  });

  // Create holding mutation
  const createHoldingMutation = useMutation({
    mutationFn: (data: HoldingCreate) => holdingsApi.create(portfolioId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holdings', portfolioId] });
      queryClient.invalidateQueries({ queryKey: ['risk', portfolioId] });
      setShowAddHolding(false);
      resetForm();
    },
  });

  // Delete holding mutation
  const deleteHoldingMutation = useMutation({
    mutationFn: (holdingId: number) => holdingsApi.delete(portfolioId, holdingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holdings', portfolioId] });
      queryClient.invalidateQueries({ queryKey: ['risk', portfolioId] });
    },
  });

  // Compute risk mutation
  const computeRiskMutation = useMutation({
    mutationFn: () => riskApi.compute(portfolioId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risk', portfolioId] });
    },
  });

  const resetForm = () => {
    setHoldingForm({
      ticker: '',
      asset_class: 'equity' as AssetClass,
      quantity: 0,
      avg_cost: 0,
      current_price: 0,
      sector: '',
    });
  };

  const handleSubmitHolding = (e: React.FormEvent) => {
    e.preventDefault();
    createHoldingMutation.mutate(holdingForm);
  };

  const totalValue = holdings?.reduce((sum, h) => {
    return sum + (h.market_value || (h.quantity * h.avg_cost));
  }, 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{portfolio?.name}</h1>
              <p className="mt-1 text-sm text-gray-600">
                Base Currency: {portfolio?.base_currency}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => computeRiskMutation.mutate()}
                disabled={!holdings || holdings.length === 0 || computeRiskMutation.isPending}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Calculator className="h-5 w-5" />
                <span>{computeRiskMutation.isPending ? 'Computing...' : 'Compute Risk'}</span>
              </button>
              <button
                onClick={() => setShowAddHolding(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>Add Holding</span>
              </button>
            </div>
          </div>
        </div>

        {/* Risk Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ${totalValue.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-10 w-10 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Volatility (30d)</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {riskLoading ? '...' : riskData ? `${riskData.volatility_30d?.toFixed(2)}%` : 'N/A'}
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Max Drawdown</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {riskLoading ? '...' : riskData ? `${riskData.max_drawdown_1y?.toFixed(2)}%` : 'N/A'}
                </p>
              </div>
              <AlertTriangle className="h-10 w-10 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sharpe Ratio</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {riskLoading ? '...' : riskData ? riskData.sharpe_ratio?.toFixed(2) : 'N/A'}
                </p>
              </div>
              <PieChart className="h-10 w-10 text-green-600" />
            </div>
          </div>
        </div>

        {/* Additional Risk Metrics */}
        {riskData && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Cash Allocation</p>
                <p className="text-xl font-semibold text-gray-900">{riskData.cash_pct?.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Top Holding</p>
                <p className="text-xl font-semibold text-gray-900">{riskData.top_holding_pct?.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Diversification Score</p>
                <p className="text-xl font-semibold text-gray-900">{riskData.diversification_score?.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Holdings Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Holdings</h2>
          </div>
          
          {holdingsLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading holdings...</p>
            </div>
          ) : holdings && holdings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ticker
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asset Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Market Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sector
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {holdings.map((holding) => (
                    <tr key={holding.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {holding.ticker}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {holding.asset_class}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {holding.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${holding.avg_cost.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${holding.current_price?.toFixed(2) || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${(holding.market_value || holding.quantity * holding.avg_cost).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {holding.sector || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => deleteHoldingMutation.mutate(holding.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-gray-500">No holdings yet. Add your first holding to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Holding Modal */}
      {showAddHolding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Holding</h2>
            <form onSubmit={handleSubmitHolding}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ticker
                    </label>
                    <input
                      type="text"
                      required
                      value={holdingForm.ticker}
                      onChange={(e) => setHoldingForm({ ...holdingForm, ticker: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="AAPL"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Asset Class
                    </label>
                    <select
                      value={holdingForm.asset_class}
                      onChange={(e) => setHoldingForm({ ...holdingForm, asset_class: e.target.value as AssetClass })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="equity">Equity</option>
                      <option value="bond">Bond</option>
                      <option value="cash">Cash</option>
                      <option value="crypto">Crypto</option>
                      <option value="commodity">Commodity</option>
                      <option value="real_estate">Real Estate</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={holdingForm.quantity}
                      onChange={(e) => setHoldingForm({ ...holdingForm, quantity: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Avg Cost
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={holdingForm.avg_cost}
                      onChange={(e) => setHoldingForm({ ...holdingForm, avg_cost: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="150.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={holdingForm.current_price}
                      onChange={(e) => setHoldingForm({ ...holdingForm, current_price: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="155.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sector (optional)
                    </label>
                    <input
                      type="text"
                      value={holdingForm.sector}
                      onChange={(e) => setHoldingForm({ ...holdingForm, sector: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Technology"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddHolding(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createHoldingMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {createHoldingMutation.isPending ? 'Adding...' : 'Add Holding'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};