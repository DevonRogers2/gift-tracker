import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { RecipientForm } from '../components/RecipientForm';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { supabase, Recipient } from '../lib/supabase';

export function EditRecipient() {
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const { recipientId } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchRecipient = async () => {
      if (!recipientId) {
        showToast('Recipient not found', 'error');
        navigate('/recipients');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('recipients')
          .select('*')
          .eq('id', recipientId)
          .eq('user_id', session?.user.id)
          .maybeSingle();

        if (error || !data) {
          showToast('Recipient not found', 'error');
          navigate('/recipients');
          return;
        }

        setRecipient(data);
      } catch (error) {
        showToast((error as Error).message, 'error');
        navigate('/recipients');
      } finally {
        setPageLoading(false);
      }
    };

    fetchRecipient();
  }, [recipientId, session?.user.id, navigate, showToast]);

  const handleSubmit = async (data: {
    name: string;
    birthday: string;
    relationship: 'Family' | 'Friend' | 'Colleague' | 'Other';
    tags: string;
    notes: string;
  }) => {
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('recipients')
        .update({
          name: data.name,
          birthday: data.birthday,
          relationship: data.relationship,
          tags: data.tags,
          notes: data.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', recipientId)
        .eq('user_id', session?.user.id);

      if (error) {
        showToast(error.message, 'error');
        setIsLoading(false);
        return;
      }

      showToast('Recipient updated successfully!', 'success');
      navigate(`/recipients/${recipientId}`);
    } catch (error) {
      showToast((error as Error).message, 'error');
      setIsLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <Layout currentPage="/recipients">
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!recipient) {
    return null;
  }

  return (
    <Layout currentPage="/recipients">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Recipient</h1>
          <p className="text-gray-600 mt-2">Update recipient information</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <RecipientForm initialData={recipient} onSubmit={handleSubmit} isLoading={isLoading} onCancel={() => navigate(`/recipients/${recipientId}`)} />
        </div>
      </div>
    </Layout>
  );
}
