import React, { useState, useEffect } from 'react';
import {
  Database,
  RefreshCw,
  Image as ImageIcon,
  Music,
  Video,
  FileText,
  Trash2,
  ExternalLink,
  Brain,
  Search,
  Clock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import {
  loadGenerationItems,
  loadWorkspaceItems,
  deleteWorkspaceItem,
  GenerationItemData,
  WorkspaceItemData,
} from '../lib/firebase.ts';
import { ConfirmationModal } from './ConfirmationModal.tsx';

interface FirestoreHistoryProps {
  userId?: string;
  refreshTrigger?: number;
}

export const FirestoreHistory: React.FC<FirestoreHistoryProps> = ({
  userId,
  refreshTrigger = 0,
}) => {
  const [generations, setGenerations] = useState<GenerationItemData[]>([]);
  const [workspaceItems, setWorkspaceItems] = useState<WorkspaceItemData[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSubView, setActiveSubView] = useState<'generations' | 'workspace'>('generations');

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

  const fetchData = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [gens, items] = await Promise.all([
        loadGenerationItems(userId),
        loadWorkspaceItems(userId),
      ]);
      setGenerations(gens);
      setWorkspaceItems(items);
    } catch (err) {
      console.warn('History fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId, refreshTrigger]);

  const handleDeleteItem = (itemId: string, title: string) => {
    if (!userId) return;
    setModalConfig({
      isOpen: true,
      title: 'Delete Cloud Document',
      message: `Are you sure you want to delete "${title}" from your Firestore cloud database?`,
      confirmLabel: 'Delete from Cloud',
      isDestructive: true,
      onConfirm: async () => {
        setModalConfig((prev) => ({ ...prev, isOpen: false }));
        await deleteWorkspaceItem(userId, itemId);
        setWorkspaceItems((prev) => prev.filter((i) => i.id !== itemId));
      },
    });
  };

  const getKindIcon = (kind: string) => {
    switch (kind) {
      case 'image':
        return <ImageIcon className="w-4 h-4 text-blue-400" />;
      case 'music':
        return <Music className="w-4 h-4 text-amber-400" />;
      case 'video':
        return <Video className="w-4 h-4 text-purple-400" />;
      case 'thinking':
        return <Brain className="w-4 h-4 text-purple-400" />;
      case 'grounded':
        return <Search className="w-4 h-4 text-emerald-400" />;
      default:
        return <FileText className="w-4 h-4 text-neutral-400" />;
    }
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
        onCancel={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Cloud Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-neutral-900/60 border border-neutral-800 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-neutral-100">Firestore Cloud Persistence</h3>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                <CheckCircle2 className="w-3 h-3" /> Live
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Synchronized records, generated assets, notes, and tasks stored in your secure Firebase database.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
            <button
              onClick={() => setActiveSubView('generations')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeSubView === 'generations' ? 'bg-blue-600 text-white' : 'text-neutral-400'
              }`}
            >
              AI Generations ({generations.length})
            </button>
            <button
              onClick={() => setActiveSubView('workspace')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeSubView === 'workspace' ? 'bg-blue-600 text-white' : 'text-neutral-400'
              }`}
            >
              Workspace Items ({workspaceItems.length})
            </button>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 text-neutral-400 hover:text-neutral-200 bg-neutral-900 border border-neutral-800 rounded-xl transition"
            title="Refresh database"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Generations Tab */}
      {activeSubView === 'generations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {generations.length > 0 ? (
            generations.map((gen) => (
              <div
                key={gen.id}
                className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between hover:border-neutral-700 transition"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
                      {getKindIcon(gen.kind)}
                      <span className="capitalize">{gen.kind}</span>
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500">{gen.model}</span>
                  </div>

                  <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed">
                    &ldquo;{gen.prompt}&rdquo;
                  </p>

                  {gen.resultUrl && gen.kind === 'image' && (
                    <img
                      src={gen.resultUrl}
                      alt={gen.prompt}
                      className="w-full h-36 object-cover rounded-xl border border-neutral-800 mt-2"
                    />
                  )}

                  {gen.resultUrl && gen.kind === 'music' && (
                    <audio controls className="w-full h-10 mt-2" src={gen.resultUrl} />
                  )}

                  {gen.resultText && (
                    <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800/80 text-[11px] text-neutral-400 line-clamp-3 font-mono">
                      {gen.resultText}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-2 border-t border-neutral-800/60">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(gen.createdAt).toLocaleDateString()}
                  </span>
                  {gen.resultUrl && (
                    <a
                      href={gen.resultUrl}
                      download={`asset-${gen.id}`}
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> Save Asset
                    </a>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-16 text-neutral-500 text-xs bg-neutral-900/30 border border-neutral-800/60 rounded-2xl">
              {userId
                ? 'No AI generations saved to Firestore yet. Generate images, music, or thinking models to persist them here.'
                : 'Sign in with Google to sync and store your generations in Firestore.'}
            </div>
          )}
        </div>
      )}

      {/* Workspace Items Tab */}
      {activeSubView === 'workspace' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaceItems.length > 0 ? (
            workspaceItems.map((item) => (
              <div
                key={item.id}
                className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between space-y-3 hover:border-neutral-700 transition"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider">
                      {item.type}
                    </span>
                    <button
                      onClick={() => handleDeleteItem(item.id, item.title)}
                      className="p-1 text-neutral-500 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h4 className="text-sm font-semibold text-neutral-100">{item.title}</h4>
                  <p className="text-xs text-neutral-400 whitespace-pre-wrap line-clamp-3">
                    {item.content}
                  </p>
                </div>
                <div className="text-[10px] text-neutral-500 pt-2 border-t border-neutral-800/60">
                  Updated: {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-16 text-neutral-500 text-xs bg-neutral-900/30 border border-neutral-800/60 rounded-2xl">
              {userId
                ? 'No workspace items saved in Firestore yet. Add notes or tasks in the Workspace Hub to save them.'
                : 'Sign in with Google to persist your workspace items.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
