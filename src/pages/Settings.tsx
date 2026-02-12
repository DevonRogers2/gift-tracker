import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Upload, AlertCircle } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { supabase, Recipient, GiftIdea } from '../lib/supabase';

export function Settings() {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const { session, user, signOut } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session?.user.id)
        .maybeSingle();

      if (data) {
        setProfile(data);
        setNotificationsEnabled(data.notifications_enabled);
      }
    } catch (error) {
      showToast((error as Error).message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleNotifications = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ notifications_enabled: !notificationsEnabled })
        .eq('id', session?.user.id);

      if (error) {
        showToast(error.message, 'error');
        return;
      }

      setNotificationsEnabled(!notificationsEnabled);
      showToast(
        `Email notifications ${!notificationsEnabled ? 'enabled' : 'disabled'}`,
        'success'
      );
    } catch (error) {
      showToast((error as Error).message, 'error');
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const { data: recipients } = await supabase
        .from('recipients')
        .select('*')
        .eq('user_id', session?.user.id);

      const { data: giftIdeas } = await supabase
        .from('gift_ideas')
        .select('*')
        .in('recipient_id', (recipients || []).map((r) => r.id));

      const exportData = {
        recipients: recipients || [],
        giftIdeas: giftIdeas || [],
        exportedAt: new Date().toISOString(),
      };

      let content: string;
      let filename: string;

      if (format === 'json') {
        content = JSON.stringify(exportData, null, 2);
        filename = `gift-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
      } else {
        let csv =
          'Name,Birthday,Relationship,Tags,Notes,Gift Idea,Gift Cost,Gift Purchased,Gift Notes\n';
        recipients?.forEach((recipient) => {
          const ideas = giftIdeas?.filter((g) => g.recipient_id === recipient.id) || [];
          if (ideas.length === 0) {
            csv += `"${recipient.name}","${recipient.birthday}","${recipient.relationship}","${recipient.tags}","${recipient.notes.replace(/"/g, '""')}","","","",""`;
          } else {
            ideas.forEach((idea, index) => {
              if (index === 0) {
                csv += `"${recipient.name}","${recipient.birthday}","${recipient.relationship}","${recipient.tags}","${recipient.notes.replace(/"/g, '""')}","${idea.title}","${idea.estimated_cost}","${idea.purchased}","${idea.notes.replace(/"/g, '""')}"\n`;
              } else {
                csv += `"","","","","","${idea.title}","${idea.estimated_cost}","${idea.purchased}","${idea.notes.replace(/"/g, '""')}"\n`;
              }
            });
          }
        });
        content = csv;
        filename = `gift-tracker-export-${new Date().toISOString().split('T')[0]}.csv`;
      }

      const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      showToast(`Data exported as ${format.toUpperCase()}`, 'success');
    } catch (error) {
      showToast((error as Error).message, 'error');
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);

    try {
      const content = await file.text();
      let data: any[] = [];

      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(content);
        data = parsed.recipients || [];
      } else if (file.name.endsWith('.csv')) {
        const lines = content.split('\n').slice(1);
        const recipients: Record<string, any> = {};

        lines.forEach((line) => {
          if (!line.trim()) return;
          const cells = line.match(/"([^"]*)"|[^,]+/g) || [];
          const clean = cells.map((c: string) => c.replace(/^"|"$/g, '').trim());

          if (clean[0]) {
            if (!recipients[clean[0]]) {
              recipients[clean[0]] = {
                name: clean[0],
                birthday: clean[1],
                relationship: clean[2],
                tags: clean[3],
                notes: clean[4],
              };
            }
          }
        });

        data = Object.values(recipients);
      }

      setImportPreview(data);
    } catch (error) {
      showToast('Invalid file format', 'error');
      setImportFile(null);
    }
  };

  const handleConfirmImport = async () => {
    if (importPreview.length === 0) {
      showToast('No valid recipients to import', 'error');
      return;
    }

    setIsImporting(true);

    try {
      let successCount = 0;

      for (const recipient of importPreview) {
        const { error } = await supabase.from('recipients').insert({
          user_id: session?.user.id,
          name: recipient.name,
          birthday: recipient.birthday,
          relationship: recipient.relationship || 'Other',
          tags: recipient.tags || '',
          notes: recipient.notes || '',
        });

        if (!error) {
          successCount++;
        }
      }

      showToast(`Successfully imported ${successCount} recipients`, 'success');
      setShowImportModal(false);
      setImportFile(null);
      setImportPreview([]);

      setTimeout(() => {
        navigate('/recipients');
      }, 1000);
    } catch (error) {
      showToast((error as Error).message, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  if (isLoading) {
    return (
      <Layout currentPage="/settings">
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentPage="/settings">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Account</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Email Address</label>
                <p className="text-lg font-medium text-gray-900">{user?.email}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Notifications</h2>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Birthday Notifications</label>
                <p className="text-sm text-gray-600 mt-1">
                  Receive email reminders 14 days, 7 days, and 1 day before birthdays
                </p>
              </div>
              <button
                onClick={handleToggleNotifications}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  notificationsEnabled
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                {notificationsEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Management</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Export Data</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Download your recipients and gift ideas in JSON or CSV format
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleExport('json')}
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export as JSON
                  </Button>
                  <Button
                    onClick={() => handleExport('csv')}
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export as CSV
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Import Data</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Import recipients from a JSON or CSV file
                </p>
                <Button
                  onClick={() => setShowImportModal(true)}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Import Data
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-red-50 rounded-lg shadow-sm p-6 border border-red-200">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-lg font-semibold text-red-900 mb-2">Danger Zone</h2>
                <p className="text-sm text-red-700 mb-4">
                  Signing out will end your current session. You can sign back in anytime with your email and password.
                </p>
                <Button
                  onClick={async () => {
                    await signOut();
                    showToast('Signed out successfully', 'success');
                    navigate('/login');
                  }}
                  variant="danger"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showImportModal}
        title="Import Data"
        onClose={() => {
          setShowImportModal(false);
          setImportFile(null);
          setImportPreview([]);
        }}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose a JSON or CSV file to import
            </label>
            <input
              type="file"
              accept=".json,.csv"
              onChange={handleImportFile}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {importPreview.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Preview ({importPreview.length} recipients)</h3>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {importPreview.slice(0, 5).map((recipient, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                    <p className="font-medium text-gray-900">{recipient.name}</p>
                    <p className="text-gray-600">{recipient.birthday} • {recipient.relationship}</p>
                  </div>
                ))}
                {importPreview.length > 5 && (
                  <p className="text-sm text-gray-600 p-2">
                    ... and {importPreview.length - 5} more recipients
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleConfirmImport}
              isLoading={isImporting}
              disabled={importPreview.length === 0}
              className="flex-1"
            >
              Import {importPreview.length} Recipient{importPreview.length !== 1 ? 's' : ''}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowImportModal(false);
                setImportFile(null);
                setImportPreview([]);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
