'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { estimateAPI } from '@/lib/api';
import EstimateModal from '@/components/EstimateModal';

export default function DearPage() {
  const router = useRouter();
  const [estimates, setEstimates] = useState<any[]>([]);
  const [showEstimateModal, setShowEstimateModal] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState<any>(null);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      const params: any = {};
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      
      const response = await estimateAPI.getAll(params);
      setEstimates(response.data);
    } catch (error) {
      console.error('Error loading estimates:', error);
    }
  };

  const filteredEstimates = estimates;

  const totalEstimates = estimates.length;
  const drafts = estimates.filter(e => e.status === 'draft').length;
  const sent = estimates.filter(e => e.status === 'sent').length;
  const approved = estimates.filter(e => e.status === 'approved').length;
  const approvedAmount = estimates
    .filter(e => e.status === 'approved')
    .reduce((sum, e) => sum + (e.approvedAmount || e.total || 0), 0);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this estimate?')) {
      return;
    }
    try {
      await estimateAPI.delete(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete estimate:', error);
      alert('Failed to delete estimate. Please try again.');
    }
  };

  const BackIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );

  const DocumentIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  const FilterIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  );

  const SearchIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-1.5 text-sm font-medium"
            >
              <BackIcon />
              Return
            </button>
            <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                <DocumentIcon />
              </div>
              <span>Estimates and Quotes</span>
            </h1>
          </div>
          <button
            onClick={() => {
              setSelectedEstimate(null);
              setShowEstimateModal(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all font-medium text-sm shadow-sm hover:shadow flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Estimate
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total</p>
            <p className="text-2xl font-semibold text-gray-900">{totalEstimates}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Drafts</p>
            <p className="text-2xl font-semibold text-gray-900">{drafts}</p>
          </div>
          <div className="bg-white rounded-lg border-l-4 border-blue-500 border-t border-r border-b border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Sent</p>
            <p className="text-2xl font-semibold text-blue-700">{sent}</p>
          </div>
          <div className="bg-white rounded-lg border-l-4 border-green-500 border-t border-r border-b border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Approved</p>
            <p className="text-2xl font-semibold text-green-700">{approved}</p>
          </div>
          <div className="bg-white rounded-lg border-l-4 border-green-500 border-t border-r border-b border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Approved Amount</p>
            <p className="text-2xl font-semibold text-green-700">${approvedAmount.toLocaleString()}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-5 mb-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <FilterIcon />
            <h2 className="text-base font-semibold text-gray-900">Filters</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm"
            >
              <option value="">All states</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, client number..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* Estimates List */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Dear ({filteredEstimates.length})
          </h2>
          {filteredEstimates.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-gray-100 mb-4">
                <DocumentIcon />
              </div>
              <p className="text-gray-500 text-base font-medium mb-4">
                There are no estimates to show.
              </p>
              <button
                onClick={() => {
                  setSelectedEstimate(null);
                  setShowEstimateModal(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all font-medium text-sm"
              >
                + Create first estimate
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Estimate #</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Customer</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Project</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Total</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Valid Until</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEstimates.map((estimate) => (
                    <tr key={estimate._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{estimate.estimateNumber}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{estimate.customerName}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{estimate.projectTitle}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          estimate.status === 'approved' ? 'bg-green-100 text-green-800' :
                          estimate.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                          estimate.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {estimate.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">${estimate.total?.toLocaleString() || 0}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {estimate.validUntil ? new Date(estimate.validUntil).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedEstimate(estimate);
                              setShowEstimateModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(estimate._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Estimate Modal */}
      {showEstimateModal && (
        <EstimateModal
          estimate={selectedEstimate}
          onClose={() => {
            setShowEstimateModal(false);
            setSelectedEstimate(null);
          }}
          onSuccess={() => {
            setShowEstimateModal(false);
            setSelectedEstimate(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

