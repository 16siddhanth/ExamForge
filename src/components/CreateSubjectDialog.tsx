
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubjects } from '@/hooks/useSubjects';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';

const colorOptions = [
  { value: 'from-blue-500 to-indigo-500', label: 'Blue to Indigo' },
  { value: 'from-purple-500 to-pink-500', label: 'Purple to Pink' },
  { value: 'from-green-500 to-teal-500', label: 'Green to Teal' },
  { value: 'from-orange-500 to-red-500', label: 'Orange to Red' },
  { value: 'from-cyan-500 to-blue-500', label: 'Cyan to Blue' },
  { value: 'from-violet-500 to-purple-500', label: 'Violet to Purple' },
];

export const CreateSubjectDialog = () => {
  const { user } = useAuth();
  const { createSubject, isCreating } = useSubjects();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: 'from-blue-500 to-indigo-500'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    createSubject({
      name: formData.name,
      description: formData.description,
      color: formData.color
    });

    setFormData({ name: '', description: '', color: 'from-blue-500 to-indigo-500' });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Subject
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Subject</DialogTitle>
          <DialogDescription>
            Add a new subject to organize your study materials.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Subject Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Mathematics, Biology, History"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of this subject"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color Theme</Label>
            <Select value={formData.color} onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {colorOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center space-x-2">
                      <div className={`w-4 h-4 rounded bg-gradient-to-r ${option.value}`} />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Subject'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
