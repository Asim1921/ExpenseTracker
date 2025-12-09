'use client';

import { expenseAPI } from '@/lib/api';
import { useEffect, useState } from 'react';

interface ViewProjectModalProps {
  onClose: () => void;
  project: {
    _id: string;
    name: string;
    grossIncome: number;
    profitSharingEnabled?: boolean;
    profitSharingType?: string;
    profitShares?: Array<{ name: string; percentage: number }>;
  };
  expenses: Array<{
    _id: string;
    type: string;
    amount: number;
    returnAmount?: number;
    category?: string;
    description?: string;
    projectId?: {
      _id: string;
      name?: string;
    } | string;
  }>;
}

export default function ViewProjectModal({ onClose, project, expenses }: ViewProjectModalProps) {
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 sm:p-8 my-4 sm:my-8 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1 pr-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
              Project Details
            </h2>
            <p className="text-sm text-gray-600">
              View complete information about this project
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl sm:text-3xl hover:bg-gray-100 rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center transition-colors flex-shrink-0"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Project Name</label>
                <p className="text-base font-semibold text-gray-900">{project.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Gross Income</label>
                <p className="text-base font-semibold text-blue-600">${project.grossIncome.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Financial Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center gap-2">
                  <span>👥</span> Labor Expenses
                </label>
                <p className="text-base font-semibold text-gray-900">${laborExpenses.toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center gap-2">
                  <span>🔧</span> Operating Expenses
                </label>
                <p className="text-base font-semibold text-gray-900">${operationExpenses.toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center gap-2">
                  <span>📦</span> Material Expenses
                </label>
                <p className="text-base font-semibold text-gray-900">${materialExpenses.toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Total Expenses</label>
                <p className="text-base font-semibold text-gray-900">${totalExpenses.toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Admin Fee (5%)</label>
                <p className="text-base font-semibold text-gray-900">${adminFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Net Profit</label>
                <p className={`text-base font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Profit Sharing */}
          {project.profitSharingEnabled && project.profitShares && project.profitShares.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Profit Sharing</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Distribution Type</label>
                  <p className="text-base text-gray-900 capitalize">{project.profitSharingType?.replace('-', ' ')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Partners</label>
                  <div className="space-y-2">
                    {project.profitShares.map((share, idx) => {
                      const shareAmount = (netProfit * share.percentage) / 100;
                      return (
                        <div key={idx} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                          <div>
                            <p className="font-semibold text-gray-900">{share.name}</p>
                            <p className="text-sm text-gray-600">{share.percentage}%</p>
                          </div>
                          <p className="text-base font-bold text-blue-600">
                            ${shareAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Expenses List */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Expenses ({projectExpenses.length})</h3>
            {projectExpenses.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No expenses recorded for this project yet.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {projectExpenses.map((expense) => (
                  <div key={expense._id} className="p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 capitalize">{expense.type}</p>
                        {expense.category && (
                          <p className="text-sm text-gray-600">Category: {expense.category}</p>
                        )}
                        {expense.description && (
                          <p className="text-sm text-gray-500 mt-1">{expense.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          ${expense.type === 'material' 
                            ? (expense.amount - (expense.returnAmount || 0)).toLocaleString()
                            : expense.amount.toLocaleString()}
                        </p>
                        {expense.type === 'material' && expense.returnAmount && expense.returnAmount > 0 && (
                          <p className="text-xs text-green-600">Return: ${expense.returnAmount.toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium text-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

