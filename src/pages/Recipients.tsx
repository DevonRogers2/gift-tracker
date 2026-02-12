import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, Trash2, Edit, Eye } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { supabase, Recipient, GiftIdea } from '../lib/supabase';
import { formatDate } from '../utils/dates';

type SortBy = 'name' | 'birthday' | 'relationship' | 'giftIdeas';

export function Recipients() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [giftIdeaCounts, setGiftIdeaCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const { session } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    fetchRecipients();
  }, []);

  const fetchRecipients = async () => {
    try {
      const { data, error } = await supabase.from('recipients').select('*').eq('user_id', session?.user.id);

      if (error) {
        showToast(error.message, 'error');
        return;
      }

      setRecipients(data || []);

      const giftIdeas = await supabase
        .from('gift_ideas')
        .select('recipient_id')
        .in('recipient_id', (data || []).map((r) => r.id));

      if (giftIdeas.data) {
        const counts: Record<string, number> = {};
        giftIdeas.data.forEach((idea: any) => {
          counts[idea.recipient_id] = (counts[idea.recipient_id] || 0) + 1;
        });
        setGiftIdeaCounts(counts);
      }
    } catch (error) {
      showToast((error as Error).message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRecipients = recipients
    .filter(
      (r) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.relationship.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.tags.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'birthday':
          return a.birthday.localeCompare(b.birthday);
        case 'relationship':
          return a.relationship.localeCompare(b.relationship);
        case 'giftIdeas':
          return (giftIdeaCounts[b.id] || 0) - (giftIdeaCounts[a.id] || 0);
        default:
          return 0;
      }
    });

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('recipients').delete().eq('id', id).eq('user_id', session?.user.id);

      if (error) {
        showToast(error.message, 'error');
        return;
      }

      setRecipients(recipients.filter((r) => r.id !== id));
      setDeleteConfirmId(null);
      showToast('Recipient deleted successfully', 'success');
    } catch (error) {
      showToast((error as Error).message, 'error');
    }
  };

  return (
    <Layout currentPage="/recipients">
      <div className="space-y-6">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Recipients</h1>
            <p className="text-gray-600 mt-2">Manage your gift recipients</p>
          </div>
          <Button onClick={() => navigate('/recipients/new')}>Add Recipient</Button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, relationship, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-10"
              >
                <option value="name">Sort by Name</option>
                <option value="birthday">Sort by Birthday</option>
                <option value="relationship">Sort by Relationship</option>
                <option value="giftIdeas">Sort by Gift Ideas</option>
              </select>
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 pointer-events-none text-gray-400" />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredRecipients.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">
                {recipients.length === 0 ? 'No recipients yet. Add your first recipient!' : 'No recipients match your search.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Name</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Birthday</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Relationship</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Tags</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-700">Ideas</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecipients.map((recipient) => (
                    <tr key={recipient.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{recipient.name}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(recipient.birthday)}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                          {recipient.relationship}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-sm">
                        {recipient.tags ? recipient.tags.split(',').slice(0, 2).join(', ') : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                          {giftIdeaCounts[recipient.id] || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => navigate(`/recipients/${recipient.id}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/recipients/${recipient.id}/edit`)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(recipient.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Deletion</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this recipient? This will also delete all associated gift ideas.
            </p>
            <div className="flex gap-3">
              <Button
                variant="danger"
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1"
              >
                Delete
              </Button>
              <Button variant="secondary" onClick={() => setDeleteConfirmId(null)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
