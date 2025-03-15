import os

MODEL_BASE_URL = os.path.abspath(os.path.join(os.path.dirname(__file__), "models"))

AVAILABLE_MODELS = {
    "en": {"name": "vosk-model-small-en-us-0.15", "url": "vosk-model-small-en-us-0.15.zip"},
    "es": {"name": "vosk-model-small-es-0.42", "url": "vosk-model-small-es-0.42.zip"},
    "fr": {"name": "vosk-model-small-fr-0.22", "url": "vosk-model-small-fr-0.22.zip"},
    "cn": {"name": "vosk-model-small-cn-0.22", "url": "vosk-model-small-cn-0.22.zip"},
    "ru": {"name": "vosk-model-small-ru-0.22", "url": "vosk-model-small-ru-0.22.zip"},
    "de": {"name": "vosk-model-small-de-0.15", "url": "vosk-model-small-de-0.15.zip"},
    "ja": {"name": "vosk-model-small-ja-0.22", "url": "vosk-model-small-ja-0.22.zip"},
    "ko": {"name": "vosk-model-small-ko-0.22", "url": "vosk-model-small-ko-0.22.zip"}
}
