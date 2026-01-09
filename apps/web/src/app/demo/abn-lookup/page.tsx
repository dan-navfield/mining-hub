'use client';

import React from 'react';
import { ABNLookup } from '@/components/abn-lookup';
import { ABNLookupResult } from '@/lib/services/abn-lookup';

export default function ABNLookupDemoPage() {
  const handleABNSelect = (result: ABNLookupResult) => {
    console.log('Selected ABN:', result);
    // You can handle the selected result here
    // For example, populate a form or save to state
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            ABN Lookup Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Test the Australian Business Number lookup functionality. Search by business name 
            or enter an 11-digit ABN to get business details from the Australian Business Register.
          </p>
        </div>

        {/* Demo Section */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Search for Australian Businesses
          </h2>
          
          <ABNLookup 
            onSelect={handleABNSelect}
            placeholder="Try 'BHP' or '49004028077' (BHP Group Limited)"
            showValidation={true}
          />

          {/* Example Searches */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Example Searches:</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>By Name:</strong> "BHP", "Telstra", "Commonwealth Bank"</p>
              <p><strong>By ABN:</strong> "49004028077" (BHP Group Limited)</p>
              <p><strong>Mining Companies:</strong> "Fortescue", "Rio Tinto", "Newcrest"</p>
              <p><strong>WA Mining:</strong> "Northern Star", "Gold Road", "Sandfire"</p>
            </div>
          </div>

          {/* API Information */}
          <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2">🔗 Official ABN Lookup API</h3>
            <div className="text-sm text-gray-700 space-y-2">
              <p>This implementation uses the official Australian Business Register ABN Lookup web services:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>SearchByABNv202001</strong> - Latest ABN lookup with Worker Entity Fund data</li>
                <li><strong>ABRSearchByNameAdvancedSimpleProtocol2017</strong> - Advanced name search</li>
                <li>Real-time data from the Australian Business Register</li>
                <li>Includes GST status, entity type, and location information</li>
              </ul>
              <p className="text-xs text-gray-500 mt-2">
                📚 Documentation: <a href="https://abr.business.gov.au/Documentation/SampleCodeResources" 
                className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                ABR Sample Code & Resources
                </a>
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-sm font-medium text-green-900 mb-2">✅ Features</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Real-time ABN validation</li>
                <li>• Search by business name or ABN</li>
                <li>• Business status verification</li>
                <li>• GST registration status</li>
                <li>• Location information</li>
              </ul>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h3 className="text-sm font-medium text-amber-900 mb-2">⚙️ Configuration</h3>
              <div className="text-sm text-amber-800 space-y-1">
                <p>Add your ABN Lookup GUID to <code>.env</code>:</p>
                <code className="block bg-amber-100 p-2 rounded mt-2 text-xs">
                  ABN_LOOKUP_GUID=8838d356-4f03-432f-80eb-670608098598
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Integration Example */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Integration Example
          </h2>
          <p className="text-gray-600 mb-4">
            Here's how you can integrate the ABN lookup component into your forms:
          </p>
          
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <pre className="text-sm">
{`import { ABNLookup } from '@/components/abn-lookup';
import { ABNLookupResult } from '@/lib/services/abn-lookup';

function CompanyForm() {
  const handleABNSelect = (result: ABNLookupResult) => {
    // Auto-fill form fields
    setFormData({
      companyName: result.entityName,
      abn: result.abn,
      gstStatus: result.gstStatus,
      // ... other fields
    });
  };

  return (
    <form>
      <ABNLookup 
        onSelect={handleABNSelect}
        placeholder="Search for your company..."
      />
      {/* Other form fields */}
    </form>
  );
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
