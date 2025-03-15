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
  current: Language;
};

export async function fetchLanguages(): Promise<LanguageState> {
  try {
    const response = await fetch(`${BACKEND_URL}/available_languages`);
    if (!response.ok) {
      throw new Error(`Failed to fetch languages: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching languages:', error);
    // Return sensible defaults
    return { available: [], loaded: [], current: Language.English };
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
