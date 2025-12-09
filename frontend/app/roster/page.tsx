'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { expenseAPI, projectAPI, userAPI, exportAPI } from '@/lib/api';

export default function RosterPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    projectId: '',
    employeeId: '',
    category: '',
    search: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [expensesRes, projectsRes, employeesRes] = await Promise.all([
        expenseAPI.getAll({ type: 'payroll' }),
        projectAPI.getAll(),
        userAPI.getEmployees(),
      ]);
      setExpenses(expensesRes.data);
      setProjects(projectsRes.data);
      setEmployees(employeesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const filteredExpenses = expenses.filter((expense) => {
    if (filters.projectId && expense.projectId?._id !== filters.projectId) return false;
    if (filters.employeeId && expense.employeeId?._id !== filters.employeeId) return false;
    if (filters.category && expense.category !== filters.category) return false;
    if (
      filters.search &&
      !expense.description?.toLowerCase().includes(filters.search.toLowerCase())
    )
      return false;
    return true;
  });

  const totalPayroll = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalAdvances = expenses.reduce((sum, e) => sum + (e.advancement || 0), 0);
  const totalDays = expenses.reduce((sum, e) => sum + (e.daysWorked || 0), 0);

  // Calculate weekly ending balance
  const calculateWeeklyBalance = (expense: any) => {
    const amount = expense.amount || 0;
    const advancement = expense.advancement || 0;
    return amount - advancement;
  };

  const handleExport = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const response = await exportAPI.exportExpenses('payroll', currentYear.toString());
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8;' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payroll-expenses-${currentYear}-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-800 text-sm sm:text-base"
            >
              ← Return
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-purple-600">👥</span>
              Roster
            </h1>
          </div>
          <button 
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base"
          >
            Export CSV
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-purple-100 rounded-xl p-6 border border-purple-300">
            <div className="text-purple-600 text-3xl mb-2">💰</div>
            <p className="text-sm text-gray-600 mb-1">Total Payroll</p>
            <p className="text-2xl font-bold text-purple-600">
              ${totalPayroll.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="text-orange-600 text-3xl mb-2">💰</div>
            <p className="text-sm text-gray-600 mb-1">Total Advances</p>
            <p className="text-2xl font-bold text-orange-600">
              ${totalAdvances.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="text-blue-600 text-3xl mb-2">📅</div>
            <p className="text-sm text-gray-600 mb-1">Total Days Worked</p>
            <p className="text-2xl font-bold text-blue-600">{totalDays}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-200">
          <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            🔽 Filters
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <select
              value={filters.projectId}
              onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}
              className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base"
            >
              <option value="">All projects</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              value={filters.employeeId}
              onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
              className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base"
            >
              <option value="">All employees</option>
              {employees.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.name}
                </option>
              ))}
            </select>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base"
            >
              <option value="">All categories</option>
              <option value="Salary">Salary</option>
              <option value="Overtime">Overtime</option>
              <option value="Bonds">Bonds</option>
              <option value="Benefits">Benefits</option>
              <option value="Other">Other</option>
            </select>
            <input
              type="text"
              placeholder="Look for..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Details */}
        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
          <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-4">
            Details of Expenses ({filteredExpenses.length})
          </h2>
          {filteredExpenses.length === 0 ? (
            <p className="text-center text-gray-500 py-8 text-sm sm:text-base">
              There are no expenses to show.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold">Project</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold">Employee</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold">Category</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold">Days</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold">Amount</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold">Advancement</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold">Ending Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((expense) => (
                    <tr key={expense._id} className="border-b hover:bg-gray-50">
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">{expense.projectId?.name || 'N/A'}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">{expense.employeeId?.name || 'N/A'}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">{expense.category}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">{expense.daysWorked || 0}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">${expense.amount.toLocaleString()}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">
                        ${(expense.advancement || 0).toLocaleString()}
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold">
                        ${calculateWeeklyBalance(expense).toLocaleString()}
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

