import { getAccessToken } from './firebase.ts';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  subject?: string;
  from?: string;
  date?: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  location?: string;
  htmlLink?: string;
}

export interface ContactPerson {
  resourceName: string;
  displayName: string;
  email?: string;
  phoneNumber?: string;
}

// 1. Google Drive
export async function listDriveFiles(): Promise<DriveFile[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const res = await fetch(
    'https://www.googleapis.com/drive/v3/files?pageSize=20&fields=files(id,name,mimeType,modifiedTime,size,webViewLink)',
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Drive API error ${res.status}`);
  }

  const data = await res.json();
  return data.files || [];
}

// 2. Gmail
export async function listGmailMessages(): Promise<GmailMessage[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const res = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10',
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gmail API error ${res.status}`);
  }

  const data = await res.json();
  if (!data.messages || data.messages.length === 0) return [];

  const detailedMessages: GmailMessage[] = [];
  for (const m of data.messages.slice(0, 8)) {
    try {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (msgRes.ok) {
        const msgData = await msgRes.json();
        const headers = msgData.payload?.headers || [];
        const subject = headers.find((h: any) => h.name === 'Subject')?.value;
        const from = headers.find((h: any) => h.name === 'From')?.value;
        const date = headers.find((h: any) => h.name === 'Date')?.value;
        detailedMessages.push({
          id: msgData.id,
          threadId: msgData.threadId,
          snippet: msgData.snippet || '',
          subject: subject || '(No Subject)',
          from: from || 'Unknown',
          date: date || '',
        });
      }
    } catch {
      // Continue
    }
  }

  return detailedMessages;
}

export async function sendGmailMessage(to: string, subject: string, body: string): Promise<any> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const messageParts = [
    `To: ${to}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${utf8Subject}`,
    '',
    body,
  ];
  const message = messageParts.join('\r\n');
  const encodedMessage = btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encodedMessage }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to send email: ${res.status}`);
  }

  return await res.json();
}

// 3. Calendar
export async function listCalendarEvents(): Promise<CalendarEvent[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const now = new Date().toISOString();
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
      now
    )}&maxResults=15&singleEvents=true&orderBy=startTime`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Calendar API error ${res.status}`);
  }

  const data = await res.json();
  return data.items || [];
}

export async function createCalendarEvent(event: {
  summary: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  location?: string;
}): Promise<any> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: event.summary,
      description: event.description,
      location: event.location,
      start: { dateTime: event.startDateTime },
      end: { dateTime: event.endDateTime },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create calendar event`);
  }

  return await res.json();
}

// 4. Tasks
export async function listGoogleTasks(): Promise<any[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const res = await fetch(
    'https://tasks.googleapis.com/tasks/v1/lists/@default/tasks?maxResults=20',
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Tasks API error ${res.status}`);
  }

  const data = await res.json();
  return data.items || [];
}

// 5. Contacts
export async function listGoogleContacts(): Promise<ContactPerson[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const res = await fetch(
    'https://people.googleapis.com/v1/people/me/connections?pageSize=20&personFields=names,emailAddresses,phoneNumbers',
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Contacts API error ${res.status}`);
  }

  const data = await res.json();
  const connections = data.connections || [];
  return connections.map((c: any) => ({
    resourceName: c.resourceName,
    displayName: c.names?.[0]?.displayName || 'Unknown Contact',
    email: c.emailAddresses?.[0]?.value || '',
    phoneNumber: c.phoneNumbers?.[0]?.value || '',
  }));
}
