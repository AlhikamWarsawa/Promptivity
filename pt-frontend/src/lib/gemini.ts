/* ============================================
   Promptivity — Backend API Client
   Connects frontend to FastAPI backend.
   ============================================ */

import type { PTSession, Personalization } from '@/types/pt.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export interface ProcessStoryRequest {
  story:           string;
  personalization?: Partial<Personalization>;
}

export interface ProcessStoryResponse {
  success: boolean;
  data?:   PTSession;
  error?:  string;
}

/**
 * Send story to Promptivity backend for AI processing.
 * Backend calls Gemini and returns structured PTSession.
 */
export async function processStory(
  request: ProcessStoryRequest,
): Promise<ProcessStoryResponse> {
  const controller = new AbortController();
  // 90 second timeout (Gemini can be slow for 13 frameworks)
  const timeoutId  = setTimeout(() => controller.abort(), 90_000);

  try {
    const response = await fetch(`${API_BASE_URL}/api/process-story`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(request),
      signal:  controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429) {
        return {
          success: false,
          error:   'Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.',
        };
      }
      return {
        success: false,
        error:   `Server error: ${response.status}`,
      };
    }

    const data = await response.json() as ProcessStoryResponse;
    return data;

  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        success: false,
        error:   'Request timeout. Gemini membutuhkan waktu lebih lama. Coba lagi.',
      };
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        success: false,
        error:   'Tidak bisa terhubung ke server. Pastikan backend berjalan di port 8000.',
      };
    }

    return {
      success: false,
      error:   'Terjadi kesalahan tidak terduga. Coba lagi.',
    };
  }
}
