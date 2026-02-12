import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Plus } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { supabase, Recipient, GiftIdea } from '../lib/supabase';
import { formatDate, calculateAge, getNextBirthday } from '../utils/dates';

export function RecipientDetail() {
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [giftIdeas, setGiftIdeas] = useState<GiftIdea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddGiftIdea, setShowAddGiftIdea] = useState(false);
  const [giftTitle, setGiftTitle] = useState('');
  const [giftCost, setGiftCost] = useState('');
  const [giftNotes, setGiftNotes] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const { recipientId } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    fetchRecipient();
    fetchGiftIdeas();
  }, []);

  const fetchRecipient = async () => {
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
    }
  };

  const fetchGiftIdeas = async () => {
    try {
      const { data, error } = await supabase
        .from('gift_ideas')
        .select('*')
        .eq('recipient_id', recipientId)
        .order('created_at', { ascending: false });

      if (error) {
        showToast(error.message, 'error');
        return;
      }

      setGiftIdeas(data || []);
    } catch (error) {
      showToast((error as Error).message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddGiftIdea = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!giftTitle.trim()) {
      showToast('Gift title is required', 'error');
      return;
    }

    try {
      const { error } = await supabase.from('gift_ideas').insert({
        recipient_id: recipientId,
        title: giftTitle,
        estimated_cost: giftCost ? parseFloat(giftCost) : 0,
        notes: giftNotes,
        purchased: false,
      });

      if (error) {
        showToast(error.message, 'error');
        return;
      }

      setGiftTitle('');
      setGiftCost('');
      setGiftNotes('');
      setShowAddGiftIdea(false);
      showToast('Gift idea added successfully!', 'success');
      await fetchGiftIdeas();
    } catch (error) {
      showToast((error as Error).message, 'error');
    }
  };

  const handleTogglePurchased = async (idea: GiftIdea) => {
    try {
      const { error } = await supabase
        .from('gift_ideas')
        .update({ purchased: !idea.purchased })
        .eq('id', idea.id);

      if (error) {
        showToast(error.message, 'error');
        return;
      }

      await fetchGiftIdeas();
    } catch (error) {
      showToast((error as Error).message, 'error');
    }
  };

  const handleDeleteGiftIdea = async (id: string) => {
    try {
      const { error } = await supabase.from('gift_ideas').delete().eq('id', id);

      if (error) {
        showToast(error.message, 'error');
        return;
      }

      setDeleteConfirmId(null);
      showToast('Gift idea deleted', 'success');
      await fetchGiftIdeas();
    } catch (error) {
      showToast((error as Error).message, 'error');
    }
  };

  if (isLoading) {
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

  const nextBirthday = getNextBirthday(recipient.birthday);
  const age = calculateAge(recipient.birthday);
  const purchasedCount = giftIdeas.filter((g) => g.purchased).length;
  const totalCost = giftIdeas.filter((g) => !g.purchased).reduce((sum, g) => sum + (g.estimated_cost || 0), 0);

  return (
    <Layout currentPage="/recipients">
      <div className="space-y-6">
        <button
          onClick={() => navigate('/recipients')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Recipients
        </button>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{recipient.name}</h1>
                  <p className="text-gray-600 mt-2">
                    Birthday: {formatDate(recipient.birthday)} • Age: {age} • {recipient.relationship}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/recipients/${recipientId}/edit`)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId('recipient')}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {recipient.tags && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {recipient.tags.split(',').map((tag) => (
                      <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {recipient.notes && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{recipient.notes}</p>
                </div>
              )}

              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Gift Ideas</h2>
                  <Button onClick={() => setShowAddGiftIdea(true)} size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Idea
                  </Button>
                </div>

                {giftIdeas.length === 0 ? (
                  <p className="text-gray-600 py-8">No gift ideas yet. Add one to get started!</p>
                ) : (
                  <div className="space-y-3">
                    {giftIdeas.map((idea) => (
                      <div
                        key={idea.id}
                        className={`flex items-start gap-4 p-4 rounded-lg border ${
                          idea.purchased
                            ? 'bg-gray-50 border-gray-200 opacity-75'
                            : 'bg-white border-gray-200 hover:border-blue-300'
                        } transition`}
                      >
                        <input
                          type="checkbox"
                          checked={idea.purchased}
                          onChange={() => handleTogglePurchased(idea)}
                          className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        />
                        <div className="flex-1">
                          <h3
                            className={`font-medium ${
                              idea.purchased
                                ? 'line-through text-gray-500'
                                : 'text-gray-900'
                            }`}
                          >
                            {idea.title}
                          </h3>
                          {idea.estimated_cost > 0 && (
                            <p className="text-sm text-gray-600">
                              Estimated cost: ${idea.estimated_cost.toFixed(2)}
                            </p>
                          )}
                          {idea.notes && <p className="text-sm text-gray-600 mt-1">{idea.notes}</p>}
                        </div>
                        <button
                          onClick={() => setDeleteConfirmId(idea.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Birthday Info</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Next Birthday</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {nextBirthday.daysUntil === 0 ? 'Today!' : `${nextBirthday.daysUntil} days`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(nextBirthday.date)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Gift Summary</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Total Ideas</p>
                  <p className="text-lg font-semibold text-gray-900">{giftIdeas.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Purchased</p>
                  <p className="text-lg font-semibold text-green-600">{purchasedCount}</p>
                </div>
                {totalCost > 0 && (
                  <div>
                    <p className="text-sm text-gray-600">Pending Cost</p>
                    <p className="text-lg font-semibold text-blue-600">${totalCost.toFixed(2)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showAddGiftIdea} title="Add Gift Idea" onClose={() => setShowAddGiftIdea(false)} size="md">
        <form onSubmit={handleAddGiftIdea} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gift Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={giftTitle}
              onChange={(e) => setGiftTitle(e.target.value)}
              placeholder="What's the gift idea?"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimated Cost <span className="text-gray-500 text-xs">(optional)</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={giftCost}
              onChange={(e) => setGiftCost(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={giftNotes}
              onChange={(e) => setGiftNotes(e.target.value)}
              placeholder="Add any notes about this gift"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              Add Gift Idea
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowAddGiftIdea(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Deletion</h3>
            <p className="text-gray-600 mb-6">
              {deleteConfirmId === 'recipient'
                ? 'Are you sure you want to delete this recipient? This will also delete all associated gift ideas.'
                : 'Are you sure you want to delete this gift idea?'}
            </p>
            <div className="flex gap-3">
              <Button
                variant="danger"
                onClick={() =>
                  deleteConfirmId === 'recipient'
                    ? (() => {
                        supabase.from('recipients').delete().eq('id', recipientId).then(() => {
                          showToast('Recipient deleted', 'success');
                          navigate('/recipients');
                        });
                      })()
                    : handleDeleteGiftIdea(deleteConfirmId)
                }
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
