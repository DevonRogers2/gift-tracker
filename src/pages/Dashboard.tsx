import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Users, Calendar, TrendingUp } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { supabase, Recipient } from '../lib/supabase';
import { getUpcomingBirthdays, formatDate } from '../utils/dates';

export function Dashboard() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<any[]>([]);
  const [giftIdeaCounts, setGiftIdeaCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { session, user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: recipientsData, error: recipientsError } = await supabase
        .from('recipients')
        .select('*')
        .eq('user_id', session?.user.id);

      if (recipientsError) {
        showToast(recipientsError.message, 'error');
        return;
      }

      setRecipients(recipientsData || []);

      const giftIdeas = await supabase
        .from('gift_ideas')
        .select('recipient_id')
        .in('recipient_id', (recipientsData || []).map((r) => r.id));

      if (giftIdeas.data) {
        const counts: Record<string, number> = {};
        giftIdeas.data.forEach((idea: any) => {
          counts[idea.recipient_id] = (counts[idea.recipient_id] || 0) + 1;
        });
        setGiftIdeaCounts(counts);
      }

      const upcoming = getUpcomingBirthdays(recipientsData || []);
      setUpcomingBirthdays(upcoming);
    } catch (error) {
      showToast((error as Error).message, 'error');
    } finally {
      setIsLoading(false);
    }
  };


  const birthdaysThisMonth = recipients.filter((r) => {
    const today = new Date();
    const birth = new Date(r.birthday);
    return birth.getMonth() === today.getMonth();
  }).length;

  return (
    <Layout currentPage="/dashboard">
      <div className="space-y-8">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">
              Welcome back, {user?.email?.split('@')[0]}!
            </h1>
            <p className="text-text-secondary mt-2">Here's an overview of your gift tracking</p>
          </div>
          <Button onClick={() => navigate('/recipients/new')}>Add Recipient</Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-bg-primary rounded-lg shadow-sm p-6 border border-border-color">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-secondary text-sm font-medium">Total Recipients</p>
                    <p className="text-3xl font-bold text-text-primary mt-2">{recipients.length}</p>
                  </div>
                  <Users className="w-10 h-10 text-accent opacity-20" />
                </div>
              </div>

              <div className="bg-bg-primary rounded-lg shadow-sm p-6 border border-border-color">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-secondary text-sm font-medium">Birthdays This Month</p>
                    <p className="text-3xl font-bold text-text-primary mt-2">{birthdaysThisMonth}</p>
                  </div>
                  <Calendar className="w-10 h-10 text-orange-600 opacity-20" />
                </div>
              </div>

              <div className="bg-bg-primary rounded-lg shadow-sm p-6 border border-border-color">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-secondary text-sm font-medium">Upcoming (60 days)</p>
                    <p className="text-3xl font-bold text-text-primary mt-2">{upcomingBirthdays.length}</p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-green-600 opacity-20" />
                </div>
              </div>

              <div className="bg-bg-primary rounded-lg shadow-sm p-6 border border-border-color">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-secondary text-sm font-medium">Total Gift Ideas</p>
                    <p className="text-3xl font-bold text-text-primary mt-2">
                      {Object.values(giftIdeaCounts).reduce((a, b) => a + b, 0)}
                    </p>
                  </div>
                  <Gift className="w-10 h-10 text-red-600 opacity-20" />
                </div>
              </div>
            </div>

            <div className="bg-bg-primary rounded-lg shadow-sm p-8 border border-border-color">
              <h2 className="text-2xl font-bold text-text-primary mb-6">Upcoming Birthdays (Next 60 Days)</h2>

              {upcomingBirthdays.length === 0 ? (
                <p className="text-text-secondary text-center py-8">No upcoming birthdays in the next 60 days</p>
              ) : (
                <div className="space-y-3">
                  {upcomingBirthdays.map((recipient) => (
                    <div
                      key={recipient.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border-color hover:border-accent hover:bg-bg-secondary transition cursor-pointer"
                      onClick={() => navigate(`/recipients/${recipient.id}`)}
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-text-primary">{recipient.name}</h3>
                        <p className="text-sm text-text-secondary">
                          Birthday: {formatDate(recipient.birthday)} • {recipient.relationship}
                        </p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm text-text-secondary">Days Until</p>
                          <p className="text-2xl font-bold text-accent">{recipient.daysUntil}</p>
                        </div>
                        <div className="text-center">
                          <span className="inline-block px-3 py-1 bg-bg-tertiary text-text-primary rounded-full text-sm font-medium">
                            {giftIdeaCounts[recipient.id] || 0} ideas
                          </span>
                        </div>
                        <div
                          className={`px-4 py-2 rounded-lg font-medium text-white ${
                            recipient.daysUntil <= 7
                              ? 'bg-red-600'
                              : recipient.daysUntil <= 14
                                ? 'bg-orange-600'
                                : 'bg-green-600'
                          }`}
                        >
                          {recipient.daysUntil === 0 ? 'Today!' : `${recipient.daysUntil}d`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
