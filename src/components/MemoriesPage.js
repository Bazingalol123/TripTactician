import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { memoriesApi } from '../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  PlusCircle, 
  Edit, 
  Trash2, 
  Camera, 
  Calendar, 
  MapPin, 
  X, 
  Heart,
  Upload,
  Search,
  Grid3X3,
  List,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Elegant Memory Card Component
const ElegantMemoryCard = ({ memory, viewMode, onEdit, onDelete }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        layout
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start space-x-4">
          {memory.photos && memory.photos.length > 0 && (
            <div className="flex-shrink-0">
              <img
                src={memory.photos[0]}
                alt={memory.title || 'Memory'}
                className="w-24 h-24 object-cover rounded-lg"
              />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {memory.title || 'Untitled Memory'}
                </h3>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-2">
                  {memory.date && (
                    <div className="flex items-center space-x-1">
                      <Calendar size={14} />
                      <span>{formatDate(memory.date)}</span>
                    </div>
                  )}
                  {memory.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin size={14} />
                      <span>{memory.location}</span>
                    </div>
                  )}
                </div>
                {memory.notes && (
                  <p className="text-gray-700 line-clamp-2">{memory.notes}</p>
                )}
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={onEdit}
                  className="p-2 text-gray-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={onDelete}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      layout
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300"
    >
      {memory.photos && memory.photos.length > 0 && (
        <div className="aspect-video relative overflow-hidden">
          <img
            src={memory.photos[0]}
            alt={memory.title || 'Memory'}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 right-3 flex space-x-2">
            <button
              onClick={onEdit}
              className="p-2 bg-white/90 backdrop-blur-sm text-gray-700 hover:text-sky-600 rounded-lg transition-colors"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={onDelete}
              className="p-2 bg-white/90 backdrop-blur-sm text-gray-700 hover:text-red-600 rounded-lg transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}
      
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          {memory.title || 'Untitled Memory'}
        </h3>
        
        <div className="space-y-2 mb-4">
          {memory.date && (
            <div className="flex items-center space-x-2 text-gray-600">
              <Calendar size={16} className="text-sky-500" />
              <span className="text-sm">{formatDate(memory.date)}</span>
            </div>
          )}
          {memory.location && (
            <div className="flex items-center space-x-2 text-gray-600">
              <MapPin size={16} className="text-sky-500" />
              <span className="text-sm">{memory.location}</span>
            </div>
          )}
        </div>
        
        {memory.notes && (
          <p className="text-gray-700 text-sm line-clamp-3 leading-relaxed">
            {memory.notes}
          </p>
        )}

        {(!memory.photos || memory.photos.length === 0) && (
          <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={onEdit}
              className="flex items-center space-x-1 px-3 py-1.5 text-gray-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
            >
              <Edit size={14} />
              <span className="text-sm">Edit</span>
            </button>
            <button
              onClick={onDelete}
              className="flex items-center space-x-1 px-3 py-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={14} />
              <span className="text-sm">Delete</span>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Elegant Memory Form Modal Component
const ElegantMemoryForm = ({ memory, onClose, onSave, isLoading }) => {
  const [formData, setFormData] = useState({
    title: '',
    notes: '',
    date: '',
    location: '',
    photos: [],
    trip: '',
  });

  useEffect(() => {
    if (memory) {
      setFormData({
        title: memory.title || '',
        notes: memory.notes || '',
        date: memory.date ? new Date(memory.date).toISOString().split('T')[0] : '',
        location: memory.location || '',
        photos: memory.photos || [],
        trip: memory.trip || '',
        _id: memory._id,
      });
    } else {
      setFormData({
        title: '',
        notes: '',
        date: new Date().toISOString().split('T')[0],
        location: '',
        photos: [],
        trip: '',
      });
    }
  }, [memory]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Simple validation
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Photo size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ 
          ...prev, 
          photos: [reader.result] // For now, just replace the photo
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter a title for your memory');
      return;
    }
    onSave(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {memory ? 'Edit Memory' : 'Add New Memory'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-colors"
              placeholder="Give your memory a title..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-colors"
                placeholder="Where was this?"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-colors resize-none"
              placeholder="Tell the story of this memory..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo
            </label>
            
            {formData.photos.length === 0 ? (
              <label className="relative block w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-sky-400 transition-colors cursor-pointer">
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">Click to upload a photo</span>
                  <span className="text-xs text-gray-500">Max 5MB</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </label>
            ) : (
              <div className="space-y-3">
                {formData.photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={photo}
                      alt="Memory"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <label className="block w-full p-3 border border-gray-300 rounded-lg text-center cursor-pointer hover:bg-gray-50 transition-colors">
                  <span className="text-sm text-gray-600">Replace Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center space-x-2 px-6 py-2 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white rounded-lg font-medium transition-colors"
            >
              {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
              <span>{memory ? 'Update Memory' : 'Save Memory'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const MemoriesPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [memoryToEdit, setMemoryToEdit] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchQuery, setSearchQuery] = useState('');

  const { data: memories, isLoading, error } = useQuery({
    queryKey: ['userMemories', token],
    queryFn: () => memoriesApi(token).getAllUserMemories(),
    enabled: !!token,
  });

  const createMemoryMutation = useMutation({
    mutationFn: (newMemory) => memoriesApi(token).create(newMemory),
    onSuccess: () => {
      queryClient.invalidateQueries(['userMemories']);
      toast.success('Memory added successfully!');
      setShowForm(false);
    },
    onError: (err) => {
      toast.error(`Failed to add memory: ${err.message || 'Unknown error'}`);
    },
  });

  const updateMemoryMutation = useMutation({
    mutationFn: ({ id, updates }) => memoriesApi(token).update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries(['userMemories']);
      toast.success('Memory updated successfully!');
      setShowForm(false);
      setMemoryToEdit(null);
    },
    onError: (err) => {
      toast.error(`Failed to update memory: ${err.message || 'Unknown error'}`);
    },
  });

  const deleteMemoryMutation = useMutation({
    mutationFn: (id) => memoriesApi(token).remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['userMemories']);
      toast.success('Memory deleted successfully!');
    },
    onError: (err) => {
      toast.error(`Failed to delete memory: ${err.message || 'Unknown error'}`);
    },
  });

  const handleAddMemoryClick = () => {
    setMemoryToEdit(null);
    setShowForm(true);
  };

  const handleEditMemoryClick = (memory) => {
    setMemoryToEdit(memory);
    setShowForm(true);
  };

  const handleSaveMemory = (formData) => {
    if (formData._id) {
      updateMemoryMutation.mutate({ id: formData._id, updates: formData });
    } else {
      createMemoryMutation.mutate(formData);
    }
  };

  const handleDeleteMemory = (memoryId) => {
    if (window.confirm('Are you sure you want to delete this memory?')) {
      deleteMemoryMutation.mutate(memoryId);
    }
  };

  // Filter memories based on search
  const filteredMemories = memories?.filter(memory => 
    memory.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    memory.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    memory.notes?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-sky-500 border-t-transparent"></div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Your Memories</h3>
          <p className="text-gray-600">Gathering your precious travel moments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <X className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Unable to Load Memories</h2>
          <p className="text-gray-600 mb-6">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Travel Memories</h1>
                <p className="text-gray-600">
                  {memories?.length || 0} precious moments captured
                </p>
              </div>
            </div>
            
            <button
              onClick={handleAddMemoryClick}
              className="flex items-center space-x-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium transition-colors"
            >
              <PlusCircle size={16} />
              <span>Add Memory</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        {memories && memories.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search memories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>
              
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-white text-sky-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Grid3X3 size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-white text-sky-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!memories || memories.length === 0) && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-sky-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Camera className="w-12 h-12 text-sky-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Memories Yet</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start capturing your travel moments! Add photos, notes, and details about the places you've visited to create lasting memories.
            </p>
            <button
              onClick={handleAddMemoryClick}
              className="flex items-center space-x-2 px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium transition-colors mx-auto"
            >
              <PlusCircle size={20} />
              <span>Create Your First Memory</span>
            </button>
          </div>
        )}

        {/* No Search Results */}
        {memories && memories.length > 0 && filteredMemories.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No Memories Found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search terms
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              Clear Search
            </button>
          </div>
        )}

        {/* Memories Grid/List */}
        {filteredMemories.length > 0 && (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
          }>
            <AnimatePresence>
              {filteredMemories.map((memory) => (
                <ElegantMemoryCard
                  key={memory._id}
                  memory={memory}
                  viewMode={viewMode}
                  onEdit={() => handleEditMemoryClick(memory)}
                  onDelete={() => handleDeleteMemory(memory._id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Memory Form Modal */}
      <AnimatePresence>
        {showForm && (
          <ElegantMemoryForm
            memory={memoryToEdit}
            onClose={() => {
              setShowForm(false);
              setMemoryToEdit(null);
            }}
            onSave={handleSaveMemory}
            isLoading={createMemoryMutation.isLoading || updateMemoryMutation.isLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MemoriesPage; 