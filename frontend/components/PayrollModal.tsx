'use client';

import { useState, useEffect } from 'react';
import { expenseAPI, projectAPI, userAPI } from '@/lib/api';

interface PayrollModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function PayrollModal({ onClose, onSuccess }: PayrollModalProps) {
  const [formData, setFormData] = useState({
    projectId: '',
    category: '',
    employeeId: '',
    daysWorked: 0,
    advancement: 0,
    weekStart: '',
    weekend: '',
    description: '',
    amount: 0,
  });
  const [projects, setProjects] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
  });
  const [addingEmployee, setAddingEmployee] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projectsRes, employeesRes] = await Promise.all([
        projectAPI.getAll(),
        userAPI.getEmployees(),
      ]);
      setProjects(projectsRes.data);
      setEmployees(employeesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleAddEmployee = async () => {
    if (!newEmployee.name.trim()) {
      setError('Please enter an employee name');
      return;
    }

    setAddingEmployee(true);
    setError('');

    try {
      const response = await userAPI.createEmployee({
        name: newEmployee.name.trim(),
        email: newEmployee.email.trim() || undefined,
        phone: newEmployee.phone.trim() || undefined,
        position: newEmployee.position.trim() || undefined,
      });
      const createdEmployee = response.data;
      
      // Add the new employee to the list
      setEmployees([...employees, createdEmployee]);
      
      // Auto-select the newly created employee
      setFormData({ ...formData, employeeId: createdEmployee._id });
      
      // Reset the form
      setNewEmployee({ name: '', email: '', phone: '', position: '' });
      setShowAddEmployee(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create employee');
    } finally {
      setAddingEmployee(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const expenseData: any = {
        type: 'payroll',
        projectId: formData.projectId,
        category: formData.category,
        description: formData.description,
        amount: formData.amount,
        daysWorked: formData.daysWorked,
        advancement: formData.advancement,
        weekStart: formData.weekStart ? new Date(formData.weekStart) : undefined,
        weekend: formData.weekend ? new Date(formData.weekend) : undefined,
      };

      // Only include employeeId if it's not empty
      if (formData.employeeId && formData.employeeId.trim() !== '') {
        expenseData.employeeId = formData.employeeId;
      }

      await expenseAPI.create(expenseData);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create expense');
    } finally {
      setLoading(false);
    }
  };

  const PayrollIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );

  const CloseIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  const AddUserIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 my-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1 pr-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
                <PayrollIcon />
              </div>
              <span>Add Payroll Expense</span>
            </h2>
            <p className="text-sm text-gray-500">
              Record a new payroll expense with days worked and advances.
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
                Project
              </label>
              <select
                required
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all text-sm"
              >
                <option value="">Select project</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Category
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all text-sm"
              >
                <option value="">Select category</option>
                <option value="Salary">Salary</option>
                <option value="Overtime">Overtime</option>
                <option value="Bonds">Bonds</option>
                <option value="Benefits">Benefits</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Employee (optional)
            </label>
            <div className="flex gap-2">
              <select
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm"
                disabled={showAddEmployee}
              >
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {employee.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  setShowAddEmployee(!showAddEmployee);
                  setNewEmployee({ name: '', email: '', phone: '', position: '' });
                  setError('');
                }}
                className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md transition-colors text-sm"
                title="Add new employee"
              >
                <AddUserIcon />
              </button>
            </div>
            {showAddEmployee && (
              <div className="mt-3 p-4 bg-gray-50 rounded-md border border-gray-200 space-y-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Add New Employee</h4>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                    placeholder="Employee name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm"
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={newEmployee.email}
                      onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                      placeholder="email@example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={newEmployee.phone}
                      onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                      placeholder="Phone number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Position</label>
                  <input
                    type="text"
                    value={newEmployee.position}
                    onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
                    placeholder="Job title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleAddEmployee}
                    disabled={addingEmployee || !newEmployee.name.trim()}
                    className="flex-1 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                  >
                    {addingEmployee ? 'Adding...' : 'Add Employee'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddEmployee(false);
                      setNewEmployee({ name: '', email: '', phone: '', position: '' });
                      setError('');
                    }}
                    className="px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors font-medium text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Days Worked
              </label>
              <input
                type="number"
                min="0"
                value={formData.daysWorked}
                onChange={(e) =>
                  setFormData({ ...formData, daysWorked: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Advancement
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.advancement}
                onChange={(e) =>
                  setFormData({ ...formData, advancement: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Week Start
              </label>
              <input
                type="date"
                value={formData.weekStart}
                onChange={(e) => setFormData({ ...formData, weekStart: e.target.value })}
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Weekend
              </label>
              <input
                type="date"
                value={formData.weekend}
                onChange={(e) => setFormData({ ...formData, weekend: e.target.value })}
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all text-sm"
              rows={3}
              placeholder="Enter expense description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Amount
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
              }
              className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all text-sm"
            />
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
              {loading ? 'Adding...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

