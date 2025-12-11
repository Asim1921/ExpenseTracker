'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { expenseAPI, projectAPI, userAPI, exportAPI } from '@/lib/api';
import EmployeeModal from '@/components/EmployeeModal';

export default function RosterPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'expenses' | 'employees' | 'spending'>('expenses');
  const [expenses, setExpenses] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [showAddDayModal, setShowAddDayModal] = useState(false);
  const [comparePeriodsActive, setComparePeriodsActive] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState('this-month');
  const [previousPeriod, setPreviousPeriod] = useState('last-month');
  const [filters, setFilters] = useState({
    projectId: '',
    employeeId: '',
    category: '',
    search: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  // Helper function to get date range for a period
  const getPeriodDates = (period: string) => {
    const now = new Date();
    const start = new Date();
    const end = new Date();
    
    switch (period) {
      case 'this-month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(now.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'last-month':
        start.setMonth(now.getMonth() - 1);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'last-3-months':
        start.setMonth(now.getMonth() - 3);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'last-6-months':
        start.setMonth(now.getMonth() - 6);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'this-year':
        start.setMonth(0);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(11);
        end.setDate(31);
        end.setHours(23, 59, 59, 999);
        break;
      case 'last-year':
        start.setFullYear(now.getFullYear() - 1);
        start.setMonth(0);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setFullYear(now.getFullYear() - 1);
        end.setMonth(11);
        end.setDate(31);
        end.setHours(23, 59, 59, 999);
        break;
      default:
        return { start: null, end: null };
    }
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  };

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

  // Calculate metrics for a period
  const calculatePeriodMetrics = (periodExpenses: any[]) => {
    return {
      totalPayroll: periodExpenses.reduce((sum, e) => sum + e.amount, 0),
      totalAdvances: periodExpenses.reduce((sum, e) => sum + (e.advancement || 0), 0),
      totalDays: periodExpenses.reduce((sum, e) => sum + (e.daysWorked || 0), 0),
      records: periodExpenses.length,
    };
  };

  // Get expenses for a period
  const getPeriodExpenses = (period: string) => {
    const { start, end } = getPeriodDates(period);
    if (!start || !end) return expenses;
    
    return expenses.filter(expense => {
      if (!expense.createdAt) return false;
      const expenseDate = new Date(expense.createdAt).toISOString().split('T')[0];
      return expenseDate >= start && expenseDate <= end;
    });
  };

  const currentPeriodExpenses = getPeriodExpenses(currentPeriod);
  const previousPeriodExpenses = getPeriodExpenses(previousPeriod);
  
  const currentMetrics = calculatePeriodMetrics(currentPeriodExpenses);
  const previousMetrics = calculatePeriodMetrics(previousPeriodExpenses);

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
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

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
      return;
    }
    try {
      await userAPI.deleteEmployee(employeeId);
      loadData();
    } catch (error) {
      console.error('Failed to delete employee:', error);
      alert('Failed to delete employee. Please try again.');
    }
  };

  // Calculate employee spending per project
  const getEmployeeSpending = () => {
    const spendingMap: { [key: string]: { employee: any; projects: { [key: string]: { project: any; total: number; count: number } } } } = {};
    
    expenses.forEach((expense) => {
      if (!expense.employeeId) return;
      const empId = expense.employeeId._id || expense.employeeId;
      const projId = expense.projectId._id || expense.projectId;
      
      if (!spendingMap[empId]) {
        const employee = employees.find(e => (e._id === empId));
        spendingMap[empId] = {
          employee: employee || { name: 'Unknown' },
          projects: {},
        };
      }
      
      if (!spendingMap[empId].projects[projId]) {
        const project = projects.find(p => (p._id === projId));
        spendingMap[empId].projects[projId] = {
          project: project || { name: 'Unknown Project' },
          total: 0,
          count: 0,
        };
      }
      
      spendingMap[empId].projects[projId].total += expense.amount || 0;
      spendingMap[empId].projects[projId].count += 1;
    });
    
    return Object.values(spendingMap);
  };

  const employeeSpending = getEmployeeSpending();

  const PayrollIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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

  const MoneyIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const CalendarIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );

  const UserIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );

  const ChartIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );

  const EditIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );

  const DeleteIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
                <PayrollIcon />
              </div>
              <span>Roster</span>
            </h1>
          </div>
          {activeTab === 'expenses' && (
            <button 
              onClick={handleExport}
              className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-md transition-all font-medium text-sm shadow-sm hover:shadow flex items-center gap-2"
            >
              <ExportIcon />
              Export CSV
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('expenses')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'expenses'
                  ? 'text-gray-900 border-b-2 border-gray-900 bg-gray-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Payroll Expenses
            </button>
            <button
              onClick={() => setActiveTab('employees')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'employees'
                  ? 'text-gray-900 border-b-2 border-gray-900 bg-gray-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <UserIcon />
                Employees
              </span>
            </button>
            <button
              onClick={() => setActiveTab('spending')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'spending'
                  ? 'text-gray-900 border-b-2 border-gray-900 bg-gray-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <ChartIcon />
                Spending by Project
              </span>
            </button>
          </div>
        </div>

        {/* Employees Tab */}
        {activeTab === 'employees' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Employee Management</h2>
              <button
                onClick={() => {
                  setSelectedEmployee(null);
                  setShowEmployeeModal(true);
                }}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-md transition-all font-medium text-sm shadow-sm hover:shadow flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Employee
              </button>
            </div>

            {employees.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-gray-100 mb-4">
                  <UserIcon />
                </div>
                <p className="text-gray-500 text-base font-medium">
                  No employees yet. Add your first employee to get started.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Phone</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Position</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((employee) => (
                        <tr key={employee._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 text-sm font-medium text-gray-900">{employee.name}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{employee.email || '—'}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{employee.phone || '—'}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{employee.position || '—'}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedEmployee(employee);
                                  setShowEmployeeModal(true);
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <EditIcon />
                              </button>
                              <button
                                onClick={() => handleDeleteEmployee(employee._id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <DeleteIcon />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Spending by Project Tab */}
        {activeTab === 'spending' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Employee Spending by Project</h2>
            
            {employeeSpending.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-gray-100 mb-4">
                  <ChartIcon />
                </div>
                <p className="text-gray-500 text-base font-medium">
                  No spending data available. Add payroll expenses to see spending by project.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {employeeSpending.map((item, idx) => {
                  const totalSpending = Object.values(item.projects).reduce((sum, p) => sum + p.total, 0);
                  return (
                    <div key={idx} className="bg-white rounded-lg border border-gray-200 p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-base font-semibold text-gray-900">{item.employee.name}</h3>
                          {item.employee.email && (
                            <p className="text-sm text-gray-500 mt-1">{item.employee.email}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Spending</p>
                          <p className="text-xl font-semibold text-purple-700">${totalSpending.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Projects:</h4>
                        <div className="space-y-2">
                          {Object.values(item.projects).map((proj, pIdx) => (
                            <div key={pIdx} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-md">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{proj.project.name}</p>
                                <p className="text-xs text-gray-500">{proj.count} expense{proj.count !== 1 ? 's' : ''}</p>
                              </div>
                              <p className="text-sm font-semibold text-gray-900">${proj.total.toLocaleString()}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Expenses Tab */}
        {activeTab === 'expenses' && (
          <div>
            {/* Compare Periods Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h2 className="text-base font-semibold text-gray-900">Compare Periods</h2>
                </div>
                <button
                  onClick={() => setComparePeriodsActive(!comparePeriodsActive)}
                  className={`px-4 py-2 rounded-md transition-all font-medium text-sm ${
                    comparePeriodsActive
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  {comparePeriodsActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>

              {comparePeriodsActive && (
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Period</label>
                      <select
                        value={currentPeriod}
                        onChange={(e) => setCurrentPeriod(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm"
                      >
                        <option value="this-month">This month</option>
                        <option value="last-month">Last month</option>
                        <option value="last-3-months">Last 3 months</option>
                        <option value="last-6-months">Last 6 months</option>
                        <option value="this-year">This year</option>
                        <option value="last-year">Last year</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Previous Period</label>
                      <select
                        value={previousPeriod}
                        onChange={(e) => setPreviousPeriod(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm"
                      >
                        <option value="last-month">Last month</option>
                        <option value="this-month">This month</option>
                        <option value="last-3-months">Last 3 months</option>
                        <option value="last-6-months">Last 6 months</option>
                        <option value="this-year">This year</option>
                        <option value="last-year">Last year</option>
                      </select>
                    </div>
                  </div>

                  {/* Comparison Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                    {[
                      { label: 'Total Payroll', current: currentMetrics.totalPayroll, previous: previousMetrics.totalPayroll, format: 'currency' },
                      { label: 'Total Advances', current: currentMetrics.totalAdvances, previous: previousMetrics.totalAdvances, format: 'currency' },
                      { label: 'Days Worked', current: currentMetrics.totalDays, previous: previousMetrics.totalDays, format: 'number' },
                      { label: 'Records', current: currentMetrics.records, previous: previousMetrics.records, format: 'number' },
                    ].map((metric, idx) => {
                      const change = calculateChange(metric.current, metric.previous);
                      const changeValue = Math.abs(change).toFixed(0);
                      const isPositive = change >= 0;
                      
                      return (
                        <div key={idx} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{metric.label}</p>
                          <p className="text-xl font-semibold text-gray-900 mb-1">
                            {metric.format === 'currency' 
                              ? `$${metric.current.toLocaleString()}` 
                              : metric.current.toLocaleString()}
                          </p>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500">vs {metric.format === 'currency' ? `$${metric.previous.toLocaleString()}` : metric.previous.toLocaleString()}</span>
                            <span className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                              {isPositive ? '+' : '-'} {changeValue}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Comparison Chart */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="bg-gradient-to-br from-white via-gray-50/50 to-white rounded-xl border border-gray-200 shadow-lg p-6">
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Period Comparison</h3>
                        <p className="text-sm text-gray-500">
                          Visual comparison of key metrics between periods
                        </p>
                      </div>
                      
                      <div className="relative bg-white rounded-lg p-6 shadow-inner" style={{ height: '380px' }}>
                        <svg width="100%" height="380" viewBox="0 0 700 380" preserveAspectRatio="xMidYMid meet" className="overflow-visible">
                          {/* Background gradient */}
                          <defs>
                            <linearGradient id="currentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#3b82f6" stopOpacity="1" />
                              <stop offset="100%" stopColor="#2563eb" stopOpacity="1" />
                            </linearGradient>
                            <linearGradient id="previousGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#6b7280" stopOpacity="1" />
                              <stop offset="100%" stopColor="#4b5563" stopOpacity="1" />
                            </linearGradient>
                            <filter id="shadow">
                              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2"/>
                            </filter>
                          </defs>

                          {/* Y-axis labels */}
                          {[
                            { label: 'Total Payroll', index: 0, format: 'currency' },
                            { label: 'Total Advances', index: 1, format: 'currency' },
                            { label: 'Days Worked', index: 2, format: 'number' },
                            { label: 'Records', index: 3, format: 'number' },
                          ].map((item) => {
                            const y = 50 + (item.index * 80);
                            return (
                              <g key={item.index}>
                                <text
                                  x="20"
                                  y={y + 6}
                                  fontSize="13"
                                  fill="#1f2937"
                                  textAnchor="start"
                                  fontWeight="600"
                                  className="font-semibold"
                                >
                                  {item.label}
                                </text>
                              </g>
                            );
                          })}

                          {/* Grid lines with subtle styling */}
                          {[0, 1, 2, 3].map((index) => {
                            const y = 50 + (index * 80);
                            return (
                              <g key={index}>
                                <line
                                  x1="180"
                                  y1={y}
                                  x2="650"
                                  y2={y}
                                  stroke="#e5e7eb"
                                  strokeWidth="1.5"
                                  strokeDasharray="4,4"
                                  opacity="0.6"
                                />
                              </g>
                            );
                          })}

                          {/* Calculate bars for each metric */}
                          {(() => {
                            const metrics = [
                              { current: currentMetrics.totalPayroll, previous: previousMetrics.totalPayroll, format: 'currency', color: '#3b82f6' },
                              { current: currentMetrics.totalAdvances, previous: previousMetrics.totalAdvances, format: 'currency', color: '#8b5cf6' },
                              { current: currentMetrics.totalDays, previous: previousMetrics.totalDays, format: 'number', color: '#10b981' },
                              { current: currentMetrics.records, previous: previousMetrics.records, format: 'number', color: '#f59e0b' },
                            ];
                            
                            // Find max value for each metric separately for better scaling
                            const maxValues = metrics.map(m => Math.max(m.current, m.previous, 1));

                            return metrics.map((metric, index) => {
                              const y = 50 + (index * 80);
                              const maxValue = maxValues[index];
                              const barMaxWidth = 200;
                              const currentWidth = (metric.current / maxValue) * barMaxWidth;
                              const previousWidth = (metric.previous / maxValue) * barMaxWidth;
                              const barHeight = 24;
                              const spacing = 20;
                              const startX = 200;
                              const verticalSpacing = 8;

                              const formatValue = (val: number) => {
                                if (metric.format === 'currency') {
                                  return `$${val.toLocaleString()}`;
                                }
                                return val.toLocaleString();
                              };

                              return (
                                <g key={index}>
                                  {/* Current Period Bar with gradient and shadow */}
                                  <rect
                                    x={startX}
                                    y={y - barHeight / 2}
                                    width={Math.max(currentWidth, 4)}
                                    height={barHeight}
                                    fill={`url(#currentGradient)`}
                                    rx="6"
                                    filter="url(#shadow)"
                                    className="transition-all duration-300"
                                  />
                                  
                                  {/* Previous Period Bar with gradient and shadow */}
                                  <rect
                                    x={startX + currentWidth + spacing}
                                    y={y - barHeight / 2}
                                    width={Math.max(previousWidth, 4)}
                                    height={barHeight}
                                    fill={`url(#previousGradient)`}
                                    rx="6"
                                    filter="url(#shadow)"
                                    className="transition-all duration-300"
                                  />
                                  
                                  {/* Current Period Value Label with background */}
                                  {currentWidth > 50 && (
                                    <g>
                                      <rect
                                        x={startX + currentWidth - 60}
                                        y={y - 12}
                                        width="55"
                                        height="16"
                                        fill="rgba(59, 130, 246, 0.9)"
                                        rx="4"
                                      />
                                      <text
                                        x={startX + currentWidth - 32}
                                        y={y + 2}
                                        fontSize="10"
                                        fill="white"
                                        textAnchor="middle"
                                        fontWeight="600"
                                      >
                                        {formatValue(metric.current)}
                                      </text>
                                    </g>
                                  )}
                                  
                                  {/* Previous Period Value Label with background */}
                                  {previousWidth > 50 && (
                                    <g>
                                      <rect
                                        x={startX + currentWidth + spacing + previousWidth - 60}
                                        y={y - 12}
                                        width="55"
                                        height="16"
                                        fill="rgba(107, 114, 128, 0.9)"
                                        rx="4"
                                      />
                                      <text
                                        x={startX + currentWidth + spacing + previousWidth - 32}
                                        y={y + 2}
                                        fontSize="10"
                                        fill="white"
                                        textAnchor="middle"
                                        fontWeight="600"
                                      >
                                        {formatValue(metric.previous)}
                                      </text>
                                    </g>
                                  )}
                                  
                                  {/* Percentage change indicator */}
                                  {(() => {
                                    const change = calculateChange(metric.current, metric.previous);
                                    const changeValue = Math.abs(change).toFixed(1);
                                    const isPositive = change >= 0;
                                    const changeX = startX + currentWidth + spacing + previousWidth + 15;
                                    
                                    if (Math.abs(change) > 0.1) {
                                      return (
                                        <g>
                                          <circle
                                            cx={changeX}
                                            cy={y}
                                            r="12"
                                            fill={isPositive ? "#10b981" : "#ef4444"}
                                            opacity="0.1"
                                          />
                                          <text
                                            x={changeX}
                                            y={y + 4}
                                            fontSize="9"
                                            fill={isPositive ? "#10b981" : "#ef4444"}
                                            textAnchor="middle"
                                            fontWeight="700"
                                          >
                                            {isPositive ? '↑' : '↓'}
                                          </text>
                                          <text
                                            x={changeX + 20}
                                            y={y + 4}
                                            fontSize="10"
                                            fill={isPositive ? "#10b981" : "#ef4444"}
                                            textAnchor="start"
                                            fontWeight="600"
                                          >
                                            {changeValue}%
                                          </text>
                                        </g>
                                      );
                                    }
                                    return null;
                                  })()}
                                </g>
                              );
                            });
                          })()}
                        </svg>
                      </div>

                      {/* Legend and Comparison Text */}
                      <div className="mt-6 pt-5 border-t border-gray-200">
                        <div className="flex flex-wrap justify-center gap-6 mb-4">
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded shadow-sm"></div>
                            <span className="text-xs font-semibold text-blue-700">Current Period</span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="w-4 h-4 bg-gradient-to-r from-gray-400 to-gray-500 rounded shadow-sm"></div>
                            <span className="text-xs font-semibold text-gray-700">Previous Period</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-gray-700 mb-1">
                            Comparing Periods
                          </p>
                          <p className="text-xs text-gray-500 bg-gray-50 px-4 py-2 rounded-lg inline-block">
                            {currentPeriod.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} vs. {previousPeriod.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-lg border-l-4 border-purple-500 border-t border-r border-b border-gray-200 p-5 shadow-md hover:shadow-lg transition-all duration-300 hover:shadow-purple-500/20">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 mb-3 shadow-sm">
                  <MoneyIcon />
                </div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Payroll</p>
                <p className="text-2xl font-semibold text-purple-700">
                  ${totalPayroll.toLocaleString()}
                </p>
              </div>
              <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-lg border border-gray-200 p-5 shadow-md hover:shadow-lg transition-all duration-300 hover:shadow-orange-500/20">
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600 mb-3 shadow-sm">
                  <MoneyIcon />
                </div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Advances</p>
                <p className="text-2xl font-semibold text-orange-700">
                  ${totalAdvances.toLocaleString()}
                </p>
              </div>
              <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-lg border border-gray-200 p-5 shadow-md hover:shadow-lg transition-all duration-300 hover:shadow-blue-500/20">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-3 shadow-sm">
                  <CalendarIcon />
                </div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Days Worked</p>
                <p className="text-2xl font-semibold text-blue-700">{totalDays}</p>
              </div>
            </div>

            {/* Add Day Button */}
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowAddDayModal(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-all font-medium text-sm shadow-sm hover:shadow flex items-center gap-2"
              >
                <CalendarIcon />
                Add Day
              </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg p-5 mb-6 border border-gray-200">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                Filters
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                  value={filters.employeeId}
                  onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm"
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
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm"
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
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Employee</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Category</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Days</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Advancement</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Ending Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map((expense) => (
                      <tr key={expense._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-sm text-gray-900">{expense.projectId?.name || 'N/A'}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{expense.employeeId?.name || 'N/A'}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{expense.category}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{expense.daysWorked || 0}</td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">${expense.amount.toLocaleString()}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          ${(expense.advancement || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-gray-900">
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
        )}
      </div>

      {/* Employee Modal */}
      {showEmployeeModal && (
        <EmployeeModal
          employee={selectedEmployee}
          onClose={() => {
            setShowEmployeeModal(false);
            setSelectedEmployee(null);
          }}
          onSuccess={() => {
            setShowEmployeeModal(false);
            setSelectedEmployee(null);
            loadData();
          }}
        />
      )}

      {/* Add Day Modal */}
      {showAddDayModal && (
        <AddDayModal
          projects={projects}
          employees={employees}
          onClose={() => setShowAddDayModal(false)}
          onSuccess={() => {
            setShowAddDayModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

// Add Day Modal Component
interface AddDayModalProps {
  projects: any[];
  employees: any[];
  onClose: () => void;
  onSuccess: () => void;
}

function AddDayModal({ projects, employees, onClose, onSuccess }: AddDayModalProps) {
  const [formData, setFormData] = useState({
    projectId: '',
    employeeId: '',
    daysWorked: 1,
    amount: 0,
    advancement: 0,
    category: 'Salary',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.projectId || !formData.employeeId) {
      setError('Please select both project and employee');
      return;
    }

    if (formData.amount <= 0) {
      setError('Total amount must be greater than 0');
      return;
    }

    setLoading(true);

    try {
      await expenseAPI.create({
        type: 'payroll',
        projectId: formData.projectId,
        employeeId: formData.employeeId,
        category: formData.category,
        description: formData.description || undefined,
        amount: formData.amount,
        daysWorked: formData.daysWorked,
        advancement: formData.advancement || 0,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add day');
    } finally {
      setLoading(false);
    }
  };

  const CalendarIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );

  const CloseIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 my-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1 pr-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
                <CalendarIcon />
              </div>
              <span>Add Day</span>
            </h2>
            <p className="text-sm text-gray-500">
              Record the days worked by an employee.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md w-8 h-8 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <CloseIcon />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Project <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm"
              >
                <option value="">Select a project</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Employee <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm"
              >
                <option value="">Select an employee</option>
                {employees.map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Days Worked
              </label>
              <input
                type="number"
                min="1"
                value={formData.daysWorked}
                onChange={(e) => setFormData({ ...formData, daysWorked: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Total Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-7 pr-3 py-2.5 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Advance (optional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.advancement}
                onChange={(e) => setFormData({ ...formData, advancement: parseFloat(e.target.value) || 0 })}
                className="w-full pl-7 pr-3 py-2.5 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm"
            >
              <option value="Salary">Salary</option>
              <option value="Overtime">Overtime</option>
              <option value="Bonds">Bonds</option>
              <option value="Benefits">Benefits</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description (optional)
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm"
              placeholder="Example: Week of December 1-5"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-all font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-all font-medium text-sm shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? 'Adding...' : 'Add Day'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

