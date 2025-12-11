'use client';

import { useState, useEffect } from 'react';
import { estimateAPI } from '@/lib/api';

interface EstimateModalProps {
  estimate?: any;
  onClose: () => void;
  onSuccess: () => void;
}

interface EstimateItem {
  description: string;
  amount: number;
  unitPrice: number;
  total: number;
}

export default function EstimateModal({ estimate, onClose, onSuccess }: EstimateModalProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    projectTitle: '',
    description: '',
    validUntil: '',
    items: [{ description: '', amount: 1, unitPrice: 0, total: 0 }] as EstimateItem[],
    taxRate: 16,
    additionalNotes: '',
    status: 'draft' as 'draft' | 'sent' | 'approved' | 'rejected',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (estimate) {
      const validUntil = estimate.validUntil 
        ? new Date(estimate.validUntil).toISOString().split('T')[0]
        : '';
      setFormData({
        customerName: estimate.customerName || '',
        customerEmail: estimate.customerEmail || '',
        customerPhone: estimate.customerPhone || '',
        projectTitle: estimate.projectTitle || '',
        description: estimate.description || '',
        validUntil,
        items: estimate.items && estimate.items.length > 0 
          ? estimate.items 
          : [{ description: '', amount: 1, unitPrice: 0, total: 0 }],
        taxRate: estimate.taxRate || 16,
        additionalNotes: estimate.additionalNotes || '',
        status: estimate.status || 'draft',
      });
    }
  }, [estimate]);

  const calculateItemTotal = (item: EstimateItem) => {
    return (item.amount || 1) * (item.unitPrice || 0);
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    const taxAmount = (subtotal * formData.taxRate) / 100;
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  const handleItemChange = (index: number, field: keyof EstimateItem, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    newItems[index].total = calculateItemTotal(newItems[index]);
    setFormData({ ...formData, items: newItems });
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', amount: 1, unitPrice: 0, total: 0 }],
    });
  };

  const handleRemoveItem = (index: number) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData({ ...formData, items: newItems });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { subtotal, taxAmount, total } = calculateTotals();
      const estimateData = {
        ...formData,
        items: formData.items.map(item => ({
          description: item.description,
          amount: item.amount,
          unitPrice: item.unitPrice,
          total: calculateItemTotal(item),
        })),
        subtotal,
        taxAmount,
        total,
        validUntil: formData.validUntil ? new Date(formData.validUntil) : undefined,
      };

      if (estimate) {
        await estimateAPI.update(estimate._id, estimateData);
      } else {
        await estimateAPI.create(estimateData);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${estimate ? 'update' : 'create'} estimate`);
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  const DocumentIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  const CloseIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 my-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1 pr-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                <DocumentIcon />
              </div>
              <span>{estimate ? 'Edit Estimate' : 'New Estimate'}</span>
            </h2>
            <p className="text-sm text-gray-500">
              {estimate ? 'Update estimate information' : 'Create a new estimate or quote for your client'}
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-3">CUSTOMER INFORMATION</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all text-sm"
                  placeholder="Name or company"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all text-sm"
                  placeholder="cliente@ejemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Telephone
                </label>
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all text-sm"
                  placeholder="+52 555 123 4567"
                />
              </div>
            </div>
          </div>

          {/* Project Information */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-3">PROJECT INFORMATION</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Project Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.projectTitle}
                  onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all text-sm"
                  placeholder="Example: Kitchen remodeling"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Valid until
                </label>
                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all text-sm"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all text-sm"
                rows={3}
                placeholder="Job overview..."
              />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-semibold text-gray-900">MATCHES</h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-md transition-all font-medium text-sm"
              >
                + Add Item
              </button>
            </div>
            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm"
                      placeholder="Concept description"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min="1"
                      value={item.amount}
                      onChange={(e) => handleItemChange(index, 'amount', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm font-medium text-gray-900">
                      ${item.total.toLocaleString()}
                    </div>
                  </div>
                  <div className="col-span-1">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      disabled={formData.items.length === 1}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-end">
              <div className="w-full sm:w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium text-gray-900">${subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">IVA</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.taxRate}
                      onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                      className="w-16 px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm"
                    />
                    <span className="text-gray-600">%:</span>
                    <span className="font-medium text-gray-900">${taxAmount.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-200">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-blue-600">${total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-3">Additional notes</h3>
            <textarea
              value={formData.additionalNotes}
              onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
              className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all text-sm"
              rows={4}
              placeholder="Terms, conditions, or important notes..."
            />
          </div>

          {/* Status (only for editing) */}
          {estimate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all text-sm"
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          )}

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
              className="w-full sm:w-auto px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-all disabled:opacity-50 font-medium text-sm shadow-sm hover:shadow"
            >
              {loading ? (estimate ? 'Updating...' : 'Creating...') : (estimate ? 'Update Estimate' : 'Create Estimate')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

