'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { expenseAPI, projectAPI, exportAPI } from '@/lib/api';

export default function OperatingExpensesPage() {
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
        expenseAPI.getAll({ type: 'operating' }),
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

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const uniqueProjects = new Set(expenses.map((e) => e.projectId?._id)).size;
  const uniqueCategories = new Set(expenses.map((e) => e.category)).size;

  const handleExport = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const response = await exportAPI.exportExpenses('operating', currentYear.toString());
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8;' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `operating-expenses-${currentYear}-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const OperatingIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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
                <OperatingIcon />
              </div>
              <span>Operating Expenses</span>
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
          <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-lg border-l-4 border-blue-500 border-t border-r border-b border-gray-200 p-5 shadow-md hover:shadow-lg transition-all duration-300 hover:shadow-blue-500/20">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-3 shadow-sm">
              <OperatingIcon />
            </div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Operating Expenses</p>
            <p className="text-2xl font-semibold text-blue-700">
              ${totalExpenses.toLocaleString()}
            </p>
          </div>
          <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-lg border border-gray-200 p-5 shadow-md hover:shadow-lg transition-all duration-300">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Projects with Expenses</p>
            <p className="text-2xl font-semibold text-gray-900">{uniqueProjects}</p>
          </div>
          <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-lg border border-gray-200 p-5 shadow-md hover:shadow-lg transition-all duration-300">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Categories Used</p>
            <p className="text-2xl font-semibold text-gray-900">{uniqueCategories}</p>
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
              <option value="Utilities">Utilities</option>
              <option value="Rent">Rent</option>
              <option value="Insurance">Insurance</option>
              <option value="Equipment">Equipment</option>
              <option value="Maintenance">Maintenance</option>
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
            Details of Expenses ({filteredExpenses.length})
          </h2>
          {filteredExpenses.length === 0 ? (
            <p className="text-center text-gray-500 py-8 text-sm">
              There are no expenses to show.
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
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((expense) => (
                    <tr key={expense._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm text-gray-900">{expense.projectId?.name || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{expense.category}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{expense.description || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">${expense.amount.toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(expense.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

