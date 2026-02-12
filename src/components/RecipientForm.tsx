import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { validateName, validateBirthday, validateNotes, validateTags } from '../utils/validation';
import { formatDate } from '../utils/dates';
import { Recipient } from '../lib/supabase';

interface RecipientFormProps {
  initialData?: Recipient;
  onSubmit: (data: {
    name: string;
    birthday: string;
    relationship: 'Family' | 'Friend' | 'Colleague' | 'Other';
    tags: string;
    notes: string;
  }) => Promise<void>;
  isLoading?: boolean;
  onCancel: () => void;
}

export function RecipientForm({ initialData, onSubmit, isLoading = false, onCancel }: RecipientFormProps) {
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [relationship, setRelationship] = useState<'Family' | 'Friend' | 'Colleague' | 'Other'>('Family');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setBirthday(initialData.birthday);
      setRelationship(initialData.relationship);
      setTags(initialData.tags);
      setNotes(initialData.notes);
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const nameError = validateName(name);
    if (nameError) newErrors.name = nameError;

    const birthdayError = validateBirthday(birthday);
    if (birthdayError) newErrors.birthday = birthdayError;

    const notesError = validateNotes(notes);
    if (notesError) newErrors.notes = notesError;

    const tagsError = validateTags(tags);
    if (tagsError) newErrors.tags = tagsError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    await onSubmit({
      name,
      birthday,
      relationship,
      tags,
      notes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
          }}
          placeholder="Enter recipient's name"
          className={`w-full px-4 py-2 border rounded-lg bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent ${
            errors.name ? 'border-red-500' : 'border-border-color'
          }`}
        />
        {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Birthday <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={birthday}
          onChange={(e) => {
            setBirthday(e.target.value);
            if (errors.birthday) setErrors((prev) => ({ ...prev, birthday: '' }));
          }}
          className={`w-full px-4 py-2 border rounded-lg bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent ${
            errors.birthday ? 'border-red-500' : 'border-border-color'
          }`}
        />
        {errors.birthday && <p className="text-red-600 text-sm mt-1">{errors.birthday}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Relationship <span className="text-red-500">*</span>
        </label>
        <select
          value={relationship}
          onChange={(e) => setRelationship(e.target.value as 'Family' | 'Friend' | 'Colleague' | 'Other')}
          className="w-full px-4 py-2 border border-border-color rounded-lg bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="Family">Family</option>
          <option value="Friend">Friend</option>
          <option value="Colleague">Colleague</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Tags <span className="text-text-tertiary text-xs">(comma-separated, e.g., golf, coffee, books)</span>
        </label>
        <input
          type="text"
          value={tags}
          onChange={(e) => {
            setTags(e.target.value);
            if (errors.tags) setErrors((prev) => ({ ...prev, tags: '' }));
          }}
          placeholder="Enter tags separated by commas"
          className={`w-full px-4 py-2 border rounded-lg bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent ${
            errors.tags ? 'border-red-500' : 'border-border-color'
          }`}
        />
        {errors.tags && <p className="text-red-600 text-sm mt-1">{errors.tags}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Notes <span className="text-text-tertiary text-xs">({notes.length}/500 characters)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            if (errors.notes) setErrors((prev) => ({ ...prev, notes: '' }));
          }}
          placeholder="Add gift ideas, preferences, or other notes"
          maxLength={500}
          rows={4}
          className={`w-full px-4 py-2 border rounded-lg bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent ${
            errors.notes ? 'border-red-500' : 'border-border-color'
          }`}
        />
        {errors.notes && <p className="text-red-600 text-sm mt-1">{errors.notes}</p>}
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" isLoading={isLoading} className="flex-1">
          {initialData ? 'Update Recipient' : 'Create Recipient'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
