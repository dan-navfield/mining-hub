'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight, Building2, Calendar, DollarSign, AlertTriangle } from 'lucide-react';

interface Action {
  id: string;
  tenement_number: string;
  jurisdiction: string;
  action_name: string;
  action_type: string;
  status: string;
  due_date: string;
  amount?: number;
  description?: string;
  tenements?: {
    id: string;
    number: string;
    holder_name: string;
  };
}

interface HolderGroup {
  holder_name: string;
  actions: Action[];
  totalActions: number;
  totalAmount: number;
  overdueCount: number;
  upcomingCount: number;
}

interface ActionStats {
  total: number;
  by_status: {
    pending: number;
    completed: number;
    overdue: number;
    cancelled: number;
  };
  upcoming_30_days: number;
  total_amount: number;
  overdue_amount: number;
}

export default function ActionsPage() {
  const router = useRouter();
  const [actions, setActions] = useState<Action[]>([]);
  const [holderGroups, setHolderGroups] = useState<HolderGroup[]>([]);
  const [expandedHolders, setExpandedHolders] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<ActionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'overdue'>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadActions();
    loadStats();
  }, [filter]);

  const loadActions = async () => {
    try {
      setLoading(true);
      
      // Generate 50 dummy actions with realistic data
      const mockActions: Action[] = [
        // Northern Star Resources Ltd (10 actions)
        { id: '1', tenement_number: 'M15/1789', jurisdiction: 'WA', action_name: 'Environmental Bond Renewal', action_type: 'renewal', status: 'pending', due_date: '2024-11-25', amount: 50000, description: 'Renew environmental security bond', tenements: { id: '1', number: 'M15/1789', holder_name: 'Northern Star Resources Ltd' }},
        { id: '2', tenement_number: 'M15/1790', jurisdiction: 'WA', action_name: 'Annual Rent Payment', action_type: 'payment', status: 'overdue', due_date: '2024-10-15', amount: 2500, description: 'Annual rent payment for mining lease', tenements: { id: '2', number: 'M15/1790', holder_name: 'Northern Star Resources Ltd' }},
        { id: '3', tenement_number: 'E15/1234', jurisdiction: 'WA', action_name: 'Expenditure Report', action_type: 'reporting', status: 'pending', due_date: '2024-11-30', amount: 0, description: 'Submit annual expenditure report', tenements: { id: '3', number: 'E15/1234', holder_name: 'Northern Star Resources Ltd' }},
        { id: '4', tenement_number: 'M15/1791', jurisdiction: 'WA', action_name: 'Mining Proposal Amendment', action_type: 'compliance', status: 'pending', due_date: '2024-12-10', amount: 0, description: 'Submit mining proposal amendment', tenements: { id: '4', number: 'M15/1791', holder_name: 'Northern Star Resources Ltd' }},
        { id: '5', tenement_number: 'E15/1235', jurisdiction: 'WA', action_name: 'Native Title Clearance', action_type: 'compliance', status: 'pending', due_date: '2024-12-05', amount: 15000, description: 'Obtain native title clearance', tenements: { id: '5', number: 'E15/1235', holder_name: 'Northern Star Resources Ltd' }},
        { id: '6', tenement_number: 'M15/1792', jurisdiction: 'WA', action_name: 'Shire Rates Payment', action_type: 'shire_rates', status: 'pending', due_date: '2024-11-20', amount: 5680, description: 'Pay shire rates for processing plant', tenements: { id: '6', number: 'M15/1792', holder_name: 'Northern Star Resources Ltd' }},
        { id: '7', tenement_number: 'E15/1236', jurisdiction: 'WA', action_name: 'Environmental Compliance Report', action_type: 'reporting', status: 'completed', due_date: '2024-10-01', amount: 0, description: 'Submit quarterly environmental report', tenements: { id: '7', number: 'E15/1236', holder_name: 'Northern Star Resources Ltd' }},
        { id: '8', tenement_number: 'M15/1793', jurisdiction: 'WA', action_name: 'Rehabilitation Bond Review', action_type: 'renewal', status: 'pending', due_date: '2024-12-15', amount: 75000, description: 'Review and update rehabilitation bond', tenements: { id: '8', number: 'M15/1793', holder_name: 'Northern Star Resources Ltd' }},
        { id: '9', tenement_number: 'E15/1237', jurisdiction: 'WA', action_name: 'Exploration License Renewal', action_type: 'renewal', status: 'pending', due_date: '2025-01-15', amount: 3500, description: 'Renew exploration license', tenements: { id: '9', number: 'E15/1237', holder_name: 'Northern Star Resources Ltd' }},
        { id: '10', tenement_number: 'M15/1794', jurisdiction: 'WA', action_name: 'Water License Amendment', action_type: 'compliance', status: 'pending', due_date: '2024-11-28', amount: 8000, description: 'Amend water extraction license', tenements: { id: '10', number: 'M15/1794', holder_name: 'Northern Star Resources Ltd' }},

        // Goldfields Mining Pty Ltd (8 actions)
        { id: '11', tenement_number: 'M70/1234', jurisdiction: 'WA', action_name: 'Annual Rent Payment', action_type: 'payment', status: 'pending', due_date: '2024-11-22', amount: 1800, description: 'Annual rent for mining lease', tenements: { id: '11', number: 'M70/1234', holder_name: 'Goldfields Mining Pty Ltd' }},
        { id: '12', tenement_number: 'E70/5678', jurisdiction: 'WA', action_name: 'Expenditure Report', action_type: 'reporting', status: 'overdue', due_date: '2024-10-10', amount: 0, description: 'Submit expenditure report', tenements: { id: '12', number: 'E70/5678', holder_name: 'Goldfields Mining Pty Ltd' }},
        { id: '13', tenement_number: 'M70/1235', jurisdiction: 'WA', action_name: 'Environmental Assessment', action_type: 'compliance', status: 'pending', due_date: '2024-12-20', amount: 25000, description: 'Complete environmental impact assessment', tenements: { id: '13', number: 'M70/1235', holder_name: 'Goldfields Mining Pty Ltd' }},
        { id: '14', tenement_number: 'E70/5679', jurisdiction: 'WA', action_name: 'Heritage Survey', action_type: 'compliance', status: 'pending', due_date: '2024-11-18', amount: 12000, description: 'Conduct Aboriginal heritage survey', tenements: { id: '14', number: 'E70/5679', holder_name: 'Goldfields Mining Pty Ltd' }},
        { id: '15', tenement_number: 'M70/1236', jurisdiction: 'WA', action_name: 'Shire Rates Payment', action_type: 'shire_rates', status: 'pending', due_date: '2024-11-30', amount: 3360, description: 'Pay shire rates for camp site', tenements: { id: '15', number: 'M70/1236', holder_name: 'Goldfields Mining Pty Ltd' }},
        { id: '16', tenement_number: 'E70/5680', jurisdiction: 'WA', action_name: 'Drilling Program Approval', action_type: 'compliance', status: 'pending', due_date: '2024-12-08', amount: 0, description: 'Obtain drilling program approval', tenements: { id: '16', number: 'E70/5680', holder_name: 'Goldfields Mining Pty Ltd' }},
        { id: '17', tenement_number: 'M70/1237', jurisdiction: 'WA', action_name: 'Safety Inspection', action_type: 'compliance', status: 'completed', due_date: '2024-10-05', amount: 0, description: 'Quarterly safety inspection', tenements: { id: '17', number: 'M70/1237', holder_name: 'Goldfields Mining Pty Ltd' }},
        { id: '18', tenement_number: 'E70/5681', jurisdiction: 'WA', action_name: 'License Renewal', action_type: 'renewal', status: 'pending', due_date: '2025-02-01', amount: 4200, description: 'Renew exploration license', tenements: { id: '18', number: 'E70/5681', holder_name: 'Goldfields Mining Pty Ltd' }},

        // Evolution Mining Ltd (7 actions)
        { id: '19', tenement_number: 'ML1234', jurisdiction: 'NSW', action_name: 'Environmental Bond Review', action_type: 'renewal', status: 'pending', due_date: '2024-11-26', amount: 100000, description: 'Review environmental security bond', tenements: { id: '19', number: 'ML1234', holder_name: 'Evolution Mining Ltd' }},
        { id: '20', tenement_number: 'EL5678', jurisdiction: 'NSW', action_name: 'Annual Report Submission', action_type: 'reporting', status: 'pending', due_date: '2024-12-01', amount: 0, description: 'Submit annual exploration report', tenements: { id: '20', number: 'EL5678', holder_name: 'Evolution Mining Ltd' }},
        { id: '21', tenement_number: 'ML1235', jurisdiction: 'NSW', action_name: 'Mining Lease Renewal', action_type: 'renewal', status: 'pending', due_date: '2025-01-20', amount: 8500, description: 'Renew mining lease', tenements: { id: '21', number: 'ML1235', holder_name: 'Evolution Mining Ltd' }},
        { id: '22', tenement_number: 'EL5679', jurisdiction: 'NSW', action_name: 'Community Consultation', action_type: 'compliance', status: 'pending', due_date: '2024-11-15', amount: 5000, description: 'Conduct community consultation', tenements: { id: '22', number: 'EL5679', holder_name: 'Evolution Mining Ltd' }},
        { id: '23', tenement_number: 'ML1236', jurisdiction: 'NSW', action_name: 'Water Management Plan', action_type: 'compliance', status: 'overdue', due_date: '2024-10-12', amount: 0, description: 'Update water management plan', tenements: { id: '23', number: 'ML1236', holder_name: 'Evolution Mining Ltd' }},
        { id: '24', tenement_number: 'EL5680', jurisdiction: 'NSW', action_name: 'Rehabilitation Report', action_type: 'reporting', status: 'pending', due_date: '2024-12-10', amount: 0, description: 'Submit rehabilitation progress report', tenements: { id: '24', number: 'EL5680', holder_name: 'Evolution Mining Ltd' }},
        { id: '25', tenement_number: 'ML1237', jurisdiction: 'NSW', action_name: 'Noise Assessment', action_type: 'compliance', status: 'pending', due_date: '2024-11-25', amount: 7500, description: 'Conduct noise impact assessment', tenements: { id: '25', number: 'ML1237', holder_name: 'Evolution Mining Ltd' }},

        // Newcrest Mining Ltd (6 actions)
        { id: '26', tenement_number: 'MIN123456', jurisdiction: 'VIC', action_name: 'Environmental Monitoring', action_type: 'compliance', status: 'pending', due_date: '2024-11-20', amount: 15000, description: 'Quarterly environmental monitoring', tenements: { id: '26', number: 'MIN123456', holder_name: 'Newcrest Mining Ltd' }},
        { id: '27', tenement_number: 'EL123457', jurisdiction: 'VIC', action_name: 'Exploration Report', action_type: 'reporting', status: 'pending', due_date: '2024-12-05', amount: 0, description: 'Submit exploration activity report', tenements: { id: '27', number: 'EL123457', holder_name: 'Newcrest Mining Ltd' }},
        { id: '28', tenement_number: 'MIN123458', jurisdiction: 'VIC', action_name: 'Cultural Heritage Assessment', action_type: 'compliance', status: 'pending', due_date: '2024-11-28', amount: 20000, description: 'Complete cultural heritage assessment', tenements: { id: '28', number: 'MIN123458', holder_name: 'Newcrest Mining Ltd' }},
        { id: '29', tenement_number: 'EL123459', jurisdiction: 'VIC', action_name: 'License Fee Payment', action_type: 'payment', status: 'pending', due_date: '2024-11-18', amount: 3200, description: 'Pay annual license fee', tenements: { id: '29', number: 'EL123459', holder_name: 'Newcrest Mining Ltd' }},
        { id: '30', tenement_number: 'MIN123460', jurisdiction: 'VIC', action_name: 'Rehabilitation Bond Update', action_type: 'renewal', status: 'pending', due_date: '2024-12-15', amount: 85000, description: 'Update rehabilitation security bond', tenements: { id: '30', number: 'MIN123460', holder_name: 'Newcrest Mining Ltd' }},
        { id: '31', tenement_number: 'EL123461', jurisdiction: 'VIC', action_name: 'Groundwater Monitoring', action_type: 'compliance', status: 'completed', due_date: '2024-10-01', amount: 0, description: 'Monthly groundwater monitoring', tenements: { id: '31', number: 'EL123461', holder_name: 'Newcrest Mining Ltd' }},

        // Rio Tinto Ltd (5 actions)
        { id: '32', tenement_number: 'MLN456', jurisdiction: 'NT', action_name: 'Sacred Site Clearance', action_type: 'compliance', status: 'pending', due_date: '2024-12-01', amount: 30000, description: 'Obtain sacred site clearance', tenements: { id: '32', number: 'MLN456', holder_name: 'Rio Tinto Ltd' }},
        { id: '33', tenement_number: 'ELN789', jurisdiction: 'NT', action_name: 'Environmental Impact Study', action_type: 'compliance', status: 'pending', due_date: '2024-11-30', amount: 45000, description: 'Complete environmental impact study', tenements: { id: '33', number: 'ELN789', holder_name: 'Rio Tinto Ltd' }},
        { id: '34', tenement_number: 'MLN457', jurisdiction: 'NT', action_name: 'Annual Rent Payment', action_type: 'payment', status: 'overdue', due_date: '2024-10-08', amount: 12000, description: 'Annual rent for mining lease', tenements: { id: '34', number: 'MLN457', holder_name: 'Rio Tinto Ltd' }},
        { id: '35', tenement_number: 'ELN790', jurisdiction: 'NT', action_name: 'Exploration Program Report', action_type: 'reporting', status: 'pending', due_date: '2024-12-12', amount: 0, description: 'Submit exploration program report', tenements: { id: '35', number: 'ELN790', holder_name: 'Rio Tinto Ltd' }},
        { id: '36', tenement_number: 'MLN458', jurisdiction: 'NT', action_name: 'Mine Closure Plan Review', action_type: 'compliance', status: 'pending', due_date: '2025-01-10', amount: 0, description: 'Review mine closure plan', tenements: { id: '36', number: 'MLN458', holder_name: 'Rio Tinto Ltd' }},

        // BHP Group Ltd (4 actions)
        { id: '37', tenement_number: 'MDL234', jurisdiction: 'QLD', action_name: 'Environmental Authority Renewal', action_type: 'renewal', status: 'pending', due_date: '2024-11-25', amount: 25000, description: 'Renew environmental authority', tenements: { id: '37', number: 'MDL234', holder_name: 'BHP Group Ltd' }},
        { id: '38', tenement_number: 'EPM567', jurisdiction: 'QLD', action_name: 'Native Title Agreement', action_type: 'compliance', status: 'pending', due_date: '2024-12-08', amount: 50000, description: 'Finalize native title agreement', tenements: { id: '38', number: 'EPM567', holder_name: 'BHP Group Ltd' }},
        { id: '39', tenement_number: 'MDL235', jurisdiction: 'QLD', action_name: 'Coal Quality Report', action_type: 'reporting', status: 'pending', due_date: '2024-11-22', amount: 0, description: 'Submit quarterly coal quality report', tenements: { id: '39', number: 'MDL235', holder_name: 'BHP Group Ltd' }},
        { id: '40', tenement_number: 'EPM568', jurisdiction: 'QLD', action_name: 'Rehabilitation Monitoring', action_type: 'compliance', status: 'completed', due_date: '2024-09-30', amount: 0, description: 'Quarterly rehabilitation monitoring', tenements: { id: '40', number: 'EPM568', holder_name: 'BHP Group Ltd' }},

        // Fortescue Metals Group Ltd (4 actions)
        { id: '41', tenement_number: 'M47/1234', jurisdiction: 'WA', action_name: 'Iron Ore Royalty Payment', action_type: 'payment', status: 'pending', due_date: '2024-11-15', amount: 150000, description: 'Quarterly iron ore royalty payment', tenements: { id: '41', number: 'M47/1234', holder_name: 'Fortescue Metals Group Ltd' }},
        { id: '42', tenement_number: 'E47/5678', jurisdiction: 'WA', action_name: 'Dust Management Plan', action_type: 'compliance', status: 'pending', due_date: '2024-12-01', amount: 0, description: 'Update dust management plan', tenements: { id: '42', number: 'E47/5678', holder_name: 'Fortescue Metals Group Ltd' }},
        { id: '43', tenement_number: 'M47/1235', jurisdiction: 'WA', action_name: 'Port Authority Fees', action_type: 'payment', status: 'pending', due_date: '2024-11-28', amount: 35000, description: 'Port authority usage fees', tenements: { id: '43', number: 'M47/1235', holder_name: 'Fortescue Metals Group Ltd' }},
        { id: '44', tenement_number: 'E47/5679', jurisdiction: 'WA', action_name: 'Biodiversity Assessment', action_type: 'compliance', status: 'overdue', due_date: '2024-10-05', amount: 18000, description: 'Annual biodiversity assessment', tenements: { id: '44', number: 'E47/5679', holder_name: 'Fortescue Metals Group Ltd' }},

        // Sandfire Resources Ltd (3 actions)
        { id: '45', tenement_number: 'M52/1111', jurisdiction: 'WA', action_name: 'Copper Concentrate Testing', action_type: 'compliance', status: 'pending', due_date: '2024-11-20', amount: 8500, description: 'Quarterly copper concentrate testing', tenements: { id: '45', number: 'M52/1111', holder_name: 'Sandfire Resources Ltd' }},
        { id: '46', tenement_number: 'E52/2222', jurisdiction: 'WA', action_name: 'Exploration License Extension', action_type: 'renewal', status: 'pending', due_date: '2024-12-18', amount: 5500, description: 'Extend exploration license', tenements: { id: '46', number: 'E52/2222', holder_name: 'Sandfire Resources Ltd' }},
        { id: '47', tenement_number: 'M52/1112', jurisdiction: 'WA', action_name: 'Tailings Dam Inspection', action_type: 'compliance', status: 'pending', due_date: '2024-11-12', amount: 0, description: 'Monthly tailings dam inspection', tenements: { id: '47', number: 'M52/1112', holder_name: 'Sandfire Resources Ltd' }},

        // Pilbara Minerals Ltd (3 actions)
        { id: '48', tenement_number: 'M45/1000', jurisdiction: 'WA', action_name: 'Lithium Processing Report', action_type: 'reporting', status: 'pending', due_date: '2024-11-25', amount: 0, description: 'Monthly lithium processing report', tenements: { id: '48', number: 'M45/1000', holder_name: 'Pilbara Minerals Ltd' }},
        { id: '49', tenement_number: 'E45/2000', jurisdiction: 'WA', action_name: 'Spodumene Quality Assurance', action_type: 'compliance', status: 'pending', due_date: '2024-12-03', amount: 12000, description: 'Spodumene quality assurance testing', tenements: { id: '49', number: 'E45/2000', holder_name: 'Pilbara Minerals Ltd' }},
        { id: '50', tenement_number: 'M45/1001', jurisdiction: 'WA', action_name: 'Environmental Monitoring', action_type: 'compliance', status: 'completed', due_date: '2024-10-15', amount: 0, description: 'Quarterly environmental monitoring', tenements: { id: '50', number: 'M45/1001', holder_name: 'Pilbara Minerals Ltd' }},
      ];

      // Apply filters to mock data
      let filteredActions = mockActions;
      
      if (filter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        filteredActions = mockActions.filter(action => 
          action.due_date === today && action.status === 'pending'
        );
      } else if (filter === 'week') {
        const today = new Date();
        const weekFromNow = new Date();
        weekFromNow.setDate(today.getDate() + 7);
        filteredActions = mockActions.filter(action => {
          const dueDate = new Date(action.due_date);
          return dueDate >= today && dueDate <= weekFromNow && action.status === 'pending';
        });
      } else if (filter === 'overdue') {
        const today = new Date();
        filteredActions = mockActions.filter(action => {
          const dueDate = new Date(action.due_date);
          return dueDate < today && action.status === 'pending';
        });
      }

      setActions(filteredActions);
      groupActionsByHolder(filteredActions);
    } catch (err) {
      setError('Failed to load actions');
      console.error('Error loading actions:', err);
    } finally {
      setLoading(false);
    }
  };

  const groupActionsByHolder = (actionsData: Action[]) => {
    const groups = actionsData.reduce((acc, action) => {
      const holderName = action.tenements?.holder_name || 'Unknown Holder';
      
      if (!acc[holderName]) {
        acc[holderName] = [];
      }
      acc[holderName].push(action);
      return acc;
    }, {} as Record<string, Action[]>);

    const holderGroupsData: HolderGroup[] = Object.entries(groups).map(([holder_name, actions]) => {
      const totalAmount = actions.reduce((sum, action) => sum + (action.amount || 0), 0);
      const overdueCount = actions.filter(action => {
        const dueDate = new Date(action.due_date);
        return action.status === 'pending' && dueDate < new Date();
      }).length;
      const upcomingCount = actions.filter(action => {
        const dueDate = new Date(action.due_date);
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        return action.status === 'pending' && dueDate <= weekFromNow && dueDate >= new Date();
      }).length;

      return {
        holder_name,
        actions,
        totalActions: actions.length,
        totalAmount,
        overdueCount,
        upcomingCount,
      };
    }).sort((a, b) => b.totalActions - a.totalActions); // Sort by most actions first

    setHolderGroups(holderGroupsData);
    
    // Auto-expand holders with overdue actions
    const holdersWithOverdue = holderGroupsData
      .filter(group => group.overdueCount > 0)
      .map(group => group.holder_name);
    setExpandedHolders(new Set(holdersWithOverdue));
  };

  const loadStats = async () => {
    try {
      // Generate realistic stats based on the 50 mock actions
      const mockStats: ActionStats = {
        total: 50,
        by_status: {
          pending: 42,
          completed: 4,
          overdue: 4,
          cancelled: 0,
        },
        upcoming_30_days: 35,
        total_amount: 756180,
        overdue_amount: 47500,
      };
      
      setStats(mockStats);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'payment': return 'bg-purple-100 text-purple-800';
      case 'renewal': return 'bg-orange-100 text-orange-800';
      case 'reporting': return 'bg-indigo-100 text-indigo-800';
      case 'compliance': return 'bg-yellow-100 text-yellow-800';
      case 'shire_rates': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU');
  };

  const toggleHolderExpansion = (holderName: string) => {
    const newExpanded = new Set(expandedHolders);
    if (newExpanded.has(holderName)) {
      newExpanded.delete(holderName);
    } else {
      newExpanded.add(holderName);
    }
    setExpandedHolders(newExpanded);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <span className="ml-3 text-lg">Loading actions...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Actions & Compliance 📋
          </h1>
          <p className="text-gray-600">
            Track and manage all tenement obligations, renewals, and compliance tasks
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">📊</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Actions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">⏰</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Upcoming (30 days)</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.upcoming_30_days}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">🚨</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Overdue</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.by_status.overdue}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">💰</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.total_amount)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Buttons */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <div className="flex space-x-2">
              {[
                { key: 'all', label: 'All Actions' },
                { key: 'today', label: 'Due Today' },
                { key: 'week', label: 'This Week' },
                { key: 'overdue', label: 'Overdue' },
              ].map((filterOption) => (
                <button
                  key={filterOption.key}
                  onClick={() => setFilter(filterOption.key as any)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === filterOption.key
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filterOption.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => router.push('/actions/new')}
              className="ml-auto px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors text-sm font-medium"
            >
              + Add Action
            </button>
          </div>
        </div>

        {/* Holder-Grouped Actions */}
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {holderGroups.map((group) => (
              <div key={group.holder_name} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Holder Header */}
                <div 
                  className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-200 p-6 cursor-pointer hover:from-emerald-100 hover:to-teal-100 transition-colors"
                  onClick={() => toggleHolderExpansion(group.holder_name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {expandedHolders.has(group.holder_name) ? (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        )}
                        <Building2 className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 hover:text-emerald-600 transition-colors">
                          <button 
                            onClick={() => router.push(`/holders/${group.holder_name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}`)}
                            className="text-left"
                          >
                            {group.holder_name}
                          </button>
                        </h3>
                        <p className="text-sm text-gray-600">{group.totalActions} actions</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      {group.overdueCount > 0 && (
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-medium text-red-600">{group.overdueCount} overdue</span>
                        </div>
                      )}
                      {group.upcomingCount > 0 && (
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-orange-500" />
                          <span className="text-sm font-medium text-orange-600">{group.upcomingCount} upcoming</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium text-gray-900">{formatCurrency(group.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Actions */}
                {expandedHolders.has(group.holder_name) && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tenement
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Due Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {group.actions.map((action) => (
                          <tr 
                            key={action.id}
                            className="hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => router.push(`/actions/${action.id}`)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{action.action_name}</div>
                                {action.description && (
                                  <div className="text-sm text-gray-500 truncate max-w-xs">{action.description}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 mr-2">
                                  {action.jurisdiction}
                                </span>
                                <span className="text-sm text-gray-900">{action.tenement_number}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(action.action_type)}`}>
                                {action.action_type.replace('_', ' ').toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(action.due_date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(action.amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(action.status)}`}>
                                {action.status.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}

            {holderGroups.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No actions found</h3>
                <p className="text-gray-500">
                  {filter === 'all' 
                    ? 'No actions have been created yet.' 
                    : `No actions match the "${filter}" filter.`}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
