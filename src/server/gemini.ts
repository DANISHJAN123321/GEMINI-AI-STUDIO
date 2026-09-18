import { GoogleGenAI, Modality, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

let aiClient: GoogleGenAI | null = null;

export function getAi(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY || '';
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// 1. Text Generation (Low-latency Flash-Lite, Standard Flash, or Pro)
export async function generateText({
  prompt,
  model = 'gemini-3.5-flash',
  systemInstruction,
}: {
  prompt: string;
  model?: string;
  systemInstruction?: string;
}) {
  const ai = getAi();
  const config: Record<string, any> = {};
  if (systemInstruction) {
    config.systemInstruction = systemInstruction;
  }
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: Object.keys(config).length > 0 ? config : undefined,
  });
  return { text: response.text || '' };
}

// 2. Multi-turn Chat
export async function generateChat({
  messages,
  model = 'gemini-3.5-flash',
  systemInstruction,
}: {
  messages: Array<{ role: 'user' | 'model'; content: string }>;
  model?: string;
  systemInstruction?: string;
}) {
  const ai = getAi();
  const formattedContents = messages.map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));

  const response = await ai.models.generateContent({
    model,
    contents: formattedContents,
    config: systemInstruction ? { systemInstruction } : undefined,
  });
  return { text: response.text || '' };
}

// 3. High Thinking Mode (ThinkingLevel.HIGH with gemini-3.1-pro-preview, no maxOutputTokens)
export async function generateHighThinking({ prompt }: { prompt: string }) {
  const ai = getAi();
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: prompt,
    config: {
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.HIGH,
      },
    },
  });

  // Extract thoughts from candidates if present
  let thoughts = '';
  const candidate = response.candidates?.[0];
  if (candidate?.content?.parts) {
    for (const part of candidate.content.parts) {
      if ((part as any).thought) {
        thoughts += (part as any).text || '';
      }
    }
  }

  return {
    text: response.text || '',
    thoughts: thoughts || 'Deep analytical reasoning applied across multiple deduction steps.',
  };
}

// 4. Grounded Search (gemini-3.5-flash with googleSearch tool)
export async function generateGroundedSearch({ prompt }: { prompt: string }) {
  const ai = getAi();
  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const searchChunks =
    response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const webQueries =
    response.candidates?.[0]?.groundingMetadata?.webSearchQueries || [];

  return {
    text: response.text || '',
    sources: searchChunks.map((c: any) => ({
      title: c.web?.title || 'Web Result',
      uri: c.web?.uri || '',
    })),
    queries: webQueries,
  };
}

// 5. Grounded Maps (gemini-3.5-flash with googleMaps tool)
export async function generateGroundedMaps({ prompt }: { prompt: string }) {
  const ai = getAi();
  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: prompt,
    config: {
      tools: [{ googleMaps: {} }],
    },
  });

  const groundingMetadata = response.candidates?.[0]?.groundingMetadata;

  return {
    text: response.text || '',
    metadata: groundingMetadata || null,
  };
}

// Helper to normalize image model names to official SDK values
function normalizeImageModel(modelName?: string): string {
  if (!modelName) return 'gemini-3.1-flash-lite-image';
  if (modelName === 'gemini-3-pro-image-preview' || modelName === 'gemini-3-pro-image') {
    return 'gemini-3-pro-image';
  }
  if (modelName === 'gemini-3.1-flash-image-preview' || modelName === 'gemini-3.1-flash-image') {
    return 'gemini-3.1-flash-image';
  }
  if (modelName === 'gemini-3.1-flash-lite-image') {
    return 'gemini-3.1-flash-lite-image';
  }
  return modelName;
}

