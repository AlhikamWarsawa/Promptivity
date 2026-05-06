// PT Gemini client — placeholder
// TODO: Implement Gemini API client in Day 6

export async function processStoryWithGemini(story: string, personalization?: Record<string, unknown>): Promise<unknown> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const response = await fetch(`${apiUrl}/api/process-story`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ story, personalization }),
  });

  if (!response.ok) {
    throw new Error('Failed to process story');
  }

  return response.json();
}
