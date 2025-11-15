import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ReportCard } from './ReportCard';
import { ReportDetailsDialog } from './ReportDetailsDialog';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface Report {
  id: string;
  type: 'lost' | 'found';
  itemName: string;
  category: string;
  description: string;
  date: string;
  location?: string;
  photoUrl?: string;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  createdBy: string;
  creatorName: string;
  creatorEmail: string;
  createdAt: string;
  deliveryStatus?: 'pending' | 'delivered';
  deliveredAt?: string;
  actionDetails?: {
    id: string;
    actionType: 'found' | 'claim';
    actionByUserId: string;
    actionByUserName: string;
    actionByUserEmail: string;
    createdAt: string;
  };
}

interface MyReportsTabProps {
  user: {
    id: string;
    accessToken: string;
  };
}

const CATEGORIES = [
  'All Categories',
  'Stationary',
  'Electronics',
  'Books',
  'ID Cards',
  'Clothing',
  'Accessories',
  'Keys',
  'Bags',
  'Others'
];

export function MyReportsTab({ user }: MyReportsTabProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    fetchMyReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [reports, searchQuery, categoryFilter]);

  const fetchMyReports = async () => {
    try {
      console.log('MyReportsTab - Fetching reports for user:', user.id);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c95fd11c/my-reports`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Session-Token': user.accessToken,
          },
        }
      );

      console.log('MyReportsTab - Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('MyReportsTab - Received reports:', data.reports?.length || 0, data.reports);
        setReports(data.reports || []);
      } else {
        const error = await response.json();
        console.error('MyReportsTab - Error response:', error);
      }
    } catch (error) {
      console.error('Error fetching my reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    let filtered = reports;

    // Filter by category
    if (categoryFilter !== 'All Categories') {
      filtered = filtered.filter(r => r.category === categoryFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.itemName.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query) ||
        r.category.toLowerCase().includes(query)
      );
    }

    setFilteredReports(filtered);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-border">
        <h2 className="text-gray-900 dark:text-gray-100 mb-4">My Reports</h2>
        
        {/* Filters */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <Input
              placeholder="Search by item, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading your reports...</div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-border">
          <p className="text-gray-500 dark:text-gray-400">You haven't created any reports yet.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map(report => (
            <ReportCard
              key={report.id}
              report={report}
              onDetailsClick={() => setSelectedReport(report)}
              showStatus={true}
            />
          ))}
        </div>
      )}

      {/* Report Details Dialog */}
      {selectedReport && (
        <ReportDetailsDialog
          report={selectedReport}
          user={user}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </div>
  );
}