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
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [showOperatingModal, setShowOperatingModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);

  useEffect(() => {
    const userStr = Cookies.get('user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userStr));
    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      const [projectsRes, expensesRes] = await Promise.all([
        projectAPI.getAll(),
        expenseAPI.getAll(),
      ]);
      setProjects(projectsRes.data);
      setExpenses(expensesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

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

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-effect sticky top-0 z-40 border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0">
                <Image
                  src="/logo.jpg"
                  alt="Logo"
                  fill
                  className="object-contain rounded-lg"
                  priority
                />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3">
                  <span>Earnings Management</span>
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2">
                  Manage your projects, expenses, and profit distribution among partners.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 bg-white rounded-full border border-gray-200">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs sm:text-sm font-medium text-gray-700 truncate max-w-[150px] sm:max-w-none">{user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 sm:px-5 py-2 sm:py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg sm:rounded-xl transition-all duration-200 flex items-center gap-1 sm:gap-2 text-gray-700 font-medium text-sm sm:text-base shadow-sm hover:shadow-md"
              >
                Logout <span className="text-base sm:text-lg">→</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <ActionButton
            label="View Detailed Payroll"
            icon="👥"
            color="purple"
            onClick={() => router.push('/roster')}
          />
          <ActionButton
            label="View Operating Expenses"
            icon="🔧"
            color="blue"
            onClick={() => router.push('/operating-expenses')}
          />
          <ActionButton
            label="View Materials"
            icon="📦"
            color="orange"
            onClick={() => router.push('/materials')}
          />
        </div>

        {/* Year-End Export */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 mb-6 sm:mb-8 border border-green-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <span>📥</span>
                Year-End Data Export
              </h3>
              <p className="text-sm text-gray-600">
                Download all your data (projects, expenses, employees) for backup and review.
              </p>
            </div>
            <button
              onClick={handleYearEndExport}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all font-semibold text-sm sm:text-base shadow-sm hover:shadow-md"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <MetricCard
            title="Total Revenue"
            value={`$${metrics.totalRevenue.toLocaleString()}`}
            icon="💰"
            color="blue"
          />
          <MetricCard
            title="Net Profit"
            value={`$${metrics.netProfit.toLocaleString()}`}
            icon="📊"
            color="green"
          />
          <MetricCard
            title="Profit Margin"
            value={`${metrics.profitMargin.toFixed(1)}%`}
            icon="📈"
            color="red"
          />
        </div>

        {/* Expense Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <MetricCard
            title="Payroll Expenses"
            value={`$${metrics.payrollExpenses.toLocaleString()}`}
            icon="👥"
            color="purple"
          />
          <MetricCard
            title="Operating Expenses"
            value={`$${metrics.operatingExpenses.toLocaleString()}`}
            icon="🔧"
            color="blue"
          />
          <MetricCard
            title="Material Expenses"
            value={`$${metrics.materialExpenses.toLocaleString()}`}
            icon="📦"
            color="orange"
          />
        </div>

        {/* Projects Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Projects</h2>
            <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={() => setShowPayrollModal(true)}
                className="p-2 sm:p-3 bg-purple-100 hover:bg-purple-200 rounded-lg transition-all duration-200"
                title="Add Payroll"
              >
                <span className="text-purple-600 text-base sm:text-lg">👥 +</span>
              </button>
              <button
                onClick={() => setShowOperatingModal(true)}
                className="p-2 sm:p-3 bg-blue-100 hover:bg-blue-200 rounded-lg transition-all duration-200"
                title="Add Operating Expense"
              >
                <span className="text-blue-600 text-base sm:text-lg">🔧 +</span>
              </button>
              <button
                onClick={() => setShowMaterialModal(true)}
                className="p-2 sm:p-3 bg-orange-100 hover:bg-orange-200 rounded-lg transition-all duration-200"
                title="Add Material"
              >
                <span className="text-orange-600 text-base sm:text-lg">📦 +</span>
              </button>
              <button
                onClick={() => {
                  setSelectedProject(null);
                  setShowProjectModal(true);
                }}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 font-semibold text-sm sm:text-base shadow-sm hover:shadow-md"
              >
                + New Project
              </button>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 mb-4">
                <span className="text-4xl">📁</span>
              </div>
              <p className="text-slate-500 text-lg font-medium">
                No projects yet. Create your first project to get started!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Project</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Gross Income</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      <span className="flex items-center gap-1">
                        <span>👥</span> Labor
                      </span>
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      <span className="flex items-center gap-1">
                        <span>🔧</span> Operation
                      </span>
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      <span className="flex items-center gap-1">
                        <span>📦</span> Materials
                      </span>
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Total Expenses</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Admin (5%)</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Net Profit</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Department</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
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
                        <td className="py-4 px-4 text-sm text-gray-700">${laborExpenses.toLocaleString()}</td>
                        <td className="py-4 px-4 text-sm text-gray-700">${operationExpenses.toLocaleString()}</td>
                        <td className="py-4 px-4 text-sm text-gray-700">${materialExpenses.toLocaleString()}</td>
                        <td className="py-4 px-4 text-sm text-gray-700 font-semibold">${totalExpenses.toLocaleString()}</td>
                        <td className="py-4 px-4 text-sm text-gray-700">${adminFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className={`py-4 px-4 text-sm font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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

