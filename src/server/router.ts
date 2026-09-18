import express, { Request, Response } from 'express';
import {
  generateText,
  generateChat,
  generateHighThinking,
  generateGroundedSearch,
  generateGroundedMaps,
  generateImage,
  editImage,
  analyzeImage,
  analyzeVideo,
  transcribeAudio,
  generateSpeech,
  generateMusic,
  generateVideo,
} from './gemini.ts';

export const apiRouter = express.Router();

apiRouter.use(express.json({ limit: '50mb' }));
apiRouter.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper wrapper for async routes
const asyncHandler =
  (fn: (req: Request, res: Response) => Promise<any>) =>
  (req: Request, res: Response) => {
    fn(req, res).catch((err: any) => {
      console.error('API Error:', err);
      const isQuota =
        err?.status === 'RESOURCE_EXHAUSTED' ||
        err?.message?.includes('429') ||
        err?.message?.includes('Quota exceeded') ||
        err?.message?.includes('RESOURCE_EXHAUSTED');

      const statusCode = isQuota ? 429 : 500;
      let userFriendlyMessage = err?.message || 'An unexpected error occurred processing your request';

      if (isQuota) {
        userFriendlyMessage = `Gemini API Quota Exceeded: This model requires an API key with paid billing enabled. Please switch to Flash Lite or configure a paid API key in AI Studio Settings > Secrets.`;
      }

      res.status(statusCode).json({
        error: userFriendlyMessage,
        isQuotaExceeded: isQuota,
        details: err?.message || '',
      });
    });
  };

// 1. Text Generation & Fast Low-Latency
apiRouter.post(
  '/gemini/generate',
  asyncHandler(async (req, res) => {
    const { prompt, model, systemInstruction } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
    const data = await generateText({ prompt, model, systemInstruction });
    res.json(data);
  })
);

// 2. Chatbot Multi-turn
apiRouter.post(
  '/gemini/chat',
  asyncHandler(async (req, res) => {
    const { messages, model, systemInstruction } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }
    const data = await generateChat({ messages, model, systemInstruction });
    res.json(data);
  })
);

// 3. High Thinking
apiRouter.post(
  '/gemini/thinking',
  asyncHandler(async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
    const data = await generateHighThinking({ prompt });
    res.json(data);
  })
);

// 4. Grounded Search
apiRouter.post(
  '/gemini/search',
  asyncHandler(async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
    const data = await generateGroundedSearch({ prompt });
    res.json(data);
  })
);

// 5. Grounded Maps
apiRouter.post(
  '/gemini/maps',
  asyncHandler(async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
    const data = await generateGroundedMaps({ prompt });
    res.json(data);
  })
);

// 6. Image Generation
apiRouter.post(
  '/gemini/image',
  asyncHandler(async (req, res) => {
    const { prompt, model, aspectRatio, imageSize } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
    const data = await generateImage({ prompt, model, aspectRatio, imageSize });
    res.json(data);
  })
);

// 7. Image Editing
apiRouter.post(
  '/gemini/image-edit',
  asyncHandler(async (req, res) => {
    const { prompt, base64Image, mimeType, aspectRatio } = req.body;
    if (!prompt || !base64Image) {
      return res.status(400).json({ error: 'Prompt and base64Image are required' });
    }
    const data = await editImage({ prompt, base64Image, mimeType, aspectRatio });
    res.json(data);
  })
);

// 8. Analyze Image
apiRouter.post(
  '/gemini/image-analyze',
  asyncHandler(async (req, res) => {
    const { prompt, base64Image, mimeType } = req.body;
    if (!base64Image) {
      return res.status(400).json({ error: 'base64Image is required' });
    }
    const data = await analyzeImage({ prompt, base64Image, mimeType });
    res.json(data);
  })
);

// 9. Analyze Video
apiRouter.post(
  '/gemini/video-analyze',
  asyncHandler(async (req, res) => {
    const { prompt, base64Video, mimeType } = req.body;
    if (!base64Video) {
      return res.status(400).json({ error: 'base64Video is required' });
    }
    const data = await analyzeVideo({ prompt, base64Video, mimeType });
    res.json(data);
  })
);

// 10. Transcribe Audio
apiRouter.post(
  '/gemini/transcribe',
  asyncHandler(async (req, res) => {
    const { base64Audio, mimeType } = req.body;
    if (!base64Audio) {
      return res.status(400).json({ error: 'base64Audio is required' });
    }
    const data = await transcribeAudio({ base64Audio, mimeType });
    res.json(data);
  })
);

// 11. TTS
apiRouter.post(
  '/gemini/tts',
  asyncHandler(async (req, res) => {
    const { text, voiceName } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });
    const data = await generateSpeech({ text, voiceName });
    res.json(data);
  })
);

// 12. Generate Music
apiRouter.post(
  '/gemini/music',
  asyncHandler(async (req, res) => {
    const { prompt, model, base64Image, mimeType } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
    const data = await generateMusic({ prompt, model, base64Image, mimeType });
    res.json(data);
  })
);

// 13. Veo Video Generation
apiRouter.post(
  '/gemini/video',
  asyncHandler(async (req, res) => {
    const { prompt, base64Image, aspectRatio } = req.body;
    if (!prompt && !base64Image) {
      return res.status(400).json({ error: 'Prompt or base64Image is required' });
    }
    const data = await generateVideo({ prompt, base64Image, aspectRatio });
    res.json(data);
  })
);
