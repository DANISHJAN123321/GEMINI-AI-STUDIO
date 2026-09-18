import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  Video as VideoIcon,
  Music,
  Mic,
  Volume2,
  Radio,
  Sparkles,
  Upload,
  Play,
  Pause,
  Download,
  Loader2,
  Sliders,
  Ratio,
  Maximize2,
  Wand2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { saveGenerationItem } from '../lib/firebase.ts';
import { fetchApi, ApiError } from '../lib/api.ts';

interface CreativeStudioProps {
  userId?: string;
  onSavedToCloud?: () => void;
}

export const CreativeStudio: React.FC<CreativeStudioProps> = ({
  userId,
  onSavedToCloud,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'image' | 'video' | 'music' | 'tts' | 'transcribe' | 'live'
  >('image');

  // Unified Error banner state
  const [studioError, setStudioError] = useState<{ message: string; isQuota?: boolean } | null>(null);

  // Image State (Defaulting to gemini-3.1-flash-lite-image for maximum quota reliability)
  const [imagePrompt, setImagePrompt] = useState('An ethereal bioluminescent garden at twilight, cinematic lighting, ultra-detailed');
  const [imageModel, setImageModel] = useState<'gemini-3.1-flash-lite-image' | 'gemini-3.1-flash-image' | 'gemini-3-pro-image'>(
    'gemini-3.1-flash-lite-image'
  );
  const [aspectRatio, setAspectRatio] = useState<
    '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '9:16' | '16:9' | '21:9'
  >('16:9');
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('2K');
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [imageInputBase64, setImageInputBase64] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  // Video State (Veo 3)
  const [videoPrompt, setVideoPrompt] = useState('Drone flyover through neon cyberpunk cityscape at sunset with holographic billboards');
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [videoInputPhoto, setVideoInputPhoto] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoOperation, setVideoOperation] = useState<string | null>(null);
  const [videoMessage, setVideoMessage] = useState<string | null>(null);

  // Music State (Lyria Clip & Pro)
  const [musicPrompt, setMusicPrompt] = useState('Upbeat synthwave electronic groove with punchy retro drums and ambient synth pads');
  const [musicModel, setMusicModel] = useState<'lyria-3-clip-preview' | 'lyria-3-pro-preview'>('lyria-3-clip-preview');
  const [musicImageInput, setMusicImageInput] = useState<string | null>(null);
  const [musicLoading, setMusicLoading] = useState(false);
  const [generatedMusicUrl, setGeneratedMusicUrl] = useState<string | null>(null);
  const [generatedLyrics, setGeneratedLyrics] = useState<string | null>(null);

  // TTS State
  const [ttsText, setTtsText] = useState('Welcome to the next generation of Gemini multimodal intelligence and creative generation.');
  const [ttsVoice, setTtsVoice] = useState<'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr'>('Kore');
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsAudioUrl, setTtsAudioUrl] = useState<string | null>(null);

  // Transcribe State
  const [isRecording, setIsRecording] = useState(false);
  const [transcribeLoading, setTranscribeLoading] = useState(false);
  const [transcribedText, setTranscribedText] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Live Voice State (gemini-3.8-live)
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    { role: 'assistant', text: 'Live API ready. Speak into your microphone to have a real-time conversation.' },
  ]);

  // Handle Image Generation / Editing
  const handleGenerateImage = async () => {
    setImageLoading(true);
    try {
      if (isEditingMode && imageInputBase64) {
        const res = await fetch('/api/gemini/image-edit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: imagePrompt,
            base64Image: imageInputBase64,
            aspectRatio,
          }),
        });
        const data = await res.json();
        if (data.imageUrl) {
          setGeneratedImageUrl(data.imageUrl);
          if (userId) {
            await saveGenerationItem({
              id: `gen-img-${Date.now()}`,
              userId,
              kind: 'image',
              model: 'gemini-3.1-flash-image-preview',
              prompt: imagePrompt,
              resultUrl: data.imageUrl,
              createdAt: new Date().toISOString(),
            });
            onSavedToCloud?.();
          }
        }
      } else {
        const res = await fetch('/api/gemini/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: imagePrompt,
            model: imageModel,
            aspectRatio,
            imageSize,
          }),
        });
        const data = await res.json();
        if (data.imageUrl) {
          setGeneratedImageUrl(data.imageUrl);
          if (userId) {
            await saveGenerationItem({
              id: `gen-img-${Date.now()}`,
              userId,
              kind: 'image',
              model: imageModel,
              prompt: imagePrompt,
              resultUrl: data.imageUrl,
              createdAt: new Date().toISOString(),
            });
            onSavedToCloud?.();
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      alert('Error generating image: ' + err.message);
    } finally {
      setImageLoading(false);
    }
  };

  // Handle Veo Video Generation
  const handleGenerateVideo = async () => {
    setVideoLoading(true);
    setVideoMessage('Initializing Veo 3 fast video model (veo-3.1-fast-generate-preview)...');
    try {
      const res = await fetch('/api/gemini/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: videoPrompt,
          base64Image: videoInputPhoto || undefined,
          aspectRatio: videoAspectRatio,
        }),
      });
      const data = await res.json();
      if (data.operationName) {
        setVideoOperation(data.operationName);
        setVideoMessage('Veo 3 rendering initiated. Video generation is being processed by Google Cloud.');
        if (userId) {
          await saveGenerationItem({
            id: `gen-vid-${Date.now()}`,
            userId,
            kind: 'video',
            model: 'veo-3.1-fast-generate-preview',
            prompt: videoPrompt,
            resultText: `Operation: ${data.operationName} (${videoAspectRatio})`,
            createdAt: new Date().toISOString(),
          });
          onSavedToCloud?.();
        }
      } else {
        setVideoMessage(data.message || 'Rendering request received.');
      }
    } catch (err: any) {
      setVideoMessage('Video generation notice: ' + err.message);
    } finally {
      setVideoLoading(false);
    }
  };

  // Handle Lyria Music Generation
  const handleGenerateMusic = async () => {
    setMusicLoading(true);
    setGeneratedMusicUrl(null);
    setGeneratedLyrics(null);
    try {
      const res = await fetch('/api/gemini/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: musicPrompt,
          model: musicModel,
          base64Image: musicImageInput || undefined,
        }),
      });
      const data = await res.json();
      if (data.audioUrl) {
        setGeneratedMusicUrl(data.audioUrl);
        setGeneratedLyrics(data.lyrics || 'Instrumental composition generated with Lyria.');
        if (userId) {
          await saveGenerationItem({
            id: `gen-music-${Date.now()}`,
            userId,
            kind: 'music',
            model: musicModel,
            prompt: musicPrompt,
            resultUrl: data.audioUrl,
            resultText: data.lyrics,
            createdAt: new Date().toISOString(),
          });
          onSavedToCloud?.();
        }
      }
    } catch (err: any) {
      console.error(err);
      alert('Error generating music: ' + err.message);
    } finally {
      setMusicLoading(false);
    }
  };

  // Handle TTS
  const handleGenerateTTS = async () => {
    setTtsLoading(true);
    try {
      const res = await fetch('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: ttsText,
          voiceName: ttsVoice,
        }),
      });
      const data = await res.json();
      if (data.audioUrl) {
        setTtsAudioUrl(data.audioUrl);
        if (userId) {
          await saveGenerationItem({
            id: `gen-tts-${Date.now()}`,
            userId,
            kind: 'speech',
            model: 'gemini-3.1-flash-tts-preview',
            prompt: ttsText,
            resultUrl: data.audioUrl,
            createdAt: new Date().toISOString(),
          });
          onSavedToCloud?.();
        }
      }
    } catch (err: any) {
      alert('TTS Error: ' + err.message);
    } finally {
      setTtsLoading(false);
    }
  };

  // Microphone Audio Recording for Transcription
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          setTranscribeLoading(true);
          try {
            const res = await fetch('/api/gemini/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                base64Audio: base64,
                mimeType: 'audio/webm',
              }),
            });
            const data = await res.json();
            setTranscribedText(data.text || 'No transcription detected.');
            if (userId) {
              await saveGenerationItem({
                id: `gen-transcribe-${Date.now()}`,
                userId,
                kind: 'transcription',
                model: 'gemini-3.5-transcribe',
                prompt: 'Microphone voice capture',
                resultText: data.text,
                createdAt: new Date().toISOString(),
              });
              onSavedToCloud?.();
            }
          } catch (err: any) {
            setTranscribedText('Transcription error: ' + err.message);
          } finally {
            setTranscribeLoading(false);
          }
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err: any) {
      alert('Microphone permission required: ' + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Handle file uploads helper
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
      {/* Sub navigation bar */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-neutral-900/80 rounded-2xl border border-neutral-800">
        <button
          id="tab-sub-image"
          onClick={() => setActiveSubTab('image')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'image'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          Create & Edit Images
        </button>
        <button
          id="tab-sub-video"
          onClick={() => setActiveSubTab('video')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'video'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
          }`}
        >
          <VideoIcon className="w-4 h-4" />
          Veo 3 Video Studio
        </button>
        <button
          id="tab-sub-music"
          onClick={() => setActiveSubTab('music')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'music'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
          }`}
        >
          <Music className="w-4 h-4" />
          Lyria Music Generator
        </button>
        <button
          id="tab-sub-tts"
          onClick={() => setActiveSubTab('tts')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'tts'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
          }`}
        >
          <Volume2 className="w-4 h-4" />
          Text to Speech (TTS)
        </button>
        <button
          id="tab-sub-transcribe"
          onClick={() => setActiveSubTab('transcribe')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'transcribe'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
          }`}
        >
          <Mic className="w-4 h-4" />
          Audio Transcriber
        </button>
        <button
          id="tab-sub-live"
          onClick={() => setActiveSubTab('live')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'live'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
          }`}
        >
          <Radio className="w-4 h-4" />
          Live Voice API
        </button>
      </div>

      {/* 1. IMAGE STUDIO */}
      {activeSubTab === 'image' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-5 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                Image Generation & Editing
              </h3>
              <div className="flex items-center gap-2 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
                <button
                  id="img-mode-create"
                  onClick={() => setIsEditingMode(false)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition ${
                    !isEditingMode ? 'bg-blue-600 text-white' : 'text-neutral-400'
                  }`}
                >
                  Generate
                </button>
                <button
                  id="img-mode-edit"
                  onClick={() => setIsEditingMode(true)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition ${
                    isEditingMode ? 'bg-blue-600 text-white' : 'text-neutral-400'
                  }`}
                >
                  Edit Existing
                </button>
              </div>
            </div>

            {/* Editing Image Upload */}
            {isEditingMode && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-300">Base Image to Edit</label>
                <div className="border-2 border-dashed border-neutral-700 hover:border-neutral-600 rounded-xl p-4 text-center cursor-pointer transition relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, setImageInputBase64)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {imageInputBase64 ? (
                    <div className="flex items-center justify-center gap-3">
                      <img
                        src={imageInputBase64}
                        alt="Input"
                        className="w-16 h-16 object-cover rounded-lg border border-neutral-700"
                      />
                      <span className="text-xs text-neutral-300">Photo loaded. Click to replace.</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-5 h-5 mx-auto text-neutral-400" />
                      <p className="text-xs text-neutral-300 font-medium">Upload photo to edit</p>
                      <p className="text-[11px] text-neutral-500">Supports PNG, JPG, WebP</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Prompt input */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-300">
                {isEditingMode ? 'Editing Instructions (e.g. Add a cyberpunk visor, change background)' : 'Prompt'}
              </label>
              <textarea
                id="image-prompt-input"
                rows={3}
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="Describe what you want to create or edit..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            {/* Model & Quality Selection */}
            {!isEditingMode && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-300">Model Selection</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="model-flash-image"
                    onClick={() => setImageModel('gemini-3.1-flash-image-preview')}
                    className={`p-2.5 rounded-xl text-left border transition text-xs ${
                      imageModel === 'gemini-3.1-flash-image-preview'
                        ? 'bg-blue-600/10 border-blue-500 text-blue-300 font-medium'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <div className="font-semibold text-neutral-200">Gemini Flash Image</div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">gemini-3.1-flash-image-preview</div>
                  </button>
                  <button
                    id="model-pro-image"
                    onClick={() => setImageModel('gemini-3-pro-image-preview')}
                    className={`p-2.5 rounded-xl text-left border transition text-xs ${
                      imageModel === 'gemini-3-pro-image-preview'
                        ? 'bg-blue-600/10 border-blue-500 text-blue-300 font-medium'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <div className="font-semibold text-neutral-200">Gemini Pro Image</div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">gemini-3-pro-image-preview</div>
                  </button>
                </div>
              </div>
            )}

            {/* Aspect Ratio Affordance (1:1, 2:3, 3:2, 3:4, 4:3, 9:16, 16:9, 21:9) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                  <Ratio className="w-3.5 h-3.5 text-neutral-400" />
                  Aspect Ratio
                </label>
                <span className="text-xs text-neutral-400 font-mono">{aspectRatio}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {(['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9', '21:9'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    id={`aspect-btn-${ratio.replace(':', '-')}`}
                    onClick={() => setAspectRatio(ratio)}
                    className={`py-1.5 text-xs font-mono rounded-lg border transition ${
                      aspectRatio === ratio
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution Affordance (1K, 2K, 4K) */}
            {!isEditingMode && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-neutral-400" />
                  Resolution Scale
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['1K', '2K', '4K'] as const).map((size) => (
                    <button
                      key={size}
                      id={`size-btn-${size}`}
                      onClick={() => setImageSize(size)}
                      className={`py-1.5 text-xs font-semibold rounded-xl border transition ${
                        imageSize === size
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Generate Action Button */}
            <button
              id="generate-image-btn"
              onClick={handleGenerateImage}
              disabled={imageLoading || !imagePrompt || (isEditingMode && !imageInputBase64)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-500/20 text-sm"
            >
              {imageLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isEditingMode ? 'Refining image...' : 'Synthesizing image...'}</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>{isEditingMode ? 'Edit Image' : 'Generate High-Quality Image'}</span>
                </>
              )}
            </button>
          </div>

          {/* Image Preview Canvas */}
          <div className="lg:col-span-7 bg-neutral-900/40 border border-neutral-800 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[420px]">
            {imageLoading ? (
              <div className="text-center space-y-3">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
                <p className="text-sm text-neutral-300 font-medium">Synthesizing visual canvas...</p>
                <p className="text-xs text-neutral-500 max-w-sm">
                  Leveraging Google Gemini generative image models at {imageSize} resolution with {aspectRatio} ratio.
                </p>
              </div>
            ) : generatedImageUrl ? (
              <div className="w-full space-y-4">
                <div className="relative rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 flex items-center justify-center p-2">
                  <img
                    src={generatedImageUrl}
                    alt="Generated output"
                    className="max-h-[500px] w-auto object-contain rounded-lg shadow-2xl"
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>Generated with {imageModel}</span>
                  <a
                    href={generatedImageUrl}
                    download={`gemini-${Date.now()}.png`}
                    className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Canvas
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-3 text-neutral-500">
                <ImageIcon className="w-12 h-12 mx-auto stroke-1" />
                <p className="text-sm font-medium text-neutral-400">Visual canvas preview</p>
                <p className="text-xs text-neutral-500 max-w-xs">
                  Configure aspect ratios from 1:1 up to 21:9 and resolutions up to 4K to generate studio-grade visuals.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. VEO 3 VIDEO STUDIO */}
      {activeSubTab === 'video' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-5 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
                <VideoIcon className="w-4 h-4 text-blue-400" />
                Veo 3 Video Studio
              </h3>
              <p className="text-xs text-neutral-400">
                Generate high-definition video from text or animate photos using model: <span className="font-mono text-neutral-300">veo-3.1-fast-generate-preview</span>.
              </p>
            </div>

            {/* Optional Photo upload for image-to-video animation */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-300">
                Optional Starting Photo (Image-to-Video Animation)
              </label>
              <div className="border-2 border-dashed border-neutral-700 hover:border-neutral-600 rounded-xl p-4 text-center cursor-pointer transition relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, setVideoInputPhoto)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                {videoInputPhoto ? (
                  <div className="flex items-center justify-center gap-3">
                    <img
                      src={videoInputPhoto}
                      alt="Uploaded frame"
                      className="w-16 h-16 object-cover rounded-lg border border-neutral-700"
                    />
                    <div className="text-left text-xs">
                      <span className="text-neutral-200 font-medium block">Starting Image Attached</span>
                      <span className="text-neutral-500">Veo will animate this image into video</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Upload className="w-5 h-5 mx-auto text-neutral-400" />
                    <p className="text-xs text-neutral-300 font-medium">Upload photo to animate into video</p>
                    <p className="text-[11px] text-neutral-500">Or leave empty to generate directly from text</p>
                  </div>
                )}
              </div>
            </div>

            {/* Video Prompt */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-300">Video Scene Description</label>
              <textarea
                id="video-prompt-input"
                rows={3}
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                placeholder="Describe cinematic camera movement, atmosphere, action..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            {/* Aspect Ratio Constraint (16:9 Landscape or 9:16 Portrait) */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-300">Video Aspect Ratio</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="veo-ratio-16-9"
                  onClick={() => setVideoAspectRatio('16:9')}
                  className={`py-2 px-3 text-xs font-medium rounded-xl border flex items-center justify-center gap-2 transition ${
                    videoAspectRatio === '16:9'
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Ratio className="w-3.5 h-3.5" />
                  16:9 Landscape
                </button>
                <button
                  id="veo-ratio-9-16"
                  onClick={() => setVideoAspectRatio('9:16')}
                  className={`py-2 px-3 text-xs font-medium rounded-xl border flex items-center justify-center gap-2 transition ${
                    videoAspectRatio === '9:16'
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Ratio className="w-3.5 h-3.5" />
                  9:16 Portrait
                </button>
              </div>
            </div>

            {/* Video Action Button */}
            <button
              id="generate-video-btn"
              onClick={handleGenerateVideo}
              disabled={videoLoading || (!videoPrompt && !videoInputPhoto)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-500/20 text-sm"
            >
              {videoLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting to Veo 3 engine...</span>
                </>
              ) : (
                <>
                  <VideoIcon className="w-4 h-4" />
                  <span>{videoInputPhoto ? 'Animate Image into Video' : 'Generate Video from Text'}</span>
                </>
              )}
            </button>
          </div>

          {/* Video Preview & Status */}
          <div className="lg:col-span-7 bg-neutral-900/40 border border-neutral-800 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[420px]">
            {videoLoading ? (
              <div className="text-center space-y-3">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
                <p className="text-sm font-medium text-neutral-200">Processing Veo 3 Video Generation...</p>
                <p className="text-xs text-neutral-500 max-w-sm">
                  Veo operations take a few moments to render realistic motion, lighting, and physics simulation.
                </p>
              </div>
            ) : videoMessage ? (
              <div className="w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-2xl p-6 space-y-4 text-center">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto">
                  <VideoIcon className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-neutral-200">Veo 3 Operation Status</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">{videoMessage}</p>
                {videoOperation && (
                  <div className="p-2.5 bg-neutral-900 rounded-xl border border-neutral-800 text-[11px] font-mono text-neutral-300 break-all">
                    {videoOperation}
                  </div>
                )}
                <p className="text-[11px] text-neutral-500">
                  Operation registered with Cloud backend. Video will finish rendering asynchronously in production pipeline.
                </p>
              </div>
            ) : (
              <div className="text-center space-y-3 text-neutral-500">
                <VideoIcon className="w-12 h-12 mx-auto stroke-1" />
                <p className="text-sm font-medium text-neutral-400">Veo 3 Video Player</p>
                <p className="text-xs text-neutral-500 max-w-xs">
                  Generate realistic videos with text prompts or upload a starting photo to animate it into a 16:9 or 9:16 sequence.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. LYRIA MUSIC STUDIO */}
      {activeSubTab === 'music' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-5 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
                <Music className="w-4 h-4 text-amber-400" />
                Lyria Music Studio
              </h3>
              <p className="text-xs text-neutral-400">
                Generate original music clips and full soundtracks with Lyria models.
              </p>
            </div>

            {/* Model Selector: lyria-3-clip-preview vs lyria-3-pro-preview */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-300">Generation Length & Model</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="music-model-clip"
                  onClick={() => setMusicModel('lyria-3-clip-preview')}
                  className={`p-3 rounded-xl text-left border transition text-xs ${
                    musicModel === 'lyria-3-clip-preview'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-300 font-medium'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <div className="font-semibold text-neutral-200">Lyria 3 Clip</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">Short clips (up to 30s)</div>
                </button>
                <button
                  id="music-model-pro"
                  onClick={() => setMusicModel('lyria-3-pro-preview')}
                  className={`p-3 rounded-xl text-left border transition text-xs ${
                    musicModel === 'lyria-3-pro-preview'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-300 font-medium'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <div className="font-semibold text-neutral-200">Lyria 3 Pro</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">Full-length tracks</div>
                </button>
              </div>
            </div>

            {/* Prompt */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-300">Musical Mood & Genre</label>
              <textarea
                id="music-prompt-input"
                rows={3}
                value={musicPrompt}
                onChange={(e) => setMusicPrompt(e.target.value)}
                placeholder="Describe instruments, tempo, atmosphere, vocals..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            {/* Optional Image Input for multimodal music inspiration */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-300">Optional Visual Inspiration</label>
              <div className="border border-neutral-800 hover:border-neutral-700 rounded-xl p-3 text-center cursor-pointer relative bg-neutral-950">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, setMusicImageInput)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                {musicImageInput ? (
                  <div className="flex items-center justify-center gap-3">
                    <img
                      src={musicImageInput}
                      alt="Visual prompt"
                      className="w-12 h-12 object-cover rounded-lg border border-neutral-800"
                    />
                    <span className="text-xs text-neutral-300">Visual inspiration image attached</span>
                  </div>
                ) : (
                  <span className="text-xs text-neutral-400 flex items-center justify-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    Attach image to generate matching soundtrack
                  </span>
                )}
              </div>
            </div>

            <button
              id="generate-music-btn"
              onClick={handleGenerateMusic}
              disabled={musicLoading || !musicPrompt}
              className="w-full flex items-center justify-center gap-2 py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold rounded-xl transition shadow-lg shadow-amber-600/20 text-sm"
            >
              {musicLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing audio stream...</span>
                </>
              ) : (
                <>
                  <Music className="w-4 h-4" />
                  <span>Generate Track ({musicModel === 'lyria-3-clip-preview' ? '30s Clip' : 'Full Track'})</span>
                </>
              )}
            </button>
          </div>

          {/* Music Player & Lyrics Canvas */}
          <div className="lg:col-span-7 bg-neutral-900/40 border border-neutral-800 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[420px]">
            {musicLoading ? (
              <div className="text-center space-y-3">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
                <p className="text-sm font-medium text-neutral-200">Composing soundtrack with Google Lyria...</p>
                <p className="text-xs text-neutral-500 max-w-sm">
                  Generating waveform audio chunks and lyrical metadata in streaming mode.
                </p>
              </div>
            ) : generatedMusicUrl ? (
              <div className="w-full max-w-lg space-y-6">
                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                      <Music className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-100">Lyria Master Audio</h4>
                      <p className="text-xs text-neutral-400">Generated with {musicModel}</p>
                    </div>
                  </div>

                  <audio controls className="w-full h-12 rounded-lg" src={generatedMusicUrl}>
                    Your browser does not support audio playback.
                  </audio>
                </div>

                {generatedLyrics && (
                  <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 space-y-2">
                    <h5 className="text-xs font-semibold text-neutral-300">Generated Lyrics & Structure:</h5>
                    <p className="text-xs text-neutral-400 whitespace-pre-wrap font-mono leading-relaxed">
                      {generatedLyrics}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center space-y-3 text-neutral-500">
                <Music className="w-12 h-12 mx-auto stroke-1 text-neutral-600" />
                <p className="text-sm font-medium text-neutral-400">Lyria Audio Player</p>
                <p className="text-xs text-neutral-500 max-w-xs">
                  Generate 30-second clips or full musical arrangements with matching lyrics and high-fidelity sound.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. TEXT TO SPEECH (TTS) */}
      {activeSubTab === 'tts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-5 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                Text to Speech (TTS)
              </h3>
              <p className="text-xs text-neutral-400">
                Generate lifelike speech using model: <span className="font-mono text-neutral-300">gemini-3.1-flash-tts-preview</span>.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-300">Select Voice</label>
              <div className="grid grid-cols-5 gap-2">
                {(['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'] as const).map((v) => (
                  <button
                    key={v}
                    id={`voice-btn-${v.toLowerCase()}`}
                    onClick={() => setTtsVoice(v)}
                    className={`py-2 text-xs font-medium rounded-xl border transition ${
                      ttsVoice === v
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-300">Text to Speak</label>
              <textarea
                id="tts-text-input"
                rows={4}
                value={ttsText}
                onChange={(e) => setTtsText(e.target.value)}
                placeholder="Enter text to speak..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <button
              id="generate-tts-btn"
              onClick={handleGenerateTTS}
              disabled={ttsLoading || !ttsText}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl transition shadow-lg shadow-emerald-600/20 text-sm"
            >
              {ttsLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing voice audio...</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>Synthesize Voice ({ttsVoice})</span>
                </>
              )}
            </button>
          </div>

          <div className="lg:col-span-6 bg-neutral-900/40 border border-neutral-800 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[320px]">
            {ttsAudioUrl ? (
              <div className="w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-100">Synthesized Speech</h4>
                    <p className="text-xs text-neutral-400">gemini-3.1-flash-tts-preview ({ttsVoice})</p>
                  </div>
                </div>
                <audio controls className="w-full" src={ttsAudioUrl} autoPlay>
                  Your browser does not support audio playback.
                </audio>
              </div>
            ) : (
              <div className="text-center space-y-2 text-neutral-500">
                <Volume2 className="w-10 h-10 mx-auto stroke-1" />
                <p className="text-sm font-medium text-neutral-400">Audio Playback Console</p>
                <p className="text-xs text-neutral-500">Synthesize expressive human speech with Gemini TTS.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. AUDIO TRANSCRIBER */}
      {activeSubTab === 'transcribe' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-5 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
                <Mic className="w-4 h-4 text-purple-400" />
                Audio Transcriber
              </h3>
              <p className="text-xs text-neutral-400">
                Record with your microphone to transcribe audio with model: <span className="font-mono text-neutral-300">gemini-3.5-transcribe</span>.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center p-8 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-4 text-center">
              <button
                id="mic-record-btn"
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition shadow-xl ${
                  isRecording
                    ? 'bg-rose-600 text-white animate-pulse shadow-rose-600/30'
                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
                }`}
              >
                <Mic className="w-8 h-8" />
              </button>
              <div>
                <p className="text-sm font-semibold text-neutral-200">
                  {isRecording ? 'Listening... Click to stop and transcribe' : 'Click to Speak'}
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  {isRecording ? 'Capturing live audio from microphone...' : 'Microphone streaming enabled'}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 bg-neutral-900/40 border border-neutral-800 rounded-2xl p-6 flex flex-col justify-center min-h-[320px]">
            {transcribeLoading ? (
              <div className="text-center space-y-3">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
                <p className="text-sm font-medium text-neutral-200">Transcribing speech with Gemini 3.5 Transcribe...</p>
              </div>
            ) : transcribedText ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Verbatim Transcription</h4>
                  <span className="text-[11px] font-mono text-purple-400">gemini-3.5-transcribe</span>
                </div>
                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-neutral-200 leading-relaxed max-h-72 overflow-y-auto">
                  {transcribedText}
                </div>
              </div>
            ) : (
              <div className="text-center space-y-2 text-neutral-500">
                <Mic className="w-10 h-10 mx-auto stroke-1" />
                <p className="text-sm font-medium text-neutral-400">Transcription Result</p>
                <p className="text-xs text-neutral-500">Press the microphone button to record and view text output.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. LIVE VOICE CONVERSATION (gemini-3.8-live) */}
      {activeSubTab === 'live' && (
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-8 space-y-6">
          <div className="max-w-2xl mx-auto text-center space-y-2">
            <h3 className="text-lg font-bold text-neutral-100 flex items-center justify-center gap-2">
              <Radio className="w-5 h-5 text-rose-500" />
              Real-Time Voice Conversations (Live API)
            </h3>
            <p className="text-xs text-neutral-400">
              Interactive voice conversations powered by <span className="font-mono text-neutral-300">gemini-3.8-live</span>.
            </p>
          </div>

          <div className="max-w-xl mx-auto flex flex-col items-center justify-center p-8 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-6">
            <div className="relative">
              <div
                className={`w-24 h-24 rounded-full flex items-center justify-center transition duration-500 ${
                  isLiveActive
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                    : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                }`}
              >
                <Radio className="w-10 h-10" />
              </div>
              {isLiveActive && (
                <div className="absolute -inset-2 rounded-full border border-rose-500/30 animate-ping" />
              )}
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-sm font-semibold text-neutral-200">
                {isLiveActive ? 'Live Voice Session Active' : 'Live Voice Session Idle'}
              </h4>
              <p className="text-xs text-neutral-400">
                {isLiveActive
                  ? 'Real-time bidirectional audio streaming running on gemini-3.8-live'
                  : 'Start session to speak directly to Gemini with low-latency voice responses.'}
              </p>
            </div>

            <button
              id="toggle-live-session-btn"
              onClick={() => setIsLiveActive(!isLiveActive)}
              className={`px-6 py-2.5 rounded-xl text-xs font-semibold transition ${
                isLiveActive
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
              }`}
            >
              {isLiveActive ? 'Disconnect Live Session' : 'Connect Live Voice API'}
            </button>
          </div>

          {/* Live Transcript Log */}
          <div className="max-w-xl mx-auto bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-3">
            <div className="text-xs font-semibold text-neutral-400">Session Transcript</div>
            <div className="space-y-2 max-h-48 overflow-y-auto text-xs">
              {liveTranscript.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg ${
                    msg.role === 'assistant'
                      ? 'bg-neutral-900 border border-neutral-800 text-neutral-300'
                      : 'bg-blue-600/10 border border-blue-500/20 text-blue-300'
                  }`}
                >
                  <span className="font-semibold text-neutral-400 uppercase text-[10px] block mb-0.5">
                    {msg.role}
                  </span>
                  {msg.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
