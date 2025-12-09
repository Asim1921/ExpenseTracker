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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 my-4 sm:my-8 animate-slide-up">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1 pr-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
              {isEditMode ? 'Edit Project' : 'Create New Project'}
            </h2>
            <p className="text-sm text-gray-600">
              {isEditMode 
                ? 'Update the project details below.'
                : 'Enter the details of the new project to start managing your expenses and earnings.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl sm:text-3xl hover:bg-gray-100 rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center transition-colors flex-shrink-0"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
            <p className="font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Example: Construction of the Main Building"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          {/* Profit Sharing Configuration */}
          <div className="border-t pt-4 mt-4">
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
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="profitSharingEnabled" className="text-sm font-medium text-gray-700">
                Enable Profit Sharing
              </label>
            </div>

            {formData.profitSharingEnabled && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profit Sharing Type
                  </label>
                  <select
                    value={formData.profitSharingType}
                    onChange={(e) => handleProfitSharingTypeChange(e.target.value as any)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="none">No Sharing</option>
                    <option value="two-way">50/50 Split</option>
                    <option value="three-way">Three-Way Split (33.33% each)</option>
                    <option value="custom">Custom Distribution</option>
                  </select>
                </div>

                {formData.profitSharingType !== 'none' && formData.profitShares.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          />
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            placeholder="%"
                            value={share.percentage}
                            onChange={(e) => updateProfitShare(index, 'percentage', parseFloat(e.target.value) || 0)}
                            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          />
                          <span className="text-sm text-gray-600">%</span>
                          {formData.profitSharingType === 'custom' && (
                            <button
                              type="button"
                              onClick={() => removeProfitShare(index)}
                              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
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
                          className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 text-sm"
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

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all disabled:opacity-50 font-semibold shadow-sm hover:shadow-md"
            >
              {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Project' : 'Create Project')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

