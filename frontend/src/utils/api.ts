import { BACKEND_URL } from "@/app/page";

export enum Language {
  English = 'en',
  Spanish = 'es',
  French = 'fr',
  Chinese = 'cn',
  Russian = 'ru',
  German = 'de',
  Japanese = 'ja',
  Korean = 'ko',
}

export type LanguageState = {
  available: Language[];
  loaded: Language[];
  currentSource: Language;
  currentTarget: Language;
}

export async function fetchLanguages(): Promise<LanguageState | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/available_languages`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch languages: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Received non-JSON response:', contentType);

      // Log the actual response content for debugging
      const text = await response.text();
      console.error('Response content:', text.substring(0, 200) + '...');

      return null;
    }

    console.log('response', response);
    return await response.json();
  } catch (error) {
    console.error('Error fetching languages:', error);
    // Return sensible defaults
    return null;
  }
}

export async function changeLanguage(lang: string): Promise<{ status: string; message: string; language?: string }> {
  try {
    const response = await fetch(`${BACKEND_URL}/set_language`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ lang }),
    });

    if (!response.ok) {
      throw new Error(`Failed to change language: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error changing language:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to change language'
    };
  }
}
