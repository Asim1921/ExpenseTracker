'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Cookies from 'js-cookie';
import { projectAPI, expenseAPI, exportAPI } from '@/lib/api';
import MetricCard from './MetricCard';
import ActionButton from './ActionButton';
import ProjectModal from './ProjectModal';
import ViewProjectModal from './ViewProjectModal';
import PayrollModal from './PayrollModal';
import OperatingModal from './OperatingModal';
import MaterialModal from './MaterialModal';

interface Project {
  _id: string;
  name: string;
  grossIncome: number;
  profitSharingEnabled?: boolean;
  profitSharingType?: string;
  profitShares?: Array<{ name: string; percentage: number }>;
  createdAt?: string;
}

interface Expense {
  _id: string;
  type: string;
  amount: number;
  returnAmount?: number;
  projectId?: {
    _id: string;
    name?: string;
  } | string;
  employeeId?: {
    _id: string;
    name?: string;
  } | string;
  createdAt?: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects'>('dashboard');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [showOperatingModal, setShowOperatingModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>({
    startDate: '',
    endDate: '',
  });

  const loadData = async () => {
    try {
      const params: any = {};
      if (dateRange.startDate) params.startDate = dateRange.startDate;
      if (dateRange.endDate) params.endDate = dateRange.endDate;
      
      const [projectsRes, expensesRes] = await Promise.all([
        projectAPI.getAll(),
        expenseAPI.getAll(params),
      ]);
      setProjects(projectsRes.data);
      setExpenses(expensesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    const userStr = Cookies.get('user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userStr));
    loadData();
  }, [router]);

  useEffect(() => {
    loadData();
  }, [dateRange.startDate, dateRange.endDate]);

  const handleLogout = () => {
    Cookies.remove('token');
    Cookies.remove('user');
    router.push('/login');
  };

  const handleYearEndExport = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const response = await exportAPI.exportAll(currentYear.toString());
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8;' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `year-end-export-${currentYear}-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const calculateMetrics = () => {
    const totalRevenue = projects.reduce((sum, p) => sum + p.grossIncome, 0);
    const payrollExpenses = expenses
      .filter((e) => e.type === 'payroll')
      .reduce((sum, e) => sum + e.amount, 0);
    const operatingExpenses = expenses
      .filter((e) => e.type === 'operating')
      .reduce((sum, e) => sum + e.amount, 0);
    const materialExpenses = expenses
      .filter((e) => e.type === 'material')
      .reduce((sum, e) => sum + (e.amount - (e.returnAmount || 0)), 0);
    const totalExpenses = payrollExpenses + operatingExpenses + materialExpenses;
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      netProfit,
      profitMargin,
      payrollExpenses,
      operatingExpenses,
      materialExpenses,
    };
  };

  const metrics = calculateMetrics();

  // Calculate chart data
  const getMonthlyData = () => {
    const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyIncome: number[] = [];
    const monthlyBills: number[] = [];

    months.forEach((_, index) => {
      const monthStart = new Date(2024, 6 + index, 1);
      const monthEnd = new Date(2024, 7 + index, 0);
      
      const monthProjects = projects.filter(p => {
        const created = new Date(p.createdAt || Date.now());
        return created >= monthStart && created <= monthEnd;
      });
      const monthExpenses = expenses.filter(e => {
        const created = new Date(e.createdAt || Date.now());
        return created >= monthStart && created <= monthEnd;
      });

      monthlyIncome.push(monthProjects.reduce((sum, p) => sum + p.grossIncome, 0));
      monthlyBills.push(monthExpenses.reduce((sum, e) => sum + e.amount, 0));
    });

    return { months, monthlyIncome, monthlyBills };
  };

  const { months, monthlyIncome, monthlyBills } = getMonthlyData();
  const maxValue = Math.max(...monthlyIncome, ...monthlyBills, 3000);
  const chartHeight = 200;
  const chartWidth = 600;

  const getProjectComparisonData = () => {
    return projects.map(project => {
      const projectExpenses = expenses.filter(e => {
        const expenseProjectId = typeof e.projectId === 'object' ? e.projectId?._id : e.projectId;
        return expenseProjectId === project._id;
      });
      const totalExpenses = projectExpenses.reduce((sum, e) => sum + e.amount, 0);
      return {
        name: project.name,
        income: project.grossIncome,
        revenue: project.grossIncome - totalExpenses,
      };
    });
  };

  const projectComparisonData = getProjectComparisonData();
  const maxProjectValue = Math.max(...projectComparisonData.map(p => Math.max(p.income, p.revenue)), 3000);

  const profitableProjects = projects.filter(project => {
    const projectExpenses = expenses.filter(e => {
      const expenseProjectId = typeof e.projectId === 'object' ? e.projectId?._id : e.projectId;
      return expenseProjectId === project._id;
    });
    const totalExpenses = projectExpenses.reduce((sum, e) => sum + e.amount, 0);
    return project.grossIncome - totalExpenses > 0;
  }).length;

  // Professional SVG Icons
  const RevenueIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const ProfitIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );

  const MarginIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );

  const PayrollIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );

  const OperatingIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  const MaterialIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );

  const DocumentIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  const ExportIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  const LogoutIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );

  const CalendarIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );

  const handleResetDateRange = () => {
    setDateRange({ startDate: '', endDate: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white sticky top-0 z-40 border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                <Image
                  src="/logo.jpg"
                  alt="Logo"
                  fill
                  className="object-contain rounded"
                  priority
                />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                  Earnings Management
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Manage your projects, expenses, and profit distribution among partners.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-md border border-gray-200">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs font-medium text-gray-700 truncate max-w-[150px] sm:max-w-none">{user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-md transition-all duration-200 flex items-center gap-2 text-gray-700 font-medium text-sm shadow-sm hover:shadow"
              >
                Logout
                <LogoutIcon />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'text-gray-900 border-b-2 border-gray-900 bg-gray-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Dashboard
              </span>
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'projects'
                  ? 'text-gray-900 border-b-2 border-gray-900 bg-gray-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                Projects
              </span>
            </button>
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <>
            {/* Date Range Filter */}
            <div className="bg-white rounded-lg p-5 mb-6 border border-gray-200 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                    <CalendarIcon />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Filter by Period</h3>
                    <p className="text-sm text-gray-600">View expenses and metrics for a specific time period</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm"
                      placeholder="Start Date"
                    />
                    <input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm"
                      placeholder="End Date"
                    />
                  </div>
                  {(dateRange.startDate || dateRange.endDate) && (
                    <button
                      onClick={handleResetDateRange}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md transition-all font-medium text-gray-700 text-sm"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
              {(dateRange.startDate || dateRange.endDate) && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Showing data from{' '}
                    <span className="font-medium text-gray-900">
                      {dateRange.startDate || 'beginning'} to {dateRange.endDate || 'today'}
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <ActionButton
                label="Dear"
                icon={<DocumentIcon />}
                color="blue"
                onClick={() => router.push('/dear')}
              />
              <ActionButton
                label="Roster"
                icon={<PayrollIcon />}
                color="purple"
                onClick={() => router.push('/roster')}
              />
              <ActionButton
                label="Operating Expenses"
                icon={<OperatingIcon />}
                color="blue"
                onClick={() => router.push('/operating-expenses')}
              />
              <ActionButton
                label="Materials"
                icon={<MaterialIcon />}
                color="orange"
                onClick={() => router.push('/materials')}
              />
            </div>

            {/* Year-End Export */}
            <div className="bg-white rounded-lg p-5 mb-6 border border-gray-200 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    <ExportIcon />
                    Year-End Data Export
                  </h3>
                  <p className="text-sm text-gray-600">
                    Download all your data (projects, expenses, employees) for backup and review.
                  </p>
                </div>
                <button
                  onClick={handleYearEndExport}
                  className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-md transition-all font-medium text-sm shadow-sm hover:shadow flex items-center gap-2"
                >
                  <ExportIcon />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <MetricCard
                title="Total Revenue"
                value={`$${metrics.totalRevenue.toLocaleString()}`}
                icon={<RevenueIcon />}
                color="blue"
              />
              <MetricCard
                title="Net Profit"
                value={`$${metrics.netProfit.toLocaleString()}`}
                icon={<ProfitIcon />}
                color="green"
              />
              <MetricCard
                title="Profit Margin"
                value={`${metrics.profitMargin.toFixed(1)}%`}
                icon={<MarginIcon />}
                color="red"
              />
            </div>

            {/* Expense Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <MetricCard
                title="Payroll Expenses"
                value={`$${metrics.payrollExpenses.toLocaleString()}`}
                icon={<PayrollIcon />}
                color="purple"
              />
              <MetricCard
                title="Operating Expenses"
                value={`$${metrics.operatingExpenses.toLocaleString()}`}
                icon={<OperatingIcon />}
                color="blue"
              />
              <MetricCard
                title="Material Expenses"
                value={`$${metrics.materialExpenses.toLocaleString()}`}
                icon={<MaterialIcon />}
                color="orange"
              />
            </div>

            {/* Dashboard Tab Content */}
            <div className="space-y-6">
            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Monthly Trend Chart */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Monthly Trend</h3>
                <div className="h-[200px] flex items-end justify-between gap-2">
                  {months.map((month, index) => {
                    const incomeHeight = (monthlyIncome[index] / maxValue) * chartHeight;
                    const billsHeight = (monthlyBills[index] / maxValue) * chartHeight;
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex items-end justify-center gap-1" style={{ height: `${chartHeight}px` }}>
                          <div
                            className="w-1/2 bg-blue-500 rounded-t"
                            style={{ height: `${incomeHeight}px` }}
                            title={`Income: $${monthlyIncome[index]}`}
                          />
                          <div
                            className="w-1/2 bg-red-500 rounded-t"
                            style={{ height: `${billsHeight}px` }}
                            title={`Bills: $${monthlyBills[index]}`}
                          />
                        </div>
                        <span className="text-xs text-gray-600 mt-2">{month}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-center gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span className="text-xs text-gray-600">Income</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span className="text-xs text-gray-600">Bills</span>
                  </div>
                </div>
              </div>

              {/* Distribution of Expenses */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Distribution of Expenses</h3>
                {metrics.payrollExpenses + metrics.operatingExpenses + metrics.materialExpenses === 0 ? (
                  <div className="h-[200px] flex items-center justify-center">
                    <p className="text-gray-500 text-sm">No spending data</p>
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center">
                    <div className="relative w-32 h-32">
                      <svg className="transform -rotate-90" width="128" height="128">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="16"
                        />
                        {metrics.payrollExpenses > 0 && (
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            fill="none"
                            stroke="#9333ea"
                            strokeWidth="16"
                            strokeDasharray={`${(metrics.payrollExpenses / (metrics.payrollExpenses + metrics.operatingExpenses + metrics.materialExpenses)) * 352} 352`}
                          />
                        )}
                        {metrics.operatingExpenses > 0 && (
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="16"
                            strokeDasharray={`${(metrics.operatingExpenses / (metrics.payrollExpenses + metrics.operatingExpenses + metrics.materialExpenses)) * 352} 352`}
                            strokeDashoffset={-(metrics.payrollExpenses / (metrics.payrollExpenses + metrics.operatingExpenses + metrics.materialExpenses)) * 352}
                          />
                        )}
                        {metrics.materialExpenses > 0 && (
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            fill="none"
                            stroke="#f97316"
                            strokeWidth="16"
                            strokeDasharray={`${(metrics.materialExpenses / (metrics.payrollExpenses + metrics.operatingExpenses + metrics.materialExpenses)) * 352} 352`}
                            strokeDashoffset={-((metrics.payrollExpenses + metrics.operatingExpenses) / (metrics.payrollExpenses + metrics.operatingExpenses + metrics.materialExpenses)) * 352}
                          />
                        )}
                      </svg>
                    </div>
                  </div>
                )}
                <div className="flex justify-center gap-4 mt-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded"></div>
                    <span className="text-xs text-gray-600">Payroll</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span className="text-xs text-gray-600">Operating</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded"></div>
                    <span className="text-xs text-gray-600">Materials</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Comparison and Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Project Comparison */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Project Comparison</h3>
                {projectComparisonData.length === 0 ? (
                  <div className="h-[200px] flex items-center justify-center">
                    <p className="text-gray-500 text-sm">No projects</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {projectComparisonData.map((project, index) => {
                      const incomeWidth = (project.income / maxProjectValue) * 100;
                      const revenueWidth = (project.revenue / maxProjectValue) * 100;
                      return (
                        <div key={index}>
                          <p className="text-sm font-medium text-gray-900 mb-2">{project.name}</p>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="w-16 text-xs text-gray-600">Income:</div>
                              <div className="flex-1 bg-gray-200 rounded h-4 relative">
                                <div
                                  className="bg-blue-500 h-4 rounded"
                                  style={{ width: `${incomeWidth}%` }}
                                />
                              </div>
                              <div className="w-16 text-xs text-gray-900 text-right">${project.income.toLocaleString()}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-16 text-xs text-gray-600">Revenue:</div>
                              <div className="flex-1 bg-gray-200 rounded h-4 relative">
                                <div
                                  className="bg-green-500 h-4 rounded"
                                  style={{ width: `${revenueWidth}%` }}
                                />
                              </div>
                              <div className="w-16 text-xs text-gray-900 text-right">${project.revenue.toLocaleString()}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex justify-center gap-4 mt-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded"></div>
                        <span className="text-xs text-gray-600">Income</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded"></div>
                        <span className="text-xs text-gray-600">Bills</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                        <span className="text-xs text-gray-600">Revenue</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Project Status */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Project Status</h3>
                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-32 h-32">
                    <svg className="transform -rotate-90" width="128" height="128">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="16"
                      />
                      {profitableProjects > 0 && (
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="16"
                          strokeDasharray={`${(profitableProjects / projects.length) * 352} 352`}
                        />
                      )}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-2xl font-semibold text-gray-900">{profitableProjects}</p>
                        <p className="text-xs text-gray-600">Profitable</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Revenue:</span>
                    <span className="font-medium text-gray-900">$ {metrics.totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Expenses:</span>
                    <span className="font-medium text-red-600">${metrics.payrollExpenses + metrics.operatingExpenses + metrics.materialExpenses}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold pt-2 border-t border-gray-200">
                    <span className="text-gray-900">Total Profit:</span>
                    <span className="text-green-600">${metrics.netProfit.toLocaleString()}</span>
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <span className="font-medium">Rentables: {profitableProjects}</span>
                </div>
              </div>
            </div>

            {/* Employee Distribution by Project */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <PayrollIcon />
                Employee Distribution by Project
              </h3>
              {expenses.filter(e => e.type === 'payroll' && e.employeeId).length === 0 ? (
                <div className="h-[200px] flex items-center justify-center">
                  <p className="text-gray-500 text-sm">There are no employees assigned to projects</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {projects.map(project => {
                    const projectExpenses = expenses.filter(e => {
                      const expenseProjectId = typeof e.projectId === 'object' ? e.projectId?._id : e.projectId;
                      return expenseProjectId === project._id && e.type === 'payroll' && e.employeeId;
                    });
                    if (projectExpenses.length === 0) return null;
                    
                    const employeeIds = projectExpenses
                      .map(e => (typeof e.employeeId === 'object' ? e.employeeId?._id : e.employeeId))
                      .filter(Boolean) as string[];
                    const employeeCount = new Set(employeeIds).size;
                    return (
                      <div key={project._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-900">{project.name}</span>
                        <span className="text-sm text-gray-600">{employeeCount} employee{employeeCount !== 1 ? 's' : ''}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          </>
        )}

        {/* Projects Tab Content */}
        {activeTab === 'projects' && (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Projects</h2>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowPayrollModal(true)}
                className="p-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md transition-all duration-200"
                title="Add Payroll"
              >
                <PayrollIcon />
              </button>
              <button
                onClick={() => setShowOperatingModal(true)}
                className="p-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-all duration-200"
                title="Add Operating Expense"
              >
                <OperatingIcon />
              </button>
              <button
                onClick={() => setShowMaterialModal(true)}
                className="p-2.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-md transition-all duration-200"
                title="Add Material"
              >
                <MaterialIcon />
              </button>
              <button
                onClick={() => {
                  setSelectedProject(null);
                  setShowProjectModal(true);
                }}
                className="px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-md transition-all duration-200 font-medium text-sm shadow-sm hover:shadow flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Project
              </button>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-gray-100 mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500 text-base font-medium">
                No projects yet. Create your first project to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Project</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Gross Income</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Labor</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Operation</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Materials</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Total Expenses</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Admin (5%)</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Net Profit</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Department</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => {
                    // Calculate project expenses by type
                    const projectExpenses = expenses.filter(e => {
                      const expenseProjectId = typeof e.projectId === 'object' ? e.projectId?._id : e.projectId;
                      return expenseProjectId === project._id;
                    });
                    const laborExpenses = projectExpenses
                      .filter(e => e.type === 'payroll')
                      .reduce((sum, e) => sum + e.amount, 0);
                    const operationExpenses = projectExpenses
                      .filter(e => e.type === 'operating')
                      .reduce((sum, e) => sum + e.amount, 0);
                    const materialExpenses = projectExpenses
                      .filter(e => e.type === 'material')
                      .reduce((sum, e) => sum + (e.amount - (e.returnAmount || 0)), 0);
                    
                    const totalExpenses = laborExpenses + operationExpenses + materialExpenses;
                    const adminFee = totalExpenses * 0.05; // 5% admin fee
                    const netProfit = project.grossIncome - totalExpenses - adminFee;

                    return (
                      <tr key={project._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4 text-sm font-medium text-gray-900">{project.name}</td>
                        <td className="py-4 px-4 text-sm text-gray-700">${project.grossIncome.toLocaleString()}</td>
                        <td className="py-4 px-4 text-sm text-gray-600">${laborExpenses.toLocaleString()}</td>
                        <td className="py-4 px-4 text-sm text-gray-600">${operationExpenses.toLocaleString()}</td>
                        <td className="py-4 px-4 text-sm text-gray-600">${materialExpenses.toLocaleString()}</td>
                        <td className="py-4 px-4 text-sm text-gray-700 font-medium">${totalExpenses.toLocaleString()}</td>
                        <td className="py-4 px-4 text-sm text-gray-600">${adminFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className={`py-4 px-4 text-sm font-semibold ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          ${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-700">
                          <div className="flex flex-col gap-1">
                            {(() => {
                              // Check if profit sharing is enabled
                              const isEnabled = Boolean(project.profitSharingEnabled);
                              const profitShares = project.profitShares;
                              
                              // Check if we have valid profit shares
                              const hasShares = profitShares && 
                                                Array.isArray(profitShares) && 
                                                profitShares.length > 0;
                              
                              if (isEnabled && hasShares) {
                                return profitShares.map((share: any, idx: number) => {
                                  if (!share || typeof share !== 'object') return null;
                                  const percentage = Number(share.percentage) || 0;
                                  const shareAmount = (netProfit * percentage) / 100;
                                  const partnerName = (share.name && String(share.name).trim()) || `Partner ${idx + 1}`;
                                  return (
                                    <span key={idx} className="text-xs">
                                      {partnerName}: ${shareAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                  );
                                }).filter(Boolean);
                              }
                              return <span className="text-gray-400">No sharing</span>;
                            })()}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedProject(project);
                                setShowViewModal(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedProject(project);
                                setShowProjectModal(true);
                              }}
                              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
                                  try {
                                    await projectAPI.delete(project._id);
                                    loadData();
                                  } catch (error) {
                                    console.error('Failed to delete project:', error);
                                    alert('Failed to delete project. Please try again.');
                                  }
                                }
                              }}
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          </div>
        )}
      </main>

      {/* Modals */}
      {showProjectModal && (
        <ProjectModal
          project={selectedProject}
          onClose={() => {
            setShowProjectModal(false);
            setSelectedProject(null);
          }}
          onSuccess={() => {
            setShowProjectModal(false);
            setSelectedProject(null);
            loadData();
          }}
        />
      )}
      {showViewModal && selectedProject && (
        <ViewProjectModal
          project={selectedProject}
          expenses={expenses}
          onClose={() => {
            setShowViewModal(false);
            setSelectedProject(null);
          }}
        />
      )}
      {showPayrollModal && (
        <PayrollModal
          onClose={() => setShowPayrollModal(false)}
          onSuccess={() => {
            setShowPayrollModal(false);
            loadData();
          }}
        />
      )}
      {showOperatingModal && (
        <OperatingModal
          onClose={() => setShowOperatingModal(false)}
          onSuccess={() => {
            setShowOperatingModal(false);
            loadData();
          }}
        />
      )}
      {showMaterialModal && (
        <MaterialModal
          onClose={() => setShowMaterialModal(false)}
          onSuccess={() => {
            setShowMaterialModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

