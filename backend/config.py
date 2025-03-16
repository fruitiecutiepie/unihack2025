import os

MODEL_BASE_URL = os.path.abspath(os.path.join(os.path.dirname(__file__), "models"))

AVAILABLE_MODELS = {
    "EN": {"name": "vosk-model-small-en-us-0.15", "url": "vosk-model-small-en-us-0.15.zip"},
    "ES": {"name": "vosk-model-small-es-0.42", "url": "vosk-model-small-es-0.42.zip"},
    "FR": {"name": "vosk-model-small-fr-0.22", "url": "vosk-model-small-fr-0.22.zip"},
    "CN": {"name": "vosk-model-small-cn-0.22", "url": "vosk-model-small-cn-0.22.zip"},
    "RU": {"name": "vosk-model-small-ru-0.22", "url": "vosk-model-small-ru-0.22.zip"},
    "DE": {"name": "vosk-model-small-de-0.15", "url": "vosk-model-small-de-0.15.zip"},
    "JA": {"name": "vosk-model-small-ja-0.22", "url": "vosk-model-small-ja-0.22.zip"},
    "KO": {"name": "vosk-model-small-ko-0.22", "url": "vosk-model-small-ko-0.22.zip"}
}
