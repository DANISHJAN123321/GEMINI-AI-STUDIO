import React, { useState } from 'react';
import {
  MessageSquare,
  Brain,
  Search,
  MapPin,
  Eye,
  Film,
  Zap,
  Send,
  Loader2,
  Sparkles,
  ExternalLink,
  Bot,
  User,
  Clock,
  CheckCircle2,
  Upload,
} from 'lucide-react';
import { saveGenerationItem } from '../lib/firebase.ts';

interface GeminiIntelligenceProps {
  userId?: string;
  onSavedToCloud?: () => void;
}

export const GeminiIntelligence: React.FC<GeminiIntelligenceProps> = ({
  userId,
  onSavedToCloud,
}) => {
  const [activeTab, setActiveTab] = useState<
    'chat' | 'thinking' | 'search' | 'maps' | 'vision' | 'video' | 'fast'
  >('chat');

  // Chatbot State
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: 'user' | 'model'; content: string }>
  >([
    {
      role: 'model',
      content:
        'Hello! I am your Gemini intelligent assistant. How can I collaborate with you on design, code, analysis, or workspace planning today?',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatModel, setChatModel] = useState<'gemini-3.1-pro-preview' | 'gemini-3.5-flash' | 'gemini-3.1-flash-lite'>(
    'gemini-3.5-flash'
  );
  const [chatRole, setChatRole] = useState<string>('Creative Director');
  const [chatLoading, setChatLoading] = useState(false);

  // High Thinking State
  const [thinkingPrompt, setThinkingPrompt] = useState(
    'Compare quantum computing gate architectures with classical silicon CMOS, analyzing error correction thresholds and coherence times.'
  );
  const [thinkingResult, setThinkingResult] = useState<{ text: string; thoughts: string } | null>(null);
  const [thinkingLoading, setThinkingLoading] = useState(false);

  // Search Grounding State
  const [searchPrompt, setSearchPrompt] = useState(
    'What are the latest breakthroughs in renewable fusion energy this year?'
  );
  const [searchResult, setSearchResult] = useState<{
    text: string;
    sources: Array<{ title: string; uri: string }>;
    queries: string[];
  } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Maps Grounding State
  const [mapsPrompt, setMapsPrompt] = useState(
    'Recommend the best quiet coffee shops with fast Wi-Fi and power outlets in San Francisco Mission District.'
  );
  const [mapsResult, setMapsResult] = useState<{ text: string; metadata: any } | null>(null);
  const [mapsLoading, setMapsLoading] = useState(false);

  // Vision Analysis State
  const [visionImage, setVisionImage] = useState<string | null>(null);
  const [visionPrompt, setVisionPrompt] = useState(
    'Analyze this image in detail: identify all objects, architectural style, lighting, and any extracted text.'
  );
  const [visionResult, setVisionResult] = useState<string | null>(null);
  const [visionLoading, setVisionLoading] = useState(false);

  // Video Analysis State
  const [videoFile, setVideoFile] = useState<string | null>(null);
  const [videoPrompt, setVideoPrompt] = useState(
    'Analyze this video sequence: summarize the visual timeline, key events, and action steps.'
  );
  const [videoResult, setVideoResult] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);

  // Low Latency Fast Assistant State
  const [fastPrompt, setFastPrompt] = useState('Generate 3 catchy tagline ideas for a developer-first AI cloud platform.');
  const [fastResult, setFastResult] = useState<{ text: string; durationMs: number } | null>(null);
  const [fastLoading, setFastLoading] = useState(false);

  // Handle Multi-turn Chat
  const handleSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const newMessages = [...chatMessages, { role: 'user' as const, content: chatInput }];
    setChatMessages(newMessages);
    setChatInput('');
    setChatLoading(true);

    const systemInstructions: Record<string, string> = {
      'Creative Director': 'You are a world-class Creative Director specialized in branding, UI/UX aesthetics, visual hierarchy, and polished product design.',
      'Code Architect': 'You are a Principal Software Architect proficient in TypeScript, React, distributed systems, and Google Cloud design patterns.',
      'Executive Assistant': 'You are a meticulous executive assistant providing structured, actionable summaries, agendas, and clear action items.',
      'Research Analyst': 'You are a senior quantitative research analyst delivering rigorous, data-driven synthesis and critical evaluations.',
    };

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          model: chatModel,
          systemInstruction: systemInstructions[chatRole] || undefined,
        }),
      });
      const data = await res.json();
      if (data.text) {
        setChatMessages([...newMessages, { role: 'model', content: data.text }]);
        if (userId) {
          await saveGenerationItem({
            id: `gen-chat-${Date.now()}`,
            userId,
            kind: 'text',
            model: chatModel,
            prompt: chatInput,
            resultText: data.text,
            createdAt: new Date().toISOString(),
          });
          onSavedToCloud?.();
        }
      }
    } catch (err: any) {
      setChatMessages([
        ...newMessages,
        { role: 'model', content: 'Apologies, I encountered an error: ' + err.message },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Handle High Thinking (ThinkingLevel.HIGH with gemini-3.1-pro-preview)
  const handleThinking = async () => {
    setThinkingLoading(true);
    setThinkingResult(null);
    try {
      const res = await fetch('/api/gemini/thinking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: thinkingPrompt }),
      });
      const data = await res.json();
      setThinkingResult({
        text: data.text || 'Thinking completed.',
        thoughts: data.thoughts || 'Multi-step causal reasoning chain evaluated.',
      });
      if (userId) {
        await saveGenerationItem({
          id: `gen-thinking-${Date.now()}`,
          userId,
          kind: 'thinking',
          model: 'gemini-3.1-pro-preview',
          prompt: thinkingPrompt,
          resultText: data.text,
          createdAt: new Date().toISOString(),
        });
        onSavedToCloud?.();
      }
    } catch (err: any) {
      alert('Thinking error: ' + err.message);
    } finally {
      setThinkingLoading(false);
    }
  };

  // Handle Grounded Search (gemini-3.5-flash with googleSearch tool)
  const handleSearch = async () => {
    setSearchLoading(true);
    setSearchResult(null);
    try {
      const res = await fetch('/api/gemini/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: searchPrompt }),
      });
      const data = await res.json();
      setSearchResult({
        text: data.text || 'Search grounding complete.',
        sources: data.sources || [],
        queries: data.queries || [],
      });
      if (userId) {
        await saveGenerationItem({
          id: `gen-search-${Date.now()}`,
          userId,
          kind: 'grounded',
          model: 'gemini-3.5-flash',
          prompt: searchPrompt,
          resultText: data.text,
          createdAt: new Date().toISOString(),
        });
        onSavedToCloud?.();
      }
    } catch (err: any) {
      alert('Search Grounding error: ' + err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle Grounded Maps (gemini-3.5-flash with googleMaps tool)
  const handleMaps = async () => {
    setMapsLoading(true);
    setMapsResult(null);
    try {
      const res = await fetch('/api/gemini/maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: mapsPrompt }),
      });
      const data = await res.json();
      setMapsResult({
        text: data.text || 'Maps grounding complete.',
        metadata: data.metadata,
      });
      if (userId) {
        await saveGenerationItem({
          id: `gen-maps-${Date.now()}`,
          userId,
          kind: 'grounded',
          model: 'gemini-3.5-flash',
          prompt: mapsPrompt,
          resultText: data.text,
          createdAt: new Date().toISOString(),
        });
        onSavedToCloud?.();
      }
    } catch (err: any) {
      alert('Maps Grounding error: ' + err.message);
    } finally {
      setMapsLoading(false);
    }
  };

  // Handle Vision Analysis (gemini-3.1-pro-preview)
  const handleVision = async () => {
    if (!visionImage) {
      alert('Please upload an image to analyze first.');
      return;
    }
    setVisionLoading(true);
    setVisionResult(null);
    try {
      const res = await fetch('/api/gemini/image-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: visionPrompt,
          base64Image: visionImage,
        }),
      });
      const data = await res.json();
      setVisionResult(data.text || 'Analysis complete.');
    } catch (err: any) {
      alert('Vision error: ' + err.message);
    } finally {
      setVisionLoading(false);
    }
  };

  // Handle Video Analysis (gemini-3.1-pro-preview)
  const handleVideoAnalysis = async () => {
    if (!videoFile) {
      alert('Please upload a video file to analyze first.');
      return;
    }
    setVideoLoading(true);
    setVideoResult(null);
    try {
      const res = await fetch('/api/gemini/video-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: videoPrompt,
          base64Video: videoFile,
        }),
      });
      const data = await res.json();
      setVideoResult(data.text || 'Video analysis complete.');
    } catch (err: any) {
      alert('Video analysis error: ' + err.message);
    } finally {
      setVideoLoading(false);
    }
  };

  // Handle Low-Latency Flash-Lite
  const handleFastAssistant = async () => {
    setFastLoading(true);
    const start = performance.now();
    try {
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: fastPrompt,
          model: 'gemini-3.1-flash-lite',
        }),
      });
      const durationMs = Math.round(performance.now() - start);
      const data = await res.json();
      setFastResult({
        text: data.text || 'Response received.',
        durationMs,
      });
    } catch (err: any) {
      alert('Low-latency error: ' + err.message);
    } finally {
      setFastLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (s: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setter(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Navigation Subtabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-neutral-900/80 rounded-2xl border border-neutral-800">
        <button
          id="intel-tab-chat"
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'chat'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Multi-turn Chatbot
        </button>
        <button
          id="intel-tab-thinking"
          onClick={() => setActiveTab('thinking')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'thinking'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
          }`}
        >
          <Brain className="w-4 h-4" />
          High Thinking Mode
        </button>
        <button
          id="intel-tab-search"
          onClick={() => setActiveTab('search')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'search'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
          }`}
        >
          <Search className="w-4 h-4" />
          Google Search Grounding
        </button>
        <button
          id="intel-tab-maps"
          onClick={() => setActiveTab('maps')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'maps'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Google Maps Grounding
        </button>
        <button
          id="intel-tab-vision"
          onClick={() => setActiveTab('vision')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'vision'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
          }`}
        >
          <Eye className="w-4 h-4" />
          Image Analysis
        </button>
        <button
          id="intel-tab-video"
          onClick={() => setActiveTab('video')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'video'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
          }`}
        >
          <Film className="w-4 h-4" />
          Video Understanding
        </button>
        <button
          id="intel-tab-fast"
          onClick={() => setActiveTab('fast')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'fast'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
          }`}
        >
          <Zap className="w-4 h-4" />
          Low-Latency Flash-Lite
        </button>
      </div>

      {/* 1. MULTI-TURN CHATBOT */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Sidebar */}
          <div className="lg:col-span-4 space-y-4 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
              <Bot className="w-4 h-4 text-blue-400" />
              Chat Persona & Model
            </h3>

            {/* Model Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300">Model Selection</label>
              <div className="space-y-1.5">
                {[
                  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', desc: 'Fast, balanced general tasks' },
                  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', desc: 'Complex reasoning & analysis' },
                  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash-Lite', desc: 'Ultra low-latency queries' },
                ].map((m) => (
                  <button
                    key={m.id}
                    id={`chat-model-${m.id}`}
                    onClick={() => setChatModel(m.id as any)}
                    className={`w-full p-2.5 rounded-xl text-left border transition text-xs ${
                      chatModel === m.id
                        ? 'bg-blue-600/10 border-blue-500 text-blue-300 font-medium'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <div className="font-semibold text-neutral-200">{m.name}</div>
                    <div className="text-[10px] text-neutral-400">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Persona Role */}
            <div className="space-y-1.5 pt-2 border-t border-neutral-800">
              <label className="text-xs font-medium text-neutral-300">System Instruction Role</label>
              <div className="grid grid-cols-2 gap-1.5">
                {['Creative Director', 'Code Architect', 'Executive Assistant', 'Research Analyst'].map((r) => (
                  <button
                    key={r}
                    id={`role-btn-${r.toLowerCase().replace(' ', '-')}`}
                    onClick={() => setChatRole(r)}
                    className={`p-2 text-xs rounded-xl border text-center transition ${
                      chatRole === r
                        ? 'bg-blue-600 text-white border-blue-500 font-medium'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-neutral-950/80 rounded-xl border border-neutral-800 text-[11px] text-neutral-400 leading-relaxed">
              Conversation history is maintained continuously across turns. Changing personas adapts the model&apos;s tone and decision framework instantly.
            </div>
          </div>

          {/* Chat Thread */}
          <div className="lg:col-span-8 bg-neutral-900/40 border border-neutral-800 rounded-2xl flex flex-col h-[560px]">
            {/* Thread Messages */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-3 max-w-[85%] ${
                    msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-neutral-800 text-blue-400 border border-neutral-700'
                    }`}
                  >
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-neutral-900 border border-neutral-800 text-neutral-200 whitespace-pre-wrap'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex items-center gap-2 text-neutral-400 text-xs p-3">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                  <span>Gemini is formulating response...</span>
                </div>
              )}
            </div>

            {/* Input form */}
            <form onSubmit={handleSendChat} className="p-4 border-t border-neutral-800 flex gap-2">
              <input
                id="chat-user-input"
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={`Ask ${chatRole} anything...`}
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-500"
              />
              <button
                id="chat-send-btn"
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-medium transition flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. HIGH THINKING MODE */}
      {activeTab === 'thinking' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                High Thinking Mode
              </h3>
              <p className="text-xs text-neutral-400">
                Deep analytical reasoning using <span className="font-mono text-neutral-300">gemini-3.1-pro-preview</span> with <span className="font-mono text-neutral-300">ThinkingLevel.HIGH</span>.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-300">Complex Problem / Query</label>
              <textarea
                id="thinking-prompt-input"
                rows={5}
                value={thinkingPrompt}
                onChange={(e) => setThinkingPrompt(e.target.value)}
                placeholder="Enter a complex logic, scientific, or mathematical question..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            <button
              id="execute-thinking-btn"
              onClick={handleThinking}
              disabled={thinkingLoading || !thinkingPrompt}
              className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold rounded-xl transition shadow-lg shadow-purple-600/20 text-sm"
            >
              {thinkingLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Executing High Thinking reasoning...</span>
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  <span>Execute High Thinking</span>
                </>
              )}
            </button>
          </div>

          <div className="lg:col-span-7 bg-neutral-900/40 border border-neutral-800 rounded-2xl p-6 flex flex-col justify-center min-h-[420px]">
            {thinkingLoading ? (
              <div className="text-center space-y-3">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
                <p className="text-sm font-medium text-neutral-200">Evaluating multi-layer causal reasoning...</p>
                <p className="text-xs text-neutral-500 max-w-sm">
                  Gemini 3.1 Pro is generating step-by-step internal deductions before concluding the optimal solution.
                </p>
              </div>
            ) : thinkingResult ? (
              <div className="space-y-5">
                {/* Reasoning thoughts badge & chain */}
                <div className="bg-purple-950/30 border border-purple-800/40 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    Internal Cognitive Reasoning Chain (Thinking Output)
                  </div>
                  <p className="text-xs text-purple-200/80 font-mono leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {thinkingResult.thoughts}
                  </p>
                </div>

                {/* Final conclusion */}
                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 space-y-2">
                  <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Concluded Deduction
                  </h4>
                  <div className="text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                    {thinkingResult.text}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-2 text-neutral-500">
                <Brain className="w-12 h-12 mx-auto stroke-1" />
                <p className="text-sm font-medium text-neutral-400">High Thinking Result Canvas</p>
                <p className="text-xs text-neutral-500">Inspect deep deductions and the underlying internal thought process.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. GOOGLE SEARCH GROUNDING */}
      {activeTab === 'search' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-400" />
                Google Search Grounding
              </h3>
              <p className="text-xs text-neutral-400">
                Real-time factual grounding using model: <span className="font-mono text-neutral-300">gemini-3.5-flash</span> with live web search tool.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-300">Search Query / Prompt</label>
              <textarea
                id="search-grounding-input"
                rows={4}
                value={searchPrompt}
                onChange={(e) => setSearchPrompt(e.target.value)}
                placeholder="Ask about live news, recent updates, research..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <button
              id="execute-search-grounding-btn"
              onClick={handleSearch}
              disabled={searchLoading || !searchPrompt}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-500/20 text-sm"
            >
              {searchLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Grounding with Google Search...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Query Grounded Search</span>
                </>
              )}
            </button>
          </div>

          <div className="lg:col-span-7 bg-neutral-900/40 border border-neutral-800 rounded-2xl p-6 flex flex-col justify-center min-h-[420px]">
            {searchLoading ? (
              <div className="text-center space-y-3">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
                <p className="text-sm font-medium text-neutral-200">Executing web grounding queries...</p>
              </div>
            ) : searchResult ? (
              <div className="space-y-5">
                {/* Search Queries Executed */}
                {searchResult.queries.length > 0 && (
                  <div className="flex flex-wrap gap-2 items-center text-xs">
                    <span className="text-neutral-400">Search Queries:</span>
                    {searchResult.queries.map((q, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300 font-mono text-[11px]"
                      >
                        {q}
                      </span>
                    ))}
                  </div>
                )}

                {/* Grounded Text */}
                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
                  {searchResult.text}
                </div>

                {/* Citations & Sources */}
                {searchResult.sources.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-semibold text-neutral-400">Grounded Citations:</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {searchResult.sources.map((src, idx) => (
                        <a
                          key={idx}
                          href={src.uri}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between p-2.5 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-blue-400 transition"
                        >
                          <span className="truncate max-w-[200px]">{src.title}</span>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center space-y-2 text-neutral-500">
                <Search className="w-12 h-12 mx-auto stroke-1" />
                <p className="text-sm font-medium text-neutral-400">Grounded Search Results</p>
                <p className="text-xs text-neutral-500">View real-time facts verified through Google Search.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. GOOGLE MAPS GROUNDING */}
      {activeTab === 'maps' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                Google Maps Grounding
              </h3>
              <p className="text-xs text-neutral-400">
                Geographic spatial intelligence powered by <span className="font-mono text-neutral-300">gemini-3.5-flash</span> with the Google Maps tool.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-300">Location Request / Query</label>
              <textarea
                id="maps-grounding-input"
                rows={4}
                value={mapsPrompt}
                onChange={(e) => setMapsPrompt(e.target.value)}
                placeholder="Ask about restaurants, routes, tourist attractions..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <button
              id="execute-maps-grounding-btn"
              onClick={handleMaps}
              disabled={mapsLoading || !mapsPrompt}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl transition shadow-lg shadow-emerald-600/20 text-sm"
            >
              {mapsLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Grounding with Google Maps...</span>
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4" />
                  <span>Query Grounded Maps</span>
                </>
              )}
            </button>
          </div>

          <div className="lg:col-span-7 bg-neutral-900/40 border border-neutral-800 rounded-2xl p-6 flex flex-col justify-center min-h-[420px]">
            {mapsLoading ? (
              <div className="text-center space-y-3">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                <p className="text-sm font-medium text-neutral-200">Retrieving geographical data...</p>
              </div>
            ) : mapsResult ? (
              <div className="space-y-4">
                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto">
                  {mapsResult.text}
                </div>
              </div>
            ) : (
              <div className="text-center space-y-2 text-neutral-500">
                <MapPin className="w-12 h-12 mx-auto stroke-1" />
                <p className="text-sm font-medium text-neutral-400">Grounded Maps View</p>
                <p className="text-xs text-neutral-500">Explore places and verified spatial information.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. IMAGE ANALYSIS */}
      {activeTab === 'vision' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-400" />
                Image Analysis
              </h3>
              <p className="text-xs text-neutral-400">
                Multimodal inspection using model: <span className="font-mono text-neutral-300">gemini-3.1-pro-preview</span>.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-300">Upload Photo to Inspect</label>
              <div className="border-2 border-dashed border-neutral-700 hover:border-neutral-600 rounded-xl p-4 text-center cursor-pointer transition relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, setVisionImage)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                {visionImage ? (
                  <div className="flex items-center justify-center gap-3">
                    <img
                      src={visionImage}
                      alt="Inspection"
                      className="w-16 h-16 object-cover rounded-lg border border-neutral-700"
                    />
                    <span className="text-xs text-neutral-300">Photo loaded. Click to replace.</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Upload className="w-5 h-5 mx-auto text-neutral-400" />
                    <p className="text-xs text-neutral-300 font-medium">Upload photo for visual analysis</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-300">Analysis Prompt</label>
              <textarea
                id="vision-prompt-input"
                rows={3}
                value={visionPrompt}
                onChange={(e) => setVisionPrompt(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <button
              id="execute-vision-analysis-btn"
              onClick={handleVision}
              disabled={visionLoading || !visionImage}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-500/20 text-sm"
            >
              {visionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Inspecting image...</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span>Analyze Image</span>
                </>
              )}
            </button>
          </div>

          <div className="lg:col-span-7 bg-neutral-900/40 border border-neutral-800 rounded-2xl p-6 flex flex-col justify-center min-h-[420px]">
            {visionLoading ? (
              <div className="text-center space-y-3">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
                <p className="text-sm font-medium text-neutral-200">Processing visual recognition...</p>
              </div>
            ) : visionResult ? (
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                {visionResult}
              </div>
            ) : (
              <div className="text-center space-y-2 text-neutral-500">
                <Eye className="w-12 h-12 mx-auto stroke-1" />
                <p className="text-sm font-medium text-neutral-400">Vision Analysis Output</p>
                <p className="text-xs text-neutral-500">Extract OCR text, detect objects, or critique UI design.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. VIDEO UNDERSTANDING */}
      {activeTab === 'video' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
                <Film className="w-4 h-4 text-purple-400" />
                Video Understanding
              </h3>
              <p className="text-xs text-neutral-400">
                Analyze video sequence using model: <span className="font-mono text-neutral-300">gemini-3.1-pro-preview</span>.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-300">Upload Video File</label>
              <div className="border-2 border-dashed border-neutral-700 hover:border-neutral-600 rounded-xl p-4 text-center cursor-pointer transition relative">
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleFileUpload(e, setVideoFile)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                {videoFile ? (
                  <div className="text-xs text-purple-300 font-medium">Video attached. Click to replace.</div>
                ) : (
                  <div className="space-y-1">
                    <Upload className="w-5 h-5 mx-auto text-neutral-400" />
                    <p className="text-xs text-neutral-300 font-medium">Upload video for scene analysis</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-300">Analysis Prompt</label>
              <textarea
                id="video-analysis-prompt-input"
                rows={3}
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            <button
              id="execute-video-analysis-btn"
              onClick={handleVideoAnalysis}
              disabled={videoLoading || !videoFile}
              className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold rounded-xl transition shadow-lg shadow-purple-600/20 text-sm"
            >
              {videoLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing video sequence...</span>
                </>
              ) : (
                <>
                  <Film className="w-4 h-4" />
                  <span>Analyze Video</span>
                </>
              )}
            </button>
          </div>

          <div className="lg:col-span-7 bg-neutral-900/40 border border-neutral-800 rounded-2xl p-6 flex flex-col justify-center min-h-[420px]">
            {videoLoading ? (
              <div className="text-center space-y-3">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
                <p className="text-sm font-medium text-neutral-200">Extracting video timelines and key actions...</p>
              </div>
            ) : videoResult ? (
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                {videoResult}
              </div>
            ) : (
              <div className="text-center space-y-2 text-neutral-500">
                <Film className="w-12 h-12 mx-auto stroke-1" />
                <p className="text-sm font-medium text-neutral-400">Video Breakdown</p>
                <p className="text-xs text-neutral-500">Summarize video narratives and timestamps.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. LOW-LATENCY FLASH-LITE */}
      {activeTab === 'fast' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Low-Latency Flash-Lite
              </h3>
              <p className="text-xs text-neutral-400">
                Ultra fast responses using model: <span className="font-mono text-neutral-300">gemini-3.1-flash-lite</span> for tasks that require immediate feedback.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-300">Prompt</label>
              <textarea
                id="fast-prompt-input"
                rows={4}
                value={fastPrompt}
                onChange={(e) => setFastPrompt(e.target.value)}
                placeholder="Enter quick query..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            <button
              id="execute-fast-assistant-btn"
              onClick={handleFastAssistant}
              disabled={fastLoading || !fastPrompt}
              className="w-full flex items-center justify-center gap-2 py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold rounded-xl transition shadow-lg shadow-amber-600/20 text-sm"
            >
              {fastLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating instantly...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Generate with Low-Latency</span>
                </>
              )}
            </button>
          </div>

          <div className="lg:col-span-7 bg-neutral-900/40 border border-neutral-800 rounded-2xl p-6 flex flex-col justify-center min-h-[420px]">
            {fastLoading ? (
              <div className="text-center space-y-3">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
                <p className="text-sm font-medium text-neutral-200">Executing with ultra-low latency...</p>
              </div>
            ) : fastResult ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs w-fit">
                  <Clock className="w-3.5 h-3.5" />
                  Roundtrip Latency: <span className="font-mono font-bold">{fastResult.durationMs}ms</span>
                </div>
                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto">
                  {fastResult.text}
                </div>
              </div>
            ) : (
              <div className="text-center space-y-2 text-neutral-500">
                <Zap className="w-12 h-12 mx-auto stroke-1" />
                <p className="text-sm font-medium text-neutral-400">Sub-second Latency Benchmarking</p>
                <p className="text-xs text-neutral-500">Test Gemini 3.1 Flash-Lite for high-throughput snappy responses.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
