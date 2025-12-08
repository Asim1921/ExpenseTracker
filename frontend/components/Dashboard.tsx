'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { projectAPI, expenseAPI } from '@/lib/api';
import MetricCard from './MetricCard';
import ActionButton from './ActionButton';
import ProjectModal from './ProjectModal';
import PayrollModal from './PayrollModal';
import OperatingModal from './OperatingModal';
import MaterialModal from './MaterialModal';

interface Project {
  _id: string;
  name: string;
  grossIncome: number;
}

interface Expense {
  _id: string;
  type: string;
  amount: number;
  returnAmount?: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showProjectModal, setShowProjectModal] = useState(false);
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
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3">
                <span className="text-2xl sm:text-3xl lg:text-4xl">📈</span>
                <span>Earnings Management</span>
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2">
                Manage your projects, expenses, and profit distribution among partners.
              </p>
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
                onClick={() => setShowProjectModal(true)}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projects.map((project) => (
                <div
                  key={project._id}
                  className="p-6 bg-gradient-to-br from-white to-slate-50/50 border border-slate-200/50 rounded-xl hover:shadow-lg transition-all duration-200 hover:-translate-y-1 group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800 text-lg mb-2 group-hover:text-primary-600 transition-colors">
                        {project.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-500">Gross Income:</span>
                        <span className="text-lg font-bold text-primary-600">
                          ${project.grossIncome.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                      <span className="text-2xl">📊</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {showProjectModal && (
        <ProjectModal
          onClose={() => setShowProjectModal(false)}
          onSuccess={() => {
            setShowProjectModal(false);
            loadData();
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

