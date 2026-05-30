import type { PTSession, Personalization } from '@/types/pt.types';
import { parseSession, parseFrameworkOutput } from '@/lib/parsers';

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

export interface FrameworkAPIResult {
  success: boolean;
  data?:   any;
  error?:   string;
}

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
        return { success: false, error: 'Terlalu banyak permintaan.' };
      }
      const errBody = await response.json().catch(() => ({}));
      return { success: false, error: (errBody as { detail?: string }).detail ?? `Server error: ${response.status}` };
    }

    const body = await response.json();
    if (!body.success) return { success: false, error: body.error };

    const session = parseSession(
      body.data,
      input.rawText,
      input.personalization as Personalization | undefined,
    );

    return { success: true, session };
  } catch (error) {
    clearTimeout(timeoutId);
    return { success: false, error: 'Terjadi kesalahan tidak terduga.' };
  }
}

/**
 * Generate specific framework data on demand.
 */
export async function generateFrameworkAPI(
  sessionId:   string,
  frameworkId: string,
): Promise<FrameworkAPIResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/generate-framework`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ sessionId, frameworkId }),
    });

    if (!response.ok) {
      return { success: false, error: `Server error: ${response.status}` };
    }

    const body = await response.json();
    if (!body.success) return { success: false, error: body.error };

    // Parse the framework-specific output using our existing parser logic
    const fwOutput = parseFrameworkOutput(frameworkId as any, body.data, { ensureContent: true });

    return { success: true, data: fwOutput };
  } catch (error) {
    return { success: false, error: 'Koneksi ke server gagal.' };
  }
}
