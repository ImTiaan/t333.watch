'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';

interface PackFormProps {
  initialData?: {
    id?: string;
    title: string;
    description?: string;
    tags?: string[];
    visibility: 'public' | 'private';
  };
  onSuccess?: (packId: string) => void;
  onCancel?: () => void;
}

export default function PackForm({ initialData, onSuccess, onCancel }: PackFormProps) {
  const router = useRouter();
  const { getAccessToken } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [visibility, setVisibility] = useState<'public' | 'private'>(
    initialData?.visibility || 'private'
  );
  
  // Tag input state
  const [tagInput, setTagInput] = useState('');
  
  // Handle tag input
  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };
  
  // Remove tag
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Validate form
      if (!title.trim()) {
        throw new Error('Title is required');
      }
      
      // Prepare data
      const data = {
        title: title.trim(),
        description: description.trim() || null,
        tags: tags.length > 0 ? tags : null,
        visibility,
      };
      
      // Determine if we're creating or updating
      const isEditing = !!initialData?.id;
      const url = isEditing ? `/api/packs/${initialData.id}` : '/api/packs';
      const method = isEditing ? 'PUT' : 'POST';
      
      // Get the access token
      const token = await getAccessToken();
      
      if (!token) {
        throw new Error('You must be logged in to create a pack');
      }
      
      // Submit the form
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save pack');
      }
      
      const result = await response.json();
      
      // Call onSuccess callback or redirect
      if (onSuccess) {
        onSuccess(result.pack.id);
      } else {
        router.push(`/dashboard/packs/${result.pack.id}`);
      }
      
      // Refresh the page data
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-white mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-[#0e0e10] text-white border border-[#2d2d3a] rounded px-4 py-2 focus:outline-none focus:border-[#9146FF]"
          placeholder="My Awesome Pack"
          required
        />
      </div>
      
      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-white mb-1">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-[#0e0e10] text-white border border-[#2d2d3a] rounded px-4 py-2 focus:outline-none focus:border-[#9146FF]"
          placeholder="Describe your pack (optional)"
          rows={3}
        />
      </div>
      
      {/* Tags */}
      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-white mb-1">
          Tags
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag) => (
            <div
              key={tag}
              className="bg-[#2d2d3a] text-white px-2 py-1 rounded-full text-sm flex items-center"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 text-white/70 hover:text-white"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
        <input
          type="text"
          id="tags"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagInputKeyDown}
          className="w-full bg-[#0e0e10] text-white border border-[#2d2d3a] rounded px-4 py-2 focus:outline-none focus:border-[#9146FF]"
          placeholder="Add tags (press Enter to add)"
        />
        <p className="text-xs text-gray-400 mt-1">
          Press Enter to add a tag. Tags help others discover your pack.
        </p>
      </div>
      
      {/* Visibility */}
      <div>
        <label className="block text-sm font-medium text-white mb-1">
          Visibility
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="visibility"
              value="public"
              checked={visibility === 'public'}
              onChange={() => setVisibility('public')}
              className="mr-2"
            />
            <span>Public</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="visibility"
              value="private"
              checked={visibility === 'private'}
              onChange={() => setVisibility('private')}
              className="mr-2"
            />
            <span>Private</span>
          </label>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Public packs can be discovered by other users. Private packs are only visible to you.
        </p>
      </div>
      
      {/* Form actions */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-[#2d2d3a] rounded text-white hover:bg-[#2d2d3a]"
            disabled={isSubmitting}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="twitch-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : initialData?.id ? 'Update Pack' : 'Create Pack'}
        </button>
      </div>
    </form>
  );
}