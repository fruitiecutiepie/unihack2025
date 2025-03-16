from enum import Enum
from typing import Dict, List, Literal, TypedDict, Optional

class LanguageCode(str, Enum):
    ENGLISH = "EN"
    SPANISH = "ES"
    FRENCH = "FR"
    CHINESE = "CN"
    RUSSIAN = "RU"
    GERMAN = "DE"
    JAPANESE = "JA"
    KOREAN = "KO"

LanguageStatus = Literal["loaded", "downloading", "not-loaded"]

class Language(TypedDict):
    code: LanguageCode
    name: str
    status: LanguageStatus

def get_language_name(code: LanguageCode) -> str:
    language_names = {
        LanguageCode.ENGLISH: "English",
        LanguageCode.SPANISH: "Español (Spanish)",
        LanguageCode.FRENCH: "Français (French)", 
        LanguageCode.CHINESE: "中文 (Chinese)",
        LanguageCode.RUSSIAN: "Русский (Russian)",
        LanguageCode.GERMAN: "Deutsch (German)",
        LanguageCode.JAPANESE: "日本語 (Japanese)",
        LanguageCode.KOREAN: "한국어 (Korean)"
    }
    return language_names.get(code, "Unknown")

def create_language(code: LanguageCode, status: LanguageStatus) -> Language:
    return {
        "code": code,
        "name": get_language_name(code),
        "status": status
    }