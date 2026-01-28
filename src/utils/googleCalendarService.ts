// Google Calendar API Service
// This service handles integration with Google Calendar API

const GOOGLE_CALENDAR_API_KEY = import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

interface CalendarEvent {
  summary: string;
  description: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
}

export const googleCalendarService = {
  /**
   * Create a Google Calendar event
   */
  async createEvent(
    accessToken: string,
    event: CalendarEvent,
    calendarId: string = 'primary'
  ): Promise<string> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create calendar event: ${response.statusText}`);
      }

      const data = await response.json();
      return data.id; // Return Google Calendar event ID
    } catch (error) {
      console.error('Error creating Google Calendar event:', error);
      throw error;
    }
  },

  /**
   * Update a Google Calendar event
   */
  async updateEvent(
    accessToken: string,
    eventId: string,
    event: CalendarEvent,
    calendarId: string = 'primary'
  ): Promise<void> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update calendar event: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error updating Google Calendar event:', error);
      throw error;
    }
  },

  /**
   * Delete a Google Calendar event
   */
  async deleteEvent(
    accessToken: string,
    eventId: string,
    calendarId: string = 'primary'
  ): Promise<void> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete calendar event: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting Google Calendar event:', error);
      throw error;
    }
  },

  /**
   * Format session data for Google Calendar event
   */
  formatSessionAsCalendarEvent(
    session: any,
    facilitatorName?: string,
    volunteerName?: string
  ): CalendarEvent {
    const startDateTime = new Date(`${session.session_date}T${session.session_time}`);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour duration

    const attendees = [];
    if (facilitatorName) {
      attendees.push({ displayName: facilitatorName });
    }
    if (volunteerName) {
      attendees.push({ displayName: volunteerName });
    }

    return {
      summary: `${session.topics_covered || session.title}`,
      description: `
Session Details:
- Category: ${session.content_category || 'N/A'}
- Module: ${session.module_name || 'N/A'}
- Topic: ${session.topics_covered || 'N/A'}
- Type: ${session.session_type === 'guest_teacher' ? 'Guest Teacher' : 'Guest Speaker'}
- Status: ${session.status}
- Facilitator: ${facilitatorName || 'N/A'}
- Volunteer: ${volunteerName || 'N/A'}
${session.videos ? `- Videos: ${session.videos}` : ''}
${session.quiz_content_ppt ? `- Quiz/PPT: ${session.quiz_content_ppt}` : ''}
      `.trim(),
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'UTC',
      },
      attendees: attendees.length > 0 ? attendees : undefined,
    };
  },
};
