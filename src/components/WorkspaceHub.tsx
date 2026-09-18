import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Mail,
  Calendar as CalendarIcon,
  FileText,
  Table,
  Presentation,
  Bookmark,
  CheckSquare,
  FormInput,
  Video,
  Users,
  MessageCircle,
  Plus,
  Search,
  ExternalLink,
  Send,
  Trash2,
  Edit3,
  Sparkles,
  Loader2,
  Check,
  Clock,
  Pin,
  RefreshCw,
  Folder,
} from 'lucide-react';
import {
  listDriveFiles,
  listGmailMessages,
  sendGmailMessage,
  listCalendarEvents,
  createCalendarEvent,
  listGoogleTasks,
  listGoogleContacts,
  DriveFile,
  GmailMessage,
  CalendarEvent,
  ContactPerson,
} from '../lib/workspace.ts';
import { ConfirmationModal } from './ConfirmationModal.tsx';
import { saveWorkspaceItem, loadWorkspaceItems, deleteWorkspaceItem, WorkspaceItemData } from '../lib/firebase.ts';

interface WorkspaceHubProps {
  userId?: string;
  hasOAuthToken: boolean;
  onConnectOAuth: () => void;
}

export const WorkspaceHub: React.FC<WorkspaceHubProps> = ({
  userId,
  hasOAuthToken,
  onConnectOAuth,
}) => {
  const [activeApp, setActiveApp] = useState<
    | 'drive'
    | 'gmail'
    | 'calendar'
    | 'docs'
    | 'sheets'
    | 'slides'
    | 'keep'
    | 'tasks'
    | 'forms'
    | 'meet'
    | 'contacts'
    | 'chat'
  >('keep');

  // Confirmation Modal State (MANDATORY for mutating/destructive operations)
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    isDestructive: false,
    onConfirm: () => {},
  });

  const openConfirmation = (config: {
    title: string;
    message: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }) => {
    setModalConfig({ ...config, isOpen: true });
  };

  const closeConfirmation = () => {
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  // Google Drive State
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveSearch, setDriveSearch] = useState('');

  // Gmail State
  const [gmailMessages, setGmailMessages] = useState<GmailMessage[]>([]);
  const [gmailLoading, setGmailLoading] = useState(false);
  const [mailTo, setMailTo] = useState('');
  const [mailSubject, setMailSubject] = useState('');
  const [mailBody, setMailBody] = useState('');
  const [isAiDrafting, setIsAiDrafting] = useState(false);

  // Calendar State
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [eventSummary, setEventSummary] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 10));
  const [eventLocation, setEventLocation] = useState('');

  // Keep Notes State
  const [notes, setNotes] = useState<
    Array<{ id: string; title: string; content: string; color: string; pinned: boolean }>
  >([
    {
      id: 'k-1',
      title: 'Multimodal AI Launch Checklist',
      content: '1. Verify Gemini 3.1 Flash-Image aspect ratios\n2. Test Lyria Pro streaming\n3. Review Firestore rules and OAuth scopes',
      color: 'bg-amber-950/40 border-amber-800/60',
      pinned: true,
    },
    {
      id: 'k-2',
      title: 'Design System Principles',
      content: 'Use high-contrast neutrals, rounded-xl boundaries, zero nested cards, and mathematical 1.25 typography ratio.',
      color: 'bg-blue-950/40 border-blue-800/60',
      pinned: false,
    },
  ]);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteColor, setNewNoteColor] = useState('bg-neutral-900 border-neutral-800');

  // Tasks State
  const [tasks, setTasks] = useState<Array<{ id: string; title: string; completed: boolean; dueDate: string }>>([
    { id: 't-1', title: 'Complete Gemini 3.1 Pro Thinking mode integration', completed: true, dueDate: 'Today' },
    { id: 't-2', title: 'Deploy Firestore security rules and test collection', completed: true, dueDate: 'Today' },
    { id: 't-3', title: 'Validate Google Drive and Gmail OAuth token workflow', completed: false, dueDate: 'Tomorrow' },
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Docs State
  const [docTitle, setDocTitle] = useState('AI Strategy & Workspace Blueprint 2026');
  const [docBody, setDocBody] = useState(
    'Executive Summary:\nThis document synthesizes real-time multimodal intelligence combining Google Gemini, Lyria, Veo 3, and native Google Workspace productivity APIs.\n\nKey Strategic Pillars:\n1. Accelerated Workflow Orchestration\n2. Zero-Latency Cloud Data Persistence\n3. Integrated Autonomous Agents'
  );
  const [docAiLoading, setDocAiLoading] = useState(false);

  // Sheets State
  const [sheetData, setSheetData] = useState<string[][]>([
    ['Metric', 'Target Q1', 'Achieved', 'Status'],
    ['Gemini API Latency (Flash-Lite)', '< 300ms', '210ms', 'Optimal'],
    ['Image Aspect Ratio Accuracy', '100%', '100%', 'Verified'],
    ['Workspace OAuth Scopes', '11 Scopes', 'Active', 'Connected'],
    ['Lyria Music Streaming', '30s Clip', 'Working', 'Active'],
  ]);
  const [sheetAiPrompt, setSheetAiPrompt] = useState('Calculate average metrics and suggest next growth projection');

  // Slides State
  const [presentationTopic, setPresentationTopic] = useState('Next-Generation Generative AI in Google Workspace');
  const [slides, setSlides] = useState<Array<{ slideNumber: number; title: string; bullets: string[] }>>([
    {
      slideNumber: 1,
      title: 'Next-Generation Generative AI in Workspace',
      bullets: ['Unified Gemini multimodal intelligence', 'Real-time cross-app integration', 'Cloud Firestore persistence'],
    },
    {
      slideNumber: 2,
      title: 'Creative Capabilities: Lyria & Veo 3',
      bullets: ['Original musical scoring on demand', 'Cinematic 16:9 and 9:16 video generation', 'Sub-second image synthesis'],
    },
    {
      slideNumber: 3,
      title: 'Productivity Acceleration',
      bullets: ['Autonomous email drafts & scheduling', 'Grounded search and geospatial intelligence', 'Direct document rewriting'],
    },
  ]);
  const [slidesLoading, setSlidesLoading] = useState(false);

  // Forms State
  const [formTitle, setFormTitle] = useState('Enterprise AI & Multimodal Feedback Survey');
  const [formQuestions, setFormQuestions] = useState<Array<{ id: string; text: string; type: 'text' | 'rating' }>>([
    { id: 'q1', text: 'Which Gemini model best meets your speed requirements?', type: 'text' },
    { id: 'q2', text: 'Rate the visual fidelity of Gemini 3 Pro Image generation (1-5):', type: 'rating' },
    { id: 'q3', text: 'What workspace integrations do you use most daily?', type: 'text' },
  ]);
  const [newQuestionText, setNewQuestionText] = useState('');

  // Contacts State
  const [contacts, setContacts] = useState<ContactPerson[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);

  // Chat State
  const [chatChannels, setChatChannels] = useState(['# general', '# engineering', '# ai-creative', '# workspace-sync']);
  const [activeChannel, setActiveChannel] = useState('# ai-creative');
  const [chatThread, setChatThread] = useState<Array<{ sender: string; text: string; time: string }>>([
    { sender: 'AI Director', text: 'Lyria model and Veo 3 have been initialized on server routes.', time: '10:02 AM' },
    { sender: 'You', text: 'Confirmed. Firestore rules deployed and OAuth client active.', time: '10:04 AM' },
  ]);
  const [channelInput, setChannelInput] = useState('');

  // Fetch Live Google Workspace data when token is present
  useEffect(() => {
    if (hasOAuthToken) {
      loadDrive();
      loadGmail();
      loadCalendar();
      loadContacts();
    }
  }, [hasOAuthToken]);

  // Load Firestore saved items on mount
  useEffect(() => {
    if (userId) {
      loadWorkspaceItems(userId).then((items) => {
        const keepItems = items.filter((i) => i.type === 'note');
        if (keepItems.length > 0) {
          setNotes(
            keepItems.map((k) => ({
              id: k.id,
              title: k.title,
              content: k.content,
              color: 'bg-neutral-900 border-neutral-800',
              pinned: k.status === 'pinned',
            }))
          );
        }
      });
    }
  }, [userId]);

  const loadDrive = async () => {
    setDriveLoading(true);
    try {
      const files = await listDriveFiles();
      setDriveFiles(files);
    } catch (e: any) {
      console.warn('Drive load issue:', e);
    } finally {
      setDriveLoading(false);
    }
  };

  const loadGmail = async () => {
    setGmailLoading(true);
    try {
      const msgs = await listGmailMessages();
      setGmailMessages(msgs);
    } catch (e: any) {
      console.warn('Gmail load issue:', e);
    } finally {
      setGmailLoading(false);
    }
  };

  const loadCalendar = async () => {
    setCalendarLoading(true);
    try {
      const evts = await listCalendarEvents();
      setCalendarEvents(evts);
    } catch (e: any) {
      console.warn('Calendar load issue:', e);
    } finally {
      setCalendarLoading(false);
    }
  };

  const loadContacts = async () => {
    setContactsLoading(true);
    try {
      const list = await listGoogleContacts();
      setContacts(list);
    } catch (e: any) {
      console.warn('Contacts load issue:', e);
    } finally {
      setContactsLoading(false);
    }
  };

  // AI Assistant for Gmail Composer
  const handleAiDraftEmail = async () => {
    if (!mailSubject && !mailTo) {
      alert('Please enter at least a recipient or subject to draft with AI.');
      return;
    }
    setIsAiDrafting(true);
    try {
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Draft a professional, concise, polished email regarding "${mailSubject || 'Project Update'}" to ${mailTo || 'colleague'}.`,
          model: 'gemini-3.5-flash',
        }),
      });
      const data = await res.json();
      if (data.text) {
        setMailBody(data.text);
      }
    } catch (err: any) {
      alert('AI draft error: ' + err.message);
    } finally {
      setIsAiDrafting(false);
    }
  };

  // Send Email with User Confirmation (MANDATORY per Workspace Skill)
  const handleConfirmSendEmail = () => {
    if (!mailTo || !mailSubject || !mailBody) {
      alert('Please complete recipient, subject, and body before sending.');
      return;
    }

    openConfirmation({
      title: 'Confirm Send Email',
      message: `Are you sure you want to send this email to ${mailTo} with subject "${mailSubject}"? This will deliver the message directly via your Gmail account.`,
      confirmLabel: 'Send via Gmail',
      isDestructive: false,
      onConfirm: async () => {
        closeConfirmation();
        try {
          await sendGmailMessage(mailTo, mailSubject, mailBody);
          alert('Email successfully sent through Gmail!');
          setMailTo('');
          setMailSubject('');
          setMailBody('');
          loadGmail();
        } catch (err: any) {
          alert('Failed to send email: ' + err.message);
        }
      },
    });
  };

  // Create Calendar Event with User Confirmation (MANDATORY per Workspace Skill)
  const handleConfirmCreateEvent = () => {
    if (!eventSummary || !eventDate) {
      alert('Please provide event title and date.');
      return;
    }

    openConfirmation({
      title: 'Schedule Calendar Event',
      message: `Create event "${eventSummary}" scheduled on ${eventDate} ${eventLocation ? `at ${eventLocation}` : ''}? This will be added to your Google Calendar.`,
      confirmLabel: 'Add to Calendar',
      isDestructive: false,
      onConfirm: async () => {
        closeConfirmation();
        try {
          const startDateTime = new Date(`${eventDate}T10:00:00`).toISOString();
          const endDateTime = new Date(`${eventDate}T11:00:00`).toISOString();
          await createCalendarEvent({
            summary: eventSummary,
            location: eventLocation,
            startDateTime,
            endDateTime,
          });
          alert('Event successfully created on Google Calendar!');
          setEventSummary('');
          setEventLocation('');
          loadCalendar();
        } catch (err: any) {
          alert('Failed to schedule event: ' + err.message);
        }
      },
    });
  };

  // AI Polish for Docs
  const handleAiPolishDoc = async (action: 'summarize' | 'expand' | 'rewrite') => {
    setDocAiLoading(true);
    try {
      const prompts = {
        summarize: `Provide an executive bullet summary of the following document:\n\n${docBody}`,
        expand: `Expand the following document with detailed strategic milestones, KPIs, and architectural safeguards:\n\n${docBody}`,
        rewrite: `Rewrite the following document in an elegant, punchy, professional leadership style:\n\n${docBody}`,
      };
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompts[action],
          model: 'gemini-3.1-pro-preview',
        }),
      });
      const data = await res.json();
      if (data.text) {
        if (action === 'summarize') {
          setDocBody((prev) => `${prev}\n\n--- Executive Summary ---\n${data.text}`);
        } else {
          setDocBody(data.text);
        }
      }
    } catch (err: any) {
      alert('AI Doc error: ' + err.message);
    } finally {
      setDocAiLoading(false);
    }
  };

  // AI Generate Slides Deck
  const handleGenerateSlides = async () => {
    setSlidesLoading(true);
    try {
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Generate a 4-slide presentation outline for "${presentationTopic}". Return ONLY a valid JSON array matching this schema: [{"slideNumber": 1, "title": "Slide Title", "bullets": ["bullet 1", "bullet 2", "bullet 3"]}]. Do not include markdown code block ticks.`,
          model: 'gemini-3.5-flash',
        }),
      });
      const data = await res.json();
      const cleanJson = data.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed)) {
        setSlides(parsed);
      }
    } catch (err: any) {
      alert('Slide generation notice: ' + err.message);
    } finally {
      setSlidesLoading(false);
    }
  };

  // Keep Notes actions
  const handleAddNote = async () => {
    if (!newNoteTitle.trim()) return;
    const newNote = {
      id: `note-${Date.now()}`,
      title: newNoteTitle,
      content: newNoteContent,
      color: newNoteColor,
      pinned: false,
    };
    setNotes([newNote, ...notes]);
    setNewNoteTitle('');
    setNewNoteContent('');

    if (userId) {
      await saveWorkspaceItem({
        id: newNote.id,
        userId,
        type: 'note',
        title: newNote.title,
        content: newNote.content,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const handleDeleteNote = (noteId: string) => {
    openConfirmation({
      title: 'Delete Note',
      message: 'Are you sure you want to delete this note? This action cannot be undone.',
      confirmLabel: 'Delete Note',
      isDestructive: true,
      onConfirm: async () => {
        closeConfirmation();
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
        if (userId) {
          await deleteWorkspaceItem(userId, noteId);
        }
      },
    });
  };

  // Tasks actions
  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    const newTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle,
      completed: false,
      dueDate: 'This Week',
    };
    setTasks([...tasks, newTask]);
    setNewTaskTitle('');

    if (userId) {
      await saveWorkspaceItem({
        id: newTask.id,
        userId,
        type: 'task',
        title: newTask.title,
        content: newTask.dueDate,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const toggleTask = async (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updated = { ...t, completed: !t.completed };
          if (userId) {
            saveWorkspaceItem({
              id: updated.id,
              userId,
              type: 'task',
              title: updated.title,
              content: updated.dueDate,
              status: updated.completed ? 'completed' : 'pending',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
          return updated;
        }
        return t;
      })
    );
  };

  return (
    <div className="space-y-6">
      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmLabel={modalConfig.confirmLabel}
        isDestructive={modalConfig.isDestructive}
        onConfirm={modalConfig.onConfirm}
        onCancel={closeConfirmation}
      />

      {/* Workspace OAuth Status Banner */}
      {!hasOAuthToken && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-neutral-900 border border-blue-800/40 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-neutral-100">Connect Google Workspace</h4>
              <p className="text-xs text-neutral-400">
                Authorize Drive, Gmail, Calendar, Docs, and Tasks to enable live account synchronization.
              </p>
            </div>
          </div>
          <button
            id="connect-workspace-btn"
            onClick={onConnectOAuth}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow transition whitespace-nowrap"
          >
            Authorize Workspace
          </button>
        </div>
      )}

      {/* Workspace App Switcher Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-1.5 p-1.5 bg-neutral-900/80 rounded-2xl border border-neutral-800">
        {[
          { id: 'keep', name: 'Keep', icon: Bookmark, color: 'text-amber-400' },
          { id: 'tasks', name: 'Tasks', icon: CheckSquare, color: 'text-blue-400' },
          { id: 'docs', name: 'Docs', icon: FileText, color: 'text-blue-400' },
          { id: 'sheets', name: 'Sheets', icon: Table, color: 'text-emerald-400' },
          { id: 'slides', name: 'Slides', icon: Presentation, color: 'text-amber-400' },
          { id: 'forms', name: 'Forms', icon: FormInput, color: 'text-purple-400' },
          { id: 'gmail', name: 'Gmail', icon: Mail, color: 'text-rose-400' },
          { id: 'calendar', name: 'Calendar', icon: CalendarIcon, color: 'text-blue-400' },
          { id: 'drive', name: 'Drive', icon: HardDrive, color: 'text-emerald-400' },
          { id: 'meet', name: 'Meet', icon: Video, color: 'text-emerald-400' },
          { id: 'contacts', name: 'Contacts', icon: Users, color: 'text-blue-400' },
          { id: 'chat', name: 'Chat', icon: MessageCircle, color: 'text-emerald-400' },
        ].map((app) => {
          const Icon = app.icon;
          return (
            <button
              key={app.id}
              id={`workspace-tab-${app.id}`}
              onClick={() => setActiveApp(app.id as any)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition text-center ${
                activeApp === app.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 mb-1 ${activeApp === app.id ? 'text-white' : app.color}`} />
              <span className="text-[11px] font-medium leading-none">{app.name}</span>
            </button>
          );
        })}
      </div>

      {/* 1. GOOGLE KEEP */}
      {activeApp === 'keep' && (
        <div className="space-y-6">
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 space-y-4 max-w-xl mx-auto">
            <input
              id="new-note-title"
              type="text"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              placeholder="Title"
              className="w-full bg-transparent text-sm font-semibold text-neutral-100 placeholder-neutral-500 focus:outline-none"
            />
            <textarea
              id="new-note-content"
              rows={2}
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Take a note..."
              className="w-full bg-transparent text-xs text-neutral-300 placeholder-neutral-500 focus:outline-none resize-none"
            />
            <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
              <div className="flex items-center gap-1.5">
                {[
                  'bg-neutral-900 border-neutral-800',
                  'bg-amber-950/40 border-amber-800/60',
                  'bg-blue-950/40 border-blue-800/60',
                  'bg-emerald-950/40 border-emerald-800/60',
                  'bg-purple-950/40 border-purple-800/60',
                ].map((col, idx) => (
                  <button
                    key={idx}
                    onClick={() => setNewNoteColor(col)}
                    className={`w-5 h-5 rounded-full border ${col} ${
                      newNoteColor === col ? 'ring-2 ring-blue-500' : ''
                    }`}
                  />
                ))}
              </div>
              <button
                id="add-note-btn"
                onClick={handleAddNote}
                disabled={!newNoteTitle.trim()}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition"
              >
                Save Note
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((n) => (
              <div
                key={n.id}
                className={`p-5 rounded-2xl border ${n.color} flex flex-col justify-between space-y-3 relative group transition`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between">
                    <h4 className="text-sm font-semibold text-neutral-100">{n.title}</h4>
                    {n.pinned && <Pin className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <p className="text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed">
                    {n.content}
                  </p>
                </div>
                <div className="flex items-center justify-end pt-2 border-t border-neutral-800/40 opacity-80 group-hover:opacity-100 transition">
                  <button
                    onClick={() => handleDeleteNote(n.id)}
                    className="p-1.5 text-neutral-400 hover:text-rose-400 rounded-lg hover:bg-neutral-800/60 transition"
                    title="Delete note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. GOOGLE TASKS */}
      {activeApp === 'tasks' && (
        <div className="max-w-xl mx-auto space-y-4">
          <div className="flex gap-2">
            <input
              id="new-task-input"
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
              placeholder="Add a new task..."
              className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-500"
            />
            <button
              id="add-task-btn"
              onClick={handleAddTask}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition"
            >
              Add
            </button>
          </div>

          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl divide-y divide-neutral-800">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3.5 hover:bg-neutral-800/30 transition"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                      task.completed
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'border-neutral-700 hover:border-blue-500'
                    }`}
                  >
                    {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                  <span
                    className={`text-xs text-neutral-200 ${
                      task.completed ? 'line-through text-neutral-500' : ''
                    }`}
                  >
                    {task.title}
                  </span>
                </div>
                <span className="text-[10px] text-neutral-500 font-medium px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800">
                  {task.dueDate}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. GOOGLE DOCS */}
      {activeApp === 'docs' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4">
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="bg-transparent font-bold text-neutral-100 text-sm focus:outline-none"
            />
            <div className="flex items-center gap-2">
              <button
                id="doc-summarize-btn"
                onClick={() => handleAiPolishDoc('summarize')}
                disabled={docAiLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs text-neutral-300 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                Summarize
              </button>
              <button
                id="doc-expand-btn"
                onClick={() => handleAiPolishDoc('expand')}
                disabled={docAiLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs text-neutral-300 transition"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                Expand
              </button>
              <button
                id="doc-rewrite-btn"
                onClick={() => handleAiPolishDoc('rewrite')}
                disabled={docAiLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition"
              >
                {docAiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Gemini Rewrite
              </button>
            </div>
          </div>
          <textarea
            id="doc-editor-textarea"
            rows={14}
            value={docBody}
            onChange={(e) => setDocBody(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-6 text-sm text-neutral-200 leading-relaxed font-sans focus:outline-none focus:border-blue-500 resize-none shadow-xl"
          />
        </div>
      )}

      {/* 4. GOOGLE SHEETS */}
      {activeApp === 'sheets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4">
            <h4 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
              <Table className="w-4 h-4 text-emerald-400" />
              Spreadsheet Data Grid
            </h4>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setSheetData((prev) => [
                    ...prev,
                    [`Item ${prev.length}`, '100', '100', 'Active'],
                  ])
                }
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs rounded-xl transition"
              >
                Add Row
              </button>
            </div>
          </div>

          <div className="overflow-x-auto bg-neutral-950 border border-neutral-800 rounded-2xl">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-neutral-900/80 border-b border-neutral-800 text-neutral-400">
                  {sheetData[0].map((header, colIdx) => (
                    <th key={colIdx} className="p-3 font-semibold">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {sheetData.slice(1).map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-neutral-900/40 transition">
                    {row.map((cell, colIdx) => (
                      <td key={colIdx} className="p-3 text-neutral-200">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. GOOGLE SLIDES */}
      {activeApp === 'slides' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4">
            <input
              id="presentation-topic-input"
              type="text"
              value={presentationTopic}
              onChange={(e) => setPresentationTopic(e.target.value)}
              placeholder="Presentation Topic"
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
            />
            <button
              id="generate-slides-btn"
              onClick={handleGenerateSlides}
              disabled={slidesLoading}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition"
            >
              {slidesLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Presentation className="w-4 h-4" />}
              Generate Slide Deck
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {slides.map((s) => (
              <div
                key={s.slideNumber}
                className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 flex flex-col justify-between min-h-[220px] shadow-xl relative overflow-hidden"
              >
                <div className="space-y-3">
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block">
                    Slide {s.slideNumber}
                  </span>
                  <h4 className="text-sm font-bold text-neutral-100">{s.title}</h4>
                  <ul className="space-y-1.5">
                    {s.bullets.map((b, idx) => (
                      <li key={idx} className="text-xs text-neutral-400 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. GMAIL */}
      {activeApp === 'gmail' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Smart Composer */}
          <div className="lg:col-span-6 space-y-4 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                <Mail className="w-4 h-4 text-rose-400" />
                Gmail AI Composer
              </h4>
              <button
                id="ai-draft-btn"
                onClick={handleAiDraftEmail}
                disabled={isAiDrafting}
                className="flex items-center gap-1.5 px-3 py-1 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs text-neutral-300 transition"
              >
                {isAiDrafting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-blue-400" />}
                Draft with AI
              </button>
            </div>

            <div className="space-y-3">
              <input
                id="email-to-input"
                type="email"
                value={mailTo}
                onChange={(e) => setMailTo(e.target.value)}
                placeholder="To: recipient@example.com"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-neutral-100 focus:outline-none focus:border-rose-500"
              />
              <input
                id="email-subject-input"
                type="text"
                value={mailSubject}
                onChange={(e) => setMailSubject(e.target.value)}
                placeholder="Subject"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-neutral-100 focus:outline-none focus:border-rose-500"
              />
              <textarea
                id="email-body-input"
                rows={6}
                value={mailBody}
                onChange={(e) => setMailBody(e.target.value)}
                placeholder="Compose your message..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 text-xs text-neutral-100 focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>

            <button
              id="send-email-btn"
              onClick={handleConfirmSendEmail}
              disabled={!mailTo || !mailSubject || !mailBody}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold rounded-xl transition text-xs shadow-lg shadow-rose-600/20"
            >
              <Send className="w-4 h-4" />
              <span>Send via Gmail (Requests Confirmation)</span>
            </button>
          </div>

          {/* Inbox Preview */}
          <div className="lg:col-span-6 bg-neutral-900/40 border border-neutral-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Recent Gmail Threads
              </h4>
              <button
                onClick={loadGmail}
                disabled={gmailLoading}
                className="p-1 text-neutral-400 hover:text-neutral-200"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${gmailLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {gmailMessages.length > 0 ? (
                gmailMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1 hover:border-neutral-700 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral-200 truncate max-w-[200px]">
                        {msg.from}
                      </span>
                      <span className="text-[10px] text-neutral-500">{msg.date}</span>
                    </div>
                    <div className="text-xs font-medium text-neutral-300">{msg.subject}</div>
                    <p className="text-[11px] text-neutral-500 truncate">{msg.snippet}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-neutral-500 text-xs">
                  {hasOAuthToken
                    ? 'No recent emails found in inbox.'
                    : 'Connect Google Workspace account above to sync live Gmail messages.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. GOOGLE CALENDAR */}
      {activeApp === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5">
            <h4 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-blue-400" />
              Schedule Calendar Event
            </h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Event Summary</label>
                <input
                  id="event-title-input"
                  type="text"
                  value={eventSummary}
                  onChange={(e) => setEventSummary(e.target.value)}
                  placeholder="e.g. AI Product Architecture Review"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Date</label>
                <input
                  id="event-date-input"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Location / Video Link</label>
                <input
                  id="event-location-input"
                  type="text"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="e.g. Google Meet / HQ Boardroom"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              id="schedule-event-btn"
              onClick={handleConfirmCreateEvent}
              disabled={!eventSummary || !eventDate}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl transition text-xs shadow-lg shadow-blue-500/20"
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Create Event (Requests Confirmation)</span>
            </button>
          </div>

          <div className="lg:col-span-7 bg-neutral-900/40 border border-neutral-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Upcoming Google Calendar Events
              </h4>
              <button
                onClick={loadCalendar}
                disabled={calendarLoading}
                className="p-1 text-neutral-400 hover:text-neutral-200"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${calendarLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto">
              {calendarEvents.length > 0 ? (
                calendarEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <h5 className="text-xs font-semibold text-neutral-200">{evt.summary}</h5>
                      <span className="text-[11px] text-neutral-400 block mt-0.5">
                        {evt.start?.dateTime || evt.start?.date}
                      </span>
                    </div>
                    {evt.htmlLink && (
                      <a
                        href={evt.htmlLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400 hover:text-blue-300 p-1"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-neutral-500 text-xs">
                  {hasOAuthToken
                    ? 'No upcoming calendar events detected.'
                    : 'Authorize Google Workspace to view live Google Calendar schedule.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 8. GOOGLE DRIVE */}
      {activeApp === 'drive' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <Search className="w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={driveSearch}
                onChange={(e) => setDriveSearch(e.target.value)}
                placeholder="Search Google Drive files..."
                className="bg-transparent text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none w-full"
              />
            </div>
            <button
              onClick={loadDrive}
              disabled={driveLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${driveLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Drive</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {driveFiles.length > 0 ? (
              driveFiles
                .filter((f) => f.name.toLowerCase().includes(driveSearch.toLowerCase()))
                .map((file) => (
                  <div
                    key={file.id}
                    className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-2 hover:border-neutral-700 transition"
                  >
                    <Folder className="w-8 h-8 text-emerald-400" />
                    <h5 className="text-xs font-semibold text-neutral-200 truncate">{file.name}</h5>
                    <div className="flex items-center justify-between text-[11px] text-neutral-500">
                      <span>{file.mimeType.split('.').pop() || 'file'}</span>
                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          Open
                        </a>
                      )}
                    </div>
                  </div>
                ))
            ) : (
              <div className="col-span-full text-center py-12 text-neutral-500 text-xs">
                {hasOAuthToken
                  ? 'No Drive files loaded or Drive is empty.'
                  : 'Connect Google Workspace account to browse files directly.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 9. GOOGLE MEET */}
      {activeApp === 'meet' && (
        <div className="max-w-md mx-auto bg-neutral-900/60 border border-neutral-800 rounded-2xl p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
            <Video className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-base font-bold text-neutral-100">Google Meet Launcher</h4>
            <p className="text-xs text-neutral-400">
              Start instant video calls with collaborative screen sharing and Gemini live meeting notes.
            </p>
          </div>
          <a
            id="start-meet-btn"
            href="https://meet.google.com/new"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition"
          >
            <Video className="w-4 h-4" />
            <span>Launch Google Meet (New Meeting)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* 10. GOOGLE CONTACTS */}
      {activeApp === 'contacts' && (
        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="flex items-center justify-between bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4">
            <h4 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              Google Contacts Directory
            </h4>
            <button
              onClick={loadContacts}
              disabled={contactsLoading}
              className="p-1.5 text-neutral-400 hover:text-neutral-200"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${contactsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl divide-y divide-neutral-800">
            {contacts.length > 0 ? (
              contacts.map((c, idx) => (
                <div key={idx} className="p-3.5 flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-semibold text-neutral-200">{c.displayName}</h5>
                    <span className="text-[11px] text-neutral-400 block">{c.email || c.phoneNumber || 'No contact details'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-neutral-500 text-xs">
                {hasOAuthToken
                  ? 'No contacts detected in address book.'
                  : 'Connect Google Workspace account to sync Contacts.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 11. GOOGLE FORMS */}
      {activeApp === 'forms' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full bg-transparent font-bold text-neutral-100 text-base focus:outline-none"
            />
            <div className="space-y-3">
              {formQuestions.map((q, idx) => (
                <div key={q.id} className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                  <span className="text-[10px] font-mono text-purple-400 uppercase">Question {idx + 1}</span>
                  <p className="text-xs font-medium text-neutral-200">{q.text}</p>
                  {q.type === 'rating' ? (
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button key={num} className="w-7 h-7 rounded-lg border border-neutral-800 text-xs text-neutral-400 hover:border-purple-500">
                          {num}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="Short answer text"
                      disabled
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-400"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2 border-t border-neutral-800">
              <input
                type="text"
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                placeholder="Add a new survey question..."
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={() => {
                  if (!newQuestionText.trim()) return;
                  setFormQuestions([
                    ...formQuestions,
                    { id: `q-${Date.now()}`, text: newQuestionText, type: 'text' },
                  ]);
                  setNewQuestionText('');
                }}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition"
              >
                Add Question
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 12. GOOGLE CHAT */}
      {activeApp === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-4xl mx-auto">
          <div className="lg:col-span-4 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Chat Spaces & Channels
            </h4>
            <div className="space-y-1">
              {chatChannels.map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveChannel(c)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition ${
                    activeChannel === c
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-8 bg-neutral-900/40 border border-neutral-800 rounded-2xl flex flex-col h-[400px]">
            <div className="p-4 border-b border-neutral-800 text-xs font-bold text-neutral-200">
              {activeChannel}
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {chatThread.map((msg, idx) => (
                <div key={idx} className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-neutral-500">
                    <span className="font-semibold text-neutral-300">{msg.sender}</span>
                    <span>{msg.time}</span>
                  </div>
                  <p className="text-xs text-neutral-200">{msg.text}</p>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-neutral-800 flex gap-2">
              <input
                type="text"
                value={channelInput}
                onChange={(e) => setChannelInput(e.target.value)}
                placeholder={`Message ${activeChannel}...`}
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => {
                  if (!channelInput.trim()) return;
                  setChatThread([
                    ...chatThread,
                    {
                      sender: 'You',
                      text: channelInput,
                      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    },
                  ]);
                  setChannelInput('');
                }}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
