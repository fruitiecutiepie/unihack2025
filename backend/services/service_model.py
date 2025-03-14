import os
import zipfile
import io
import requests
from vosk import Model
from config import MODEL_BASE_URL, AVAILABLE_MODELS

models = {}
current_language = "en"

def download_and_load_model(lang_code):
    global models
    
    if lang_code in models:
        return True

    model_info = AVAILABLE_MODELS.get(lang_code)
    model_dir = os.path.join(MODEL_BASE_URL, model_info["name"])

    if not os.path.exists(model_dir):
        try:
            response = requests.get(f"https://alphacephei.com/vosk/models/{model_info['url']}", stream=True)
            with zipfile.ZipFile(io.BytesIO(response.content)) as z:
                z.extractall(MODEL_BASE_URL)
        except Exception as e:
            print(f"Error downloading model: {e}")
            return False

    models[lang_code] = Model(model_dir)
    return True

download_and_load_model(current_language)
