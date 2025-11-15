import { Calendar, MapPin, Package } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface Report {
  id: string;
  type: 'lost' | 'found';
  itemName: string;
  category: string;
  description: string;
  date: string;
  location?: string;
  photoUrl?: string;
  status: string;
  creatorName: string;
  createdAt: string;
}

interface ReportCardProps {
  report: Report;
  onDetailsClick: () => void;
  showStatus?: boolean;
}

export function ReportCard({ report, onDetailsClick, showStatus = false }: ReportCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {report.photoUrl && (
        <div className="h-48 bg-gray-100 dark:bg-gray-700 overflow-hidden">
          <ImageWithFallback
            src={report.photoUrl}
            alt={report.itemName}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-gray-900 dark:text-gray-100 truncate">{report.itemName}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{report.category}</p>
          </div>
          <Badge variant={report.type === 'lost' ? 'destructive' : 'default'}>
            {report.type === 'lost' ? 'Lost' : 'Found'}
          </Badge>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{report.description}</p>

        <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3" />
            <span>{new Date(report.date).toLocaleDateString()}</span>
          </div>
          {report.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3" />
              <span>{report.location}</span>
            </div>
          )}
        </div>

        {showStatus && (
          <Badge 
            variant={
              report.status === 'approved' ? 'default' :
              report.status === 'completed' ? 'secondary' :
              report.status === 'rejected' ? 'destructive' :
              'outline'
            }
          >
            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
          </Badge>
        )}

        <Button onClick={onDetailsClick} className="w-full" size="sm">
          View Details
        </Button>
      </div>
    </div>
  );
}