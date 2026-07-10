import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FeedbackStatusWidgetProps {
  startDate?: Date | null;
  endDate?: Date | null;
  academicYear?: string;
  sessionType?: string;
}

export function FeedbackStatusWidget({ startDate, endDate, academicYear, sessionType }: FeedbackStatusWidgetProps) {
  const [stats, setStats] = useState({
    totalCompleted: 0,
    facilitatorDone: 0,
    coordinatorDone: 0,
    supervisorDone: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeedbackStatus() {
      setLoading(true);
      try {
        let query = supabase
          .from('sessions')
          .select('status, session_date, session_type, facilitator_feedback_status, coordinator_feedback_status, supervisor_feedback_status')
          .in('status', ['completed', 'Completed']);
          
        if (startDate) {
          query = query.gte('session_date', startDate.toISOString().split('T')[0]);
        }
        if (endDate) {
          query = query.lte('session_date', endDate.toISOString().split('T')[0]);
        }
        if (sessionType && sessionType !== 'all') {
          query = query.eq('session_type', sessionType);
        }

        const { data, error } = await query;
        
        if (error) throw error;

        let totalCompleted = 0;
        let facilitatorDone = 0;
        let coordinatorDone = 0;
        let supervisorDone = 0;

        (data || []).forEach(session => {
          totalCompleted++;
          
          if (session.facilitator_feedback_status?.toLowerCase() === 'done') {
            facilitatorDone++;
          }
          if (session.coordinator_feedback_status?.toLowerCase() === 'done') {
            coordinatorDone++;
          }
          if (session.supervisor_feedback_status?.toLowerCase() === 'done') {
            supervisorDone++;
          }
        });

        setStats({
          totalCompleted,
          facilitatorDone,
          coordinatorDone,
          supervisorDone
        });
      } catch (error) {
        console.error('Error fetching feedback stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchFeedbackStatus();
  }, [startDate, endDate, academicYear, sessionType]);

  const items = [
    { label: 'Facilitator', done: stats.facilitatorDone, color: 'bg-blue-50', textColor: 'text-blue-700' },
    { label: 'Coordinator', done: stats.coordinatorDone, color: 'bg-purple-50', textColor: 'text-purple-700' },
    { label: 'Supervisor', done: stats.supervisorDone, color: 'bg-green-50', textColor: 'text-green-700' }
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-3 md:p-4">
      <h2 className="text-base md:text-lg font-bold text-foreground mb-3">Feedback Completion</h2>
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className={`${item.color} rounded-lg p-2 md:p-3 flex justify-between items-center`}>
              <span className={`font-medium text-xs md:text-sm ${item.textColor}`}>{item.label}</span>
              <span className={`font-bold text-base md:text-lg ${item.textColor}`}>
                {item.done} / {stats.totalCompleted}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
