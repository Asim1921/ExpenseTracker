'use client';

import { useState, useEffect } from 'react';
import { projectAPI } from '@/lib/api';

interface ProjectModalProps {
  onClose: () => void;
  onSuccess: () => void;
  project?: {
    _id: string;
    name: string;
    grossIncome: number;
    profitSharingEnabled?: boolean;
    profitSharingType?: string;
    profitShares?: Array<{ name: string; percentage: number }>;
  } | null;
}

export default function ProjectModal({ onClose, onSuccess, project }: ProjectModalProps) {
  const isEditMode = !!project;
  
  const [formData, setFormData] = useState({
    name: project?.name || '',
    grossIncome: project?.grossIncome || 0,
    profitSharingEnabled: project?.profitSharingEnabled || false,
    profitSharingType: (project?.profitSharingType || 'none') as 'none' | 'two-way' | 'three-way' | 'custom',
    profitShares: project?.profitShares || [] as Array<{ name: string; percentage: number }>,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Update form data when project changes
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        grossIncome: project.grossIncome || 0,
        profitSharingEnabled: project.profitSharingEnabled || false,
        profitSharingType: (project.profitSharingType || 'none') as 'none' | 'two-way' | 'three-way' | 'custom',
        profitShares: project.profitShares || [],
      });
    } else {
      setFormData({
        name: '',
        grossIncome: 0,
        profitSharingEnabled: false,
        profitSharingType: 'none',
        profitShares: [],
      });
    }
  }, [project]);

  const handleProfitSharingTypeChange = (type: 'none' | 'two-way' | 'three-way' | 'custom') => {
    let shares: Array<{ name: string; percentage: number }> = [];
    
    if (type === 'two-way') {
      shares = [
        { name: 'Partner 1', percentage: 50 },
        { name: 'Partner 2', percentage: 50 },
      ];
    } else if (type === 'three-way') {
      shares = [
        { name: 'Partner 1', percentage: 33.33 },
        { name: 'Partner 2', percentage: 33.33 },
        { name: 'Partner 3', percentage: 33.34 },
      ];
    }
    
    setFormData({
      ...formData,
      profitSharingType: type,
      profitShares: shares,
      profitSharingEnabled: type !== 'none',
    });
  };

  const updateProfitShare = (index: number, field: 'name' | 'percentage', value: string | number) => {
    const newShares = [...formData.profitShares];
    newShares[index] = { ...newShares[index], [field]: value };
    setFormData({ ...formData, profitShares: newShares });
  };

  const addProfitShare = () => {
    setFormData({
      ...formData,
      profitShares: [...formData.profitShares, { name: '', percentage: 0 }],
    });
  };

  const removeProfitShare = (index: number) => {
    setFormData({
      ...formData,
      profitShares: formData.profitShares.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate profit shares sum to 100%
    if (formData.profitSharingEnabled && formData.profitSharingType !== 'none') {
      // Validate that all partner names are filled
      const emptyNames = formData.profitShares.filter(share => !share.name || share.name.trim() === '');
      if (emptyNames.length > 0) {
        setError('Please enter names for all partners');
        return;
      }
      
      const totalPercentage = formData.profitShares.reduce((sum, share) => sum + share.percentage, 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        setError(`Profit shares must total 100%. Current total: ${totalPercentage.toFixed(2)}%`);
        return;
      }
    }
    
    setLoading(true);

    try {
      const submitData: any = {
        name: formData.name,
        grossIncome: formData.grossIncome,
        profitSharingEnabled: formData.profitSharingEnabled,
        profitSharingType: formData.profitSharingType,
      };
      
      // Always include profitShares if profit sharing is enabled
      if (formData.profitSharingEnabled && formData.profitSharingType !== 'none') {
        submitData.profitShares = formData.profitShares || [];
      } else {
        // Clear profit shares if disabled
        submitData.profitShares = [];
        submitData.profitSharingEnabled = false;
        submitData.profitSharingType = 'none';
      }
      
      if (isEditMode && project) {
        await projectAPI.update(project._id, submitData);
      } else {
        await projectAPI.create(submitData);
      }
      onSuccess();
    } catch (err: any) {
      console.error('Error saving project:', err);
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 my-4">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1 pr-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                <ProjectIcon />
              </div>
              <span>{isEditMode ? 'Edit Project' : 'Create New Project'}</span>
            </h2>
            <p className="text-sm text-gray-500">
              {isEditMode 
                ? 'Update the project details below.'
                : 'Enter the details of the new project to start managing your expenses and earnings.'}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Project Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all text-sm"
              placeholder="Enter project name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Gross Income
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.grossIncome}
              onChange={(e) =>
                setFormData({ ...formData, grossIncome: parseFloat(e.target.value) || 0 })
              }
              className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all text-sm"
            />
          </div>

          {/* Profit Sharing Configuration */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="profitSharingEnabled"
                checked={formData.profitSharingEnabled}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  setFormData({
                    ...formData,
                    profitSharingEnabled: enabled,
                    profitSharingType: enabled ? formData.profitSharingType : 'none',
                  });
                  if (enabled && formData.profitSharingType === 'none') {
                    handleProfitSharingTypeChange('two-way');
                  }
                }}
                className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
              />
              <label htmlFor="profitSharingEnabled" className="text-sm font-medium text-gray-700">
                Enable Profit Sharing
              </label>
            </div>

            {formData.profitSharingEnabled && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Profit Sharing Type
                  </label>
                  <select
                    value={formData.profitSharingType}
                    onChange={(e) => handleProfitSharingTypeChange(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all text-sm"
                  >
                    <option value="none">No Sharing</option>
                    <option value="two-way">50/50 Split</option>
                    <option value="three-way">Three-Way Split (33.33% each)</option>
                    <option value="custom">Custom Distribution</option>
                  </select>
                </div>

                {formData.profitSharingType !== 'none' && formData.profitShares.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Profit Distribution
                    </label>
                    <div className="space-y-2">
                      {formData.profitShares.map((share, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <input
                            type="text"
                            required={formData.profitSharingEnabled}
                            placeholder="Partner name"
                            value={share.name}
                            onChange={(e) => updateProfitShare(index, 'name', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm"
                          />
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            placeholder="%"
                            value={share.percentage}
                            onChange={(e) => updateProfitShare(index, 'percentage', parseFloat(e.target.value) || 0)}
                            className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm"
                          />
                          <span className="text-sm text-gray-600">%</span>
                          {formData.profitSharingType === 'custom' && (
                            <button
                              type="button"
                              onClick={() => removeProfitShare(index)}
                              className="px-2 py-1 text-red-600 hover:bg-red-50 rounded-md text-sm"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      {formData.profitSharingType === 'custom' && (
                        <button
                          type="button"
                          onClick={addProfitShare}
                          className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-md text-gray-600 hover:border-gray-900 hover:text-gray-900 text-sm"
                        >
                          + Add Partner
                        </button>
                      )}
                      <div className="text-xs text-gray-500 mt-2">
                        Total: {formData.profitShares.reduce((sum, s) => sum + s.percentage, 0).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 border border-gray-300 rounded-md hover:bg-gray-50 transition-all font-medium text-gray-700 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-md transition-all disabled:opacity-50 font-medium text-sm shadow-sm hover:shadow"
            >
              {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Project' : 'Create Project')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