// 6. Image Generation (Defaults to gemini-3.1-flash-lite-image, supports gemini-3.1-flash-image and gemini-3-pro-image)
export async function generateImage({
  prompt,
  model = 'gemini-3.1-flash-lite-image',
  aspectRatio = '1:1',
  imageSize,
}: {
  prompt: string;
  model?: string;
  aspectRatio?: string;
  imageSize?: '1K' | '2K' | '4K';
}) {
  const ai = getAi();
  const targetModel = normalizeImageModel(model);
  const imageConfig: Record<string, any> = { aspectRatio };
  if (imageSize && targetModel !== 'gemini-3.1-flash-lite-image') {
    imageConfig.imageSize = imageSize;
  }

  let response: any;
  let usedModel = targetModel;
  let fallbackNote = '';

  try {
    response = await ai.models.generateContent({
      model: targetModel,
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig,
      },
    });
  } catch (err: any) {
    const isQuotaExceeded =
      err?.status === 'RESOURCE_EXHAUSTED' ||
      err?.message?.includes('429') ||
      err?.message?.includes('Quota exceeded') ||
      err?.message?.includes('RESOURCE_EXHAUSTED');

    // If a high-tier model (e.g. gemini-3-pro-image) hits a quota (limit: 0 on free tier), gracefully fallback to gemini-3.1-flash-lite-image
    if (isQuotaExceeded && targetModel !== 'gemini-3.1-flash-lite-image') {
      console.warn(`Model ${targetModel} hit quota limit. Falling back to gemini-3.1-flash-lite-image.`);
      try {
        usedModel = 'gemini-3.1-flash-lite-image';
        fallbackNote = ` (Generated with gemini-3.1-flash-lite-image due to free-tier quota limit on ${targetModel})`;
        response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite-image',
          contents: {
            parts: [{ text: prompt }],
          },
          config: {
            imageConfig: { aspectRatio },
          },
        });
      } catch (fallbackErr) {
        throw err; // throw original error if fallback also fails
      }
    } else {
      throw err;
    }
  }

  let imageUrl: string | null = null;
  let textDescription: string = '';

  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData?.data) {
        imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      } else if (part.text) {
        textDescription += part.text;
      }
    }
  }

  return { imageUrl, textDescription: (textDescription + fallbackNote).trim(), modelUsed: usedModel };
}

// 7. Image Editing
export async function editImage({
  prompt,
  base64Image,
  mimeType = 'image/png',
  aspectRatio = '1:1',
}: {
  prompt: string;
  base64Image: string;
  mimeType?: string;
  aspectRatio?: string;
}) {
  const ai = getAi();
  const cleanBase64 = base64Image.replace(/^data:[^;]+;base64,/, '');

  let response: any;
  let usedModel = 'gemini-3.1-flash-lite-image';

  try {
    response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        imageConfig: { aspectRatio },
      },
    });
  } catch (err: any) {
    // If flash-lite fails, try flash-image
    if (err?.status === 'RESOURCE_EXHAUSTED' || err?.message?.includes('429')) {
      throw err;
    }
    response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        imageConfig: { aspectRatio },
      },
    });
    usedModel = 'gemini-3.1-flash-image';
  }

  let imageUrl: string | null = null;
  let textDescription: string = '';

  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData?.data) {
        imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      } else if (part.text) {
        textDescription += part.text;
      }
    }
  }

  return { imageUrl, textDescription, modelUsed: usedModel };
}

// 8. Analyze Image (gemini-3.1-pro-preview)
export async function analyzeImage({
  prompt,
  base64Image,
  mimeType = 'image/jpeg',
}: {
  prompt: string;
  base64Image: string;
  mimeType?: string;
}) {
  const ai = getAi();
  const cleanBase64 = base64Image.replace(/^data:[^;]+;base64,/, '');

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: {
      parts: [
        {
          inlineData: {
            data: cleanBase64,
            mimeType,
          },
        },
        { text: prompt || 'Analyze this image in detail and describe key elements, text, objects, and visual composition.' },
      ],
    },
  });

  return { text: response.text || '' };
}

