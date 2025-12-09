'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { expenseAPI, projectAPI, exportAPI } from '@/lib/api';

export default function MaterialsPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    projectId: '',
    category: '',
    search: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [expensesRes, projectsRes] = await Promise.all([
        expenseAPI.getAll({ type: 'material' }),
        projectAPI.getAll(),
      ]);
      setExpenses(expensesRes.data);
      setProjects(projectsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const filteredExpenses = expenses.filter((expense) => {
    if (filters.projectId && expense.projectId?._id !== filters.projectId) return false;
    if (filters.category && expense.category !== filters.category) return false;
    if (
      filters.search &&
      !expense.description?.toLowerCase().includes(filters.search.toLowerCase())
    )
      return false;
    return true;
  });

  const totalMaterials = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalReturns = expenses.reduce((sum, e) => sum + (e.returnAmount || 0), 0);
  const netCost = totalMaterials - totalReturns;

  const handleExport = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const response = await exportAPI.exportExpenses('material', currentYear.toString());
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8;' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `materials-expenses-${currentYear}-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const MaterialIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );

  const BackIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );

  const ExportIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  const ReturnIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );

  const MoneyIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
              <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600">
                <MaterialIcon />
              </div>
              <span>Materials</span>
            </h1>
          </div>
          <button 
            onClick={handleExport}
            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-md transition-all font-medium text-sm shadow-sm hover:shadow flex items-center gap-2"
          >
            <ExportIcon />
            Export CSV
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-lg border-l-4 border-orange-500 border-t border-r border-b border-gray-200 p-5 shadow-md hover:shadow-lg transition-all duration-300 hover:shadow-orange-500/20">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600 mb-3 shadow-sm">
              <MaterialIcon />
            </div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Materials</p>
            <p className="text-2xl font-semibold text-orange-700">
              ${totalMaterials.toLocaleString()}
            </p>
          </div>
          <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-lg border border-gray-200 p-5 shadow-md hover:shadow-lg transition-all duration-300 hover:shadow-green-500/20">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600 mb-3 shadow-sm">
              <ReturnIcon />
            </div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Returns</p>
            <p className="text-2xl font-semibold text-green-700">
              ${totalReturns.toLocaleString()}
            </p>
          </div>
          <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-lg border border-gray-200 p-5 shadow-md hover:shadow-lg transition-all duration-300 hover:shadow-blue-500/20">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-3 shadow-sm">
              <MoneyIcon />
            </div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Net Cost</p>
            <p className="text-2xl font-semibold text-blue-700">${netCost.toLocaleString()}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-5 mb-6 border border-gray-200">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Filters
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <select
              value={filters.projectId}
              onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm"
            >
              <option value="">All projects</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm"
            >
              <option value="">All categories</option>
              <option value="Construction">Construction</option>
              <option value="Electric">Electric</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Paint">Paint</option>
              <option value="Finishes">Finishes</option>
              <option value="Other">Other</option>
            </select>
            <input
              type="text"
              placeholder="Search..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm"
            />
          </div>
        </div>

        {/* Details */}
        <div className="bg-white rounded-lg p-5 border border-gray-200">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Materials Details ({filteredExpenses.length})
          </h2>
          {filteredExpenses.length === 0 ? (
            <p className="text-center text-gray-500 py-8 text-sm">
              There are no materials to show.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Project</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Category</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Description</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Return</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Net Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((expense) => {
                    const netCost = expense.amount - (expense.returnAmount || 0);
                    return (
                      <tr key={expense._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-sm text-gray-900">{expense.projectId?.name || 'N/A'}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{expense.category}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{expense.description || 'N/A'}</td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">${expense.amount.toLocaleString()}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          ${(expense.returnAmount || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-gray-900">${netCost.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

