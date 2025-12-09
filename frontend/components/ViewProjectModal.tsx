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

  const ProjectIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );

  const CloseIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  const PayrollIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );

  const OperatingIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  const MaterialIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6 my-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1 pr-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                <ProjectIcon />
              </div>
              <span>Project Details</span>
            </h2>
            <p className="text-sm text-gray-500">
              View complete information about this project
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md w-8 h-8 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="space-y-5">
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Project Name</label>
                <p className="text-sm font-medium text-gray-900">{project.name}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Gross Income</label>
                <p className="text-sm font-semibold text-blue-700">${project.grossIncome.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Financial Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                  <PayrollIcon />
                  Labor Expenses
                </label>
                <p className="text-sm font-medium text-gray-900">${laborExpenses.toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                  <OperatingIcon />
                  Operating Expenses
                </label>
                <p className="text-sm font-medium text-gray-900">${operationExpenses.toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                  <MaterialIcon />
                  Material Expenses
                </label>
                <p className="text-sm font-medium text-gray-900">${materialExpenses.toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Expenses</label>
                <p className="text-sm font-medium text-gray-900">${totalExpenses.toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Admin Fee (5%)</label>
                <p className="text-sm font-medium text-gray-900">${adminFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Net Profit</label>
                <p className={`text-sm font-semibold ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  ${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Profit Sharing */}
          {project.profitSharingEnabled && project.profitShares && project.profitShares.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Profit Sharing</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Distribution Type</label>
                  <p className="text-sm text-gray-900 capitalize">{project.profitSharingType?.replace('-', ' ')}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Partners</label>
                  <div className="space-y-2">
                    {project.profitShares.map((share, idx) => {
                      const shareAmount = (netProfit * share.percentage) / 100;
                      return (
                        <div key={idx} className="flex justify-between items-center p-3 bg-white rounded-md border border-gray-200">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{share.name}</p>
                            <p className="text-xs text-gray-600">{share.percentage}%</p>
                          </div>
                          <p className="text-sm font-semibold text-blue-700">
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
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Expenses ({projectExpenses.length})</h3>
            {projectExpenses.length === 0 ? (
              <p className="text-gray-500 text-center py-4 text-sm">No expenses recorded for this project yet.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {projectExpenses.map((expense) => (
                  <div key={expense._id} className="p-3 bg-white rounded-md border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 capitalize">{expense.type}</p>
                        {expense.category && (
                          <p className="text-xs text-gray-600 mt-0.5">Category: {expense.category}</p>
                        )}
                        {expense.description && (
                          <p className="text-xs text-gray-500 mt-1">{expense.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          ${expense.type === 'material' 
                            ? (expense.amount - (expense.returnAmount || 0)).toLocaleString()
                            : expense.amount.toLocaleString()}
                        </p>
                        {expense.type === 'material' && expense.returnAmount && expense.returnAmount > 0 && (
                          <p className="text-xs text-green-700 mt-0.5">Return: ${expense.returnAmount.toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-5 mt-5 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 rounded-md hover:bg-gray-50 transition-all font-medium text-gray-700 text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

