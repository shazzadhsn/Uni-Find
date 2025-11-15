import { useState } from 'react';
import { PlusCircle, Upload, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface CreateReportTabProps {
  user: {
    id: string;
    accessToken: string;
  };
}

const CATEGORIES = [
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

export function CreateReportTab({ user }: CreateReportTabProps) {
  const [reportType, setReportType] = useState<'lost' | 'found'>('lost');
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const resetForm = () => {
    setItemName('');
    setCategory('');
    setDescription('');
    setDate('');
    setLocation('');
    setPhoto(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    console.log('CreateReportTab - Submitting report for user:', user.id);

    // Manual validation for Select components
    if (!category) {
      setError('Please select a category');
      setLoading(false);
      return;
    }

    if (reportType === 'found' && !location) {
      setError('Please provide the location where the item was found');
      setLoading(false);
      return;
    }

    if (reportType === 'found' && !photo) {
      setError('Photo is required for found items');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('type', reportType);
      formData.append('itemName', itemName);
      formData.append('category', category);
      formData.append('description', description);
      formData.append('date', date);
      if (reportType === 'found' && location) {
        formData.append('location', location);
      }
      if (photo) {
        formData.append('photo', photo);
      }

      console.log('CreateReportTab - Form data prepared:', {
        type: reportType,
        itemName,
        category,
        description,
        date,
        location,
        hasPhoto: !!photo,
        photoName: photo?.name,
        photoSize: photo?.size,
      });

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c95fd11c/create-report`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Session-Token': user.accessToken,
          },
          body: formData,
        }
      );

      console.log('Create report response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('Create report error response:', error);
        throw new Error(error.error || 'Failed to create report');
      }

      const result = await response.json();
      console.log('Create report success:', result);

      setSuccess(true);
      resetForm();
    } catch (error: any) {
      setError(error.message || 'An error occurred while creating the report');
      console.error('Create report error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-border">
        <h2 className="text-gray-900 dark:text-gray-100 mb-4">Create New Report</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Fill in the details to report a lost or found item
        </p>
      </div>

      {success && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
          <AlertDescription className="text-green-800 dark:text-green-200">
            Report submitted successfully! It will be visible after admin approval.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
          <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
        </Alert>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-border">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs value={reportType} onValueChange={(v) => setReportType(v as 'lost' | 'found')}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="lost">Lost Item</TabsTrigger>
              <TabsTrigger value="found">Found Item</TabsTrigger>
            </TabsList>

            <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="itemName">Item Name *</Label>
              <Input
                id="itemName"
                placeholder="Blue Backpack, iPhone 13, ID Card"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Provide detailed description of the item (color, brand, unique features, etc.)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">
                Date {reportType === 'lost' ? 'Lost' : 'Found'} *
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            {reportType === 'found' && (
              <div className="space-y-2">
                <Label htmlFor="location">Found Location *</Label>
                <Input
                  id="location"
                  placeholder="Library 2nd Floor, Cafeteria, Main Gate"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required={reportType === 'found'}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="photo">
                Upload Photo {reportType === 'lost' ? '(Optional)' : '*'}
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  required={reportType === 'found'}
                  className="flex-1"
                />
                {photo && (
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Selected
                  </span>
                )}
              </div>
              {reportType === 'found' && (
                <p className="text-xs text-gray-500">
                  Photo is required for found items to help owners identify their belongings
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-purple-500/30"
              disabled={loading}
            >
              {loading ? 'Creating Report...' : 'Submit Report'}
            </Button>

            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              Your report will be reviewed by admin before being published
            </p>
          </div>
        </Tabs>
      </form>
      </div>
    </div>
  );
}