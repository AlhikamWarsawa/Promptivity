/* ============================================
   Promptivity — Backend API Client
   Updated Day 7: integrate with parseSession
   ============================================ */

import type { PTSession, Personalization } from '@/types/pt.types';
import { parseSession, validateSession }    from '@/lib/parsers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export interface ProcessStoryInput {
  rawText:          string;
  personalization?: Partial<Personalization>;
}

export interface APIResult {
  success: boolean;
  session?: PTSession;
  error?:   string;
}

/**
 * Send story to Promptivity backend.
 * Parses and validates response before returning.
 * Never throws — always returns APIResult.
 */
export async function processStoryAPI(
  input: ProcessStoryInput,
): Promise<APIResult> {
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 90_000);

  try {
    const response = await fetch(`${API_BASE_URL}/api/process-story`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        story:           input.rawText,
        personalization: input.personalization ?? null,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429) {
        return {
          success: false,
          error:   'Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.',
        };
      }
      const errBody = await response.json().catch(() => ({}));
      return {
        success: false,
        error:   (errBody as { detail?: string }).detail ?? `Server error: ${response.status}`,
      };
    }

    const body = await response.json();

    if (!body.success) {
      return {
        success: false,
        error:   body.error ?? 'Moti gagal memproses ceritamu. Coba lagi.',
      };
    }

    // Parse raw data → typed PTSession
    const session = parseSession(
      body.data,
      input.rawText,
      input.personalization as Personalization | undefined,
    );

    // Validate (log issues but don't fail)
    const { valid, issues } = validateSession(session);
    if (!valid) {
      console.warn('[Promptivity] Session validation issues:', issues);
      // Still return session — parser already filled defaults
    }

    return { success: true, session };

  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        success: false,
        error:   'Request timeout (90s). Gemini butuh waktu lebih lama dari biasanya. Coba lagi.',
      };
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        success: false,
        error:   'Tidak bisa terhubung ke server. Pastikan backend berjalan di port 8000.',
      };
    }

    console.error('[Promptivity] Unexpected API error:', error);
    return {
      success: false,
      error:   'Terjadi kesalahan tidak terduga. Coba lagi.',
    };
  }
}
