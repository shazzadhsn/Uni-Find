import { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
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
}

interface AllReportsTabProps {
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

export function AllReportsTab({ user }: AllReportsTabProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [typeFilter, setTypeFilter] = useState<'all' | 'lost' | 'found'>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [reports, searchQuery, categoryFilter, typeFilter]);

  const fetchReports = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c95fd11c/reports?status=approved`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Session-Token': user.accessToken,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    let filtered = reports;

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(r => r.type === typeFilter);
    }

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
        <h2 className="text-gray-900 mb-4">All Reports</h2>
        
        {/* Filters */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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

          <div className="flex gap-2">
            <Button
              variant={typeFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setTypeFilter('all')}
              className="flex-1"
            >
              All
            </Button>
            <Button
              variant={typeFilter === 'lost' ? 'default' : 'outline'}
              onClick={() => setTypeFilter('lost')}
              className="flex-1"
            >
              Lost
            </Button>
            <Button
              variant={typeFilter === 'found' ? 'default' : 'outline'}
              onClick={() => setTypeFilter('found')}
              className="flex-1"
            >
              Found
            </Button>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading reports...</div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-border">
          <p className="text-gray-500 dark:text-gray-400">No reports found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map(report => (
            <ReportCard
              key={report.id}
              report={report}
              onDetailsClick={() => setSelectedReport(report)}
            />
          ))}
        </div>
      )}

      {selectedReport && (
        <ReportDetailsDialog
          report={selectedReport}
          user={user}
          onClose={() => setSelectedReport(null)}
          onAction={fetchReports}
        />
      )}
    </div>
  );
}