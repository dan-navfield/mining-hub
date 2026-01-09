'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewActionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tenement_number: '',
    jurisdiction: 'WA',
    action_name: '',
    action_type: 'custom',
    due_date: '',
    amount: '',
    currency: 'AUD',
    description: '',
    comments: '',
    recurrence_interval: 'none',
    data_source: 'manual'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        amount: formData.amount ? parseFloat(formData.amount) : null,
      };

      const response = await fetch('http://localhost:4000/api/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to create action');
      }

      router.push('/actions');
    } catch (error) {
      console.error('Error creating action:', error);
      alert('Failed to create action. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => router.back()}
              className="text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              ← Back
            </button>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Add New Action 📝
          </h1>
          <p className="text-gray-600">
            Create a new compliance or operational action for a tenement
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tenement Number *
                </label>
                <input
                  type="text"
                  name="tenement_number"
                  value={formData.tenement_number}
                  onChange={handleChange}
                  required
                  placeholder="e.g., M123456, EL789012"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jurisdiction *
                </label>
                <select
                  name="jurisdiction"
                  value={formData.jurisdiction}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="WA">Western Australia</option>
                  <option value="NSW">New South Wales</option>
                  <option value="VIC">Victoria</option>
                  <option value="NT">Northern Territory</option>
                  <option value="QLD">Queensland</option>
                  <option value="TAS">Tasmania</option>
                </select>
              </div>
            </div>

            {/* Action Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action Name *
              </label>
              <input
                type="text"
                name="action_name"
                value={formData.action_name}
                onChange={handleChange}
                required
                placeholder="e.g., Annual Rent Payment, Expenditure Report"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action Type *
                </label>
                <select
                  name="action_type"
                  value={formData.action_type}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="custom">Custom</option>
                  <option value="payment">Payment</option>
                  <option value="renewal">Renewal</option>
                  <option value="reporting">Reporting</option>
                  <option value="compliance">Compliance</option>
                  <option value="shire_rates">Shire Rates</option>
                  <option value="objection">Objection</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date *
                </label>
                <input
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Financial Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (optional)
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="AUD">AUD - Australian Dollar</option>
                  <option value="USD">USD - US Dollar</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Describe the action requirements..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Comments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments/Notes
              </label>
              <textarea
                name="comments"
                value={formData.comments}
                onChange={handleChange}
                rows={2}
                placeholder="Additional notes or comments..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Recurrence */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recurrence
              </label>
              <select
                name="recurrence_interval"
                value={formData.recurrence_interval}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="none">No Recurrence</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
              </select>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Action'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
