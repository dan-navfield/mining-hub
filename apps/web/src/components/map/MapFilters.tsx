'use client';

import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

interface MapFilters {
  jurisdictions: string[];
  types: string[];
  statuses: string[];
  holders: string[];
  search: string;
}

interface FilterOptions {
  jurisdictions: string[];
  types: string[];
  statuses: string[];
  holders: string[];
}

interface MapFiltersProps {
  filters: MapFilters;
  onFiltersChange: (filters: MapFilters) => void;
  onClose: () => void;
  tenements: any[];
}

export default function MapFiltersComponent({ filters, onFiltersChange, onClose, tenements }: MapFiltersProps) {
  const [expandedSections, setExpandedSections] = useState({
    jurisdictions: true,
    statuses: true,
    types: false,
    holders: false
  });

  // Extract unique options from tenements
  const [options, setOptions] = useState<FilterOptions>({
    jurisdictions: [],
    types: [],
    statuses: [],
    holders: []
  });

  useEffect(() => {
    if (tenements.length > 0) {
      const uniqueJurisdictions = [...new Set(tenements.map(t => t.jurisdiction))].sort();
      const uniqueTypes = [...new Set(tenements.map(t => t.type))].sort();
      const uniqueStatuses = [...new Set(tenements.map(t => t.status))].sort();
      const uniqueHolders = [...new Set(tenements.map(t => t.holder_name))]
        .filter(h => h && h.length > 0)
        .sort();

      setOptions({
        jurisdictions: uniqueJurisdictions,
        types: uniqueTypes,
        statuses: uniqueStatuses,
        holders: uniqueHolders.slice(0, 50) // Limit to top 50 holders for performance
      });
    }
  }, [tenements]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleFilterChange = (filterType: keyof MapFilters, value: string, checked: boolean) => {
    const currentValues = filters[filterType] as string[];
    let newValues: string[];

    if (checked) {
      newValues = [...currentValues, value];
    } else {
      newValues = currentValues.filter(v => v !== value);
    }

    onFiltersChange({
      ...filters,
      [filterType]: newValues
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      jurisdictions: [],
      types: [],
      statuses: ['live', 'pending'], // Keep default active statuses
      holders: [],
      search: ''
    });
  };

  const getFilterCount = () => {
    return filters.jurisdictions.length + 
           filters.types.length + 
           filters.statuses.length + 
           filters.holders.length +
           (filters.search ? 1 : 0);
  };

  const FilterSection = ({ 
    title, 
    filterKey, 
    options: sectionOptions, 
    expanded, 
    onToggle 
  }: {
    title: string;
    filterKey: keyof MapFilters;
    options: string[];
    expanded: boolean;
    onToggle: () => void;
  }) => {
    const currentValues = filters[filterKey] as string[];
    const allSelected = currentValues.length === sectionOptions.length;
    const noneSelected = currentValues.length === 0;

    const handleSelectAll = () => {
      onFiltersChange({
        ...filters,
        [filterKey]: allSelected ? [] : sectionOptions
      });
    };

    return (
      <div className="border-b border-gray-200 last:border-b-0">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between py-3 px-1 text-left hover:bg-gray-50"
        >
          <span className="font-medium text-gray-900">{title}</span>
          <div className="flex items-center space-x-2">
            {currentValues.length > 0 && (
              <span className="bg-emerald-100 text-emerald-800 text-xs font-medium px-2 py-1 rounded-full">
                {currentValues.length}
              </span>
            )}
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </button>
        
        {expanded && (
          <div className="pb-3 pl-1 max-h-48 overflow-y-auto">
            {/* Select All/None controls for jurisdictions */}
            {filterKey === 'jurisdictions' && (
              <div className="mb-3 pb-2 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSelectAll}
                    className={`text-xs font-medium px-2 py-1 rounded transition-colors ${
                      allSelected 
                        ? 'bg-gray-100 text-gray-600' 
                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    }`}
                  >
                    {allSelected ? 'Deselect All' : 'Select All'}
                  </button>
                  <span className="text-xs text-gray-500">
                    {currentValues.length} of {sectionOptions.length} selected
                  </span>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              {sectionOptions.map(option => {
                const count = tenements.filter(t => {
                  const field = filterKey === 'jurisdictions' ? 'jurisdiction' : 
                               filterKey === 'statuses' ? 'status' :
                               filterKey === 'types' ? 'type' : 'holder_name';
                  return t[field] === option;
                }).length;

                return (
                  <label key={option} className="flex items-center space-x-2 text-sm hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={currentValues.includes(option)}
                      onChange={(e) => handleFilterChange(filterKey, option, e.target.checked)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0"
                    />
                    <span className="text-gray-700 truncate flex-1">{option}</span>
                    <span className="text-gray-400 text-xs">
                      ({count.toLocaleString()})
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 w-80 max-h-96 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-gray-900">Filters</h3>
          {getFilterCount() > 0 && (
            <span className="bg-emerald-100 text-emerald-800 text-xs font-medium px-2 py-1 rounded-full">
              {getFilterCount()}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {getFilterCount() > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Clear all
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Jurisdictions */}
        <FilterSection
          title="Jurisdictions"
          filterKey="jurisdictions"
          options={options.jurisdictions}
          expanded={expandedSections.jurisdictions}
          onToggle={() => toggleSection('jurisdictions')}
        />

        {/* Status */}
        <FilterSection
          title="Status"
          filterKey="statuses"
          options={options.statuses}
          expanded={expandedSections.statuses}
          onToggle={() => toggleSection('statuses')}
        />

        {/* Types */}
        <FilterSection
          title="Tenement Types"
          filterKey="types"
          options={options.types}
          expanded={expandedSections.types}
          onToggle={() => toggleSection('types')}
        />

        {/* Holders */}
        <FilterSection
          title="Holders"
          filterKey="holders"
          options={options.holders}
          expanded={expandedSections.holders}
          onToggle={() => toggleSection('holders')}
        />
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <div className="text-sm text-gray-600">
          Showing {tenements.filter(t => {
            // Apply current filters to get count
            let matches = true;
            
            if (filters.jurisdictions.length > 0) {
              matches = matches && filters.jurisdictions.includes(t.jurisdiction);
            }
            if (filters.statuses.length > 0) {
              matches = matches && filters.statuses.includes(t.status);
            }
            if (filters.types.length > 0) {
              matches = matches && filters.types.some(type => 
                t.type.toLowerCase().includes(type.toLowerCase())
              );
            }
            if (filters.holders.length > 0) {
              matches = matches && filters.holders.some(holder =>
                t.holder_name.toLowerCase().includes(holder.toLowerCase())
              );
            }
            if (filters.search) {
              const search = filters.search.toLowerCase();
              matches = matches && (
                t.number.toLowerCase().includes(search) ||
                t.holder_name.toLowerCase().includes(search) ||
                t.type.toLowerCase().includes(search)
              );
            }
            
            return matches;
          }).length} of {tenements.length} tenements
        </div>
      </div>
    </div>
  );
}
