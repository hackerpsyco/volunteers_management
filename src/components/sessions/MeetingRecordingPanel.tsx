import { useState, useEffect } from 'react';
import { Play, Square, Download, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Recording {
  id: string;
  recording_name: string;
  recording_url: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
  status: string;
  coordinator_id: string;
}

interface MeetingRecordingPanelProps {
  sessionId: string;
  coordinatorId: string;
  meetingLink: string;
}

export function MeetingRecordingPanel({
  sessionId,
  coordinatorId,
  meetingLink,
}: MeetingRecordingPanelProps) {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentRecordingId, setCurrentRecordingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRecordings();
  }, [sessionId]);

  const fetchRecordings = async () => {
    try {
      const { data, error } = await supabase
        .from('session_recordings')
        .select('*')
        .eq('session_id', sessionId)
        .order('start_time', { ascending: false });

      if (error) throw error;
      setRecordings(data || []);

      // Check if any recording is currently active
      const activeRecording = data?.find((r) => r.status === 'recording');
      if (activeRecording) {
        setIsRecording(true);
        setCurrentRecordingId(activeRecording.id);
      }
    } catch (error) {
      console.error('Error fetching recordings:', error);
    }
  };

  const handleStartRecording = async () => {
    try {
      setLoading(true);

      // Create recording entry in database
      const { data, error } = await supabase
        .from('session_recordings')
        .insert([
          {
            session_id: sessionId,
            coordinator_id: coordinatorId,
            recording_name: `Recording - ${new Date().toLocaleString()}`,
            start_time: new Date().toISOString(),
            status: 'recording',
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setCurrentRecordingId(data.id);
      setIsRecording(true);
      toast.success('Recording started');

      // Open meeting link in new tab
      if (meetingLink) {
        window.open(meetingLink, '_blank');
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording');
    } finally {
      setLoading(false);
    }
  };

  const handleStopRecording = async () => {
    if (!currentRecordingId) return;

    try {
      setLoading(true);

      const startTime = recordings.find((r) => r.id === currentRecordingId)?.start_time;
      const endTime = new Date().toISOString();
      const durationSeconds = startTime
        ? Math.floor(
            (new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000
          )
        : 0;

      const { error } = await supabase
        .from('session_recordings')
        .update({
          end_time: endTime,
          duration_seconds: durationSeconds,
          status: 'completed',
        })
        .eq('id', currentRecordingId);

      if (error) throw error;

      setIsRecording(false);
      setCurrentRecordingId(null);
      toast.success('Recording stopped and saved');
      fetchRecordings();
    } catch (error) {
      console.error('Error stopping recording:', error);
      toast.error('Failed to stop recording');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecording = async (recordingId: string) => {
    if (!confirm('Are you sure you want to delete this recording?')) return;

    try {
      const { error } = await supabase
        .from('session_recordings')
        .delete()
        .eq('id', recordingId);

      if (error) throw error;

      toast.success('Recording deleted');
      fetchRecordings();
    } catch (error) {
      console.error('Error deleting recording:', error);
      toast.error('Failed to delete recording');
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5 text-primary" />
          Meeting Recording
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recording Controls */}
        <div className="flex gap-2">
          {!isRecording ? (
            <Button
              onClick={handleStartRecording}
              disabled={loading}
              className="gap-2 flex-1"
            >
              <Play className="h-4 w-4" />
              {loading ? 'Starting...' : 'Start Recording'}
            </Button>
          ) : (
            <Button
              onClick={handleStopRecording}
              disabled={loading}
              variant="destructive"
              className="gap-2 flex-1"
            >
              <Square className="h-4 w-4" />
              {loading ? 'Stopping...' : 'Stop Recording'}
            </Button>
          )}
        </div>

        {/* Active Recording Indicator */}
        {isRecording && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-red-700">Recording in progress...</span>
          </div>
        )}

        {/* Recordings List */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Recordings ({recordings.length})</h3>
          {recordings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recordings yet</p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {recordings.map((recording) => (
                <div
                  key={recording.id}
                  className="bg-muted/50 rounded-lg p-3 flex items-start justify-between gap-2 border border-border"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {recording.recording_name}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(recording.start_time).toLocaleString()}</span>
                    </div>
                    {recording.duration_seconds && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Duration: {formatDuration(recording.duration_seconds)}
                      </p>
                    )}
                    <Badge variant="outline" className="mt-2 text-xs">
                      {recording.status}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    {recording.recording_url && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(recording.recording_url, '_blank')}
                        className="h-8 w-8 p-0"
                        title="Download recording"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteRecording(recording.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      title="Delete recording"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