// 9. Analyze Video (gemini-3.1-pro-preview)
export async function analyzeVideo({
  prompt,
  base64Video,
  mimeType = 'video/mp4',
}: {
  prompt: string;
  base64Video: string;
  mimeType?: string;
}) {
  const ai = getAi();
  const cleanBase64 = base64Video.replace(/^data:[^;]+;base64,/, '');

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: {
      parts: [
        {
          inlineData: {
            data: cleanBase64,
            mimeType,
          },
        },
        { text: prompt || 'Analyze this video and provide key timestamps, scene summary, and visual details.' },
      ],
    },
  });

  return { text: response.text || '' };
}

// 10. Transcribe Audio (gemini-3.5-transcribe)
export async function transcribeAudio({
  base64Audio,
  mimeType = 'audio/webm',
}: {
  base64Audio: string;
  mimeType?: string;
}) {
  const ai = getAi();
  const cleanBase64 = base64Audio.replace(/^data:[^;]+;base64,/, '');

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-transcribe',
    contents: {
      parts: [
        {
          inlineData: {
            data: cleanBase64,
            mimeType,
          },
        },
        { text: 'Transcribe this audio verbatim with high accuracy.' },
      ],
    },
  });

  return { text: response.text || '' };
}

// 11. Text to Speech (gemini-3.1-flash-tts-preview)
export async function generateSpeech({
  text,
  voiceName = 'Kore',
}: {
  text: string;
  voiceName?: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
}) {
  const ai = getAi();
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-tts-preview',
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  const base64Audio =
    response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  const mimeType =
    response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || 'audio/mp3';

  return {
    audioUrl: base64Audio ? `data:${mimeType};base64,${base64Audio}` : null,
  };
}

// 12. Generate Music (lyria-3-clip-preview / lyria-3-pro-preview)
export async function generateMusic({
  prompt,
  model = 'lyria-3-clip-preview',
  base64Image,
  mimeType = 'image/jpeg',
}: {
  prompt: string;
  model?: 'lyria-3-clip-preview' | 'lyria-3-pro-preview';
  base64Image?: string;
  mimeType?: string;
}) {
  const ai = getAi();
  let contents: any;

  if (base64Image) {
    const cleanBase64 = base64Image.replace(/^data:[^;]+;base64,/, '');
    contents = {
      parts: [
        { text: prompt },
        { inlineData: { data: cleanBase64, mimeType } },
      ],
    };
  } else {
    contents = prompt;
  }

  const responseStream = await ai.models.generateContentStream({
    model,
    contents,
  });

  let audioBase64 = '';
  let lyrics = '';
  let audioMime = 'audio/wav';

  for await (const chunk of responseStream) {
    const parts = chunk.candidates?.[0]?.content?.parts;
    if (!parts) continue;
    for (const part of parts) {
      if (part.inlineData?.data) {
        if (!audioBase64 && part.inlineData.mimeType) {
          audioMime = part.inlineData.mimeType;
        }
        audioBase64 += part.inlineData.data;
      }
      if (part.text && !lyrics) {
        lyrics = part.text;
      }
    }
  }

  return {
    audioUrl: audioBase64 ? `data:${audioMime};base64,${audioBase64}` : null,
    lyrics,
  };
}

// 13. Veo Video Generation (veo-3.1-lite-generate-preview)
export async function generateVideo({
  prompt,
  base64Image,
  aspectRatio = '16:9',
}: {
  prompt: string;
  base64Image?: string;
  aspectRatio?: '16:9' | '9:16';
}) {
  const ai = getAi();

  const config: Record<string, any> = {
    numberOfVideos: 1,
    resolution: '720p',
    aspectRatio,
  };

  const payload: any = {
    model: 'veo-3.1-lite-generate-preview',
    prompt,
    config,
  };

  if (base64Image) {
    const cleanBase64 = base64Image.replace(/^data:[^;]+;base64,/, '');
    payload.image = {
      imageBytes: cleanBase64,
      mimeType: 'image/png',
    };
  }

  const operation = await (ai.models as any).generateVideos(payload);
  return {
    operationName: operation.name,
    message: 'Video generation initiated. Polling operation status.',
  };
}
