import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { RecipientForm } from '../components/RecipientForm';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { supabase } from '../lib/supabase';

export function AddRecipient() {
  const [isLoading, setIsLoading] = useState(false);
  const { session } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = async (data: {
    name: string;
    birthday: string;
    relationship: 'Family' | 'Friend' | 'Colleague' | 'Other';
    tags: string;
    notes: string;
  }) => {
    setIsLoading(true);

    try {
      const { error } = await supabase.from('recipients').insert({
        user_id: session?.user.id,
        name: data.name,
        birthday: data.birthday,
        relationship: data.relationship,
        tags: data.tags,
        notes: data.notes,
      });

      if (error) {
        showToast(error.message, 'error');
        setIsLoading(false);
        return;
      }

      showToast('Recipient added successfully!', 'success');
      navigate('/recipients');
    } catch (error) {
      showToast((error as Error).message, 'error');
      setIsLoading(false);
    }
  };

  return (
    <Layout currentPage="/recipients/new">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Add New Recipient</h1>
          <p className="text-gray-600 mt-2">Create a new gift recipient and start tracking gift ideas</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <RecipientForm onSubmit={handleSubmit} isLoading={isLoading} onCancel={() => navigate('/recipients')} />
        </div>
      </div>
    </Layout>
  );
}
