import torch
from transformers import MarianMTModel, MarianTokenizer

translation_models = {}
tokenizers = {}
target_language = "en"  # default target language

# Map language codes to MarianMT model names
TRANSLATION_MODEL_NAMES = {
    'en-es': 'Helsinki-NLP/opus-mt-en-es',
    'en-fr': 'Helsinki-NLP/opus-mt-en-fr',
    'en-de': 'Helsinki-NLP/opus-mt-en-de',
    'en-ru': 'Helsinki-NLP/opus-mt-en-ru',
    'en-zh': 'Helsinki-NLP/opus-mt-en-zh',
    'en-ja': 'Helsinki-NLP/opus-mt-en-jap',
    
    'es-en': 'Helsinki-NLP/opus-mt-es-en',
    'fr-en': 'Helsinki-NLP/opus-mt-fr-en',
    'de-en': 'Helsinki-NLP/opus-mt-de-en',
    'ru-en': 'Helsinki-NLP/opus-mt-ru-en',
    'zh-en': 'Helsinki-NLP/opus-mt-zh-en',
    'ja-en': 'Helsinki-NLP/opus-mt-ja-en',
}

# Attempt GPU usage if desired
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

def get_translation_model(source_lang, target_lang):
    """Load or retrieve cached translation model on the chosen DEVICE."""
    lang_pair = f"{source_lang}-{target_lang}"

    if lang_pair not in TRANSLATION_MODEL_NAMES:
        print(f"[Translation] No translation model available for {lang_pair}")
        return None, None

    # Return cached model/tokenizer if available
    if lang_pair in translation_models:
        return translation_models[lang_pair], tokenizers[lang_pair]

    # Otherwise, load a new model into cache
    try:
        model_name = TRANSLATION_MODEL_NAMES[lang_pair]
        print(f"[Translation] Loading model for {lang_pair}: {model_name}")
        tokenizer = MarianTokenizer.from_pretrained(model_name)
        model = MarianMTModel.from_pretrained(model_name).to(DEVICE)

        translation_models[lang_pair] = model
        tokenizers[lang_pair] = tokenizer
        return model, tokenizer
    except Exception as e:
        print(f"[Translation] Error loading model for {lang_pair}: {e}")
        return None, None

def translate_text(text, source_lang, target_lang):
    """
    Translate `text` from `source_lang` to `target_lang`.
    Uses a cached MarianMTModel on the chosen DEVICE.
    """
    # If source and target are the same, skip translation
    if source_lang == target_lang:
        return text

    model, tokenizer = get_translation_model(source_lang, target_lang)
    if not model or not tokenizer:
        print(f"[Translation] Cannot translate from {source_lang} to {target_lang}")
        return text

    try:
        inputs = tokenizer([text], return_tensors="pt", padding=True, truncation=True).to(DEVICE)
        translated_tokens = model.generate(**inputs)
        translated_text = tokenizer.batch_decode(translated_tokens, skip_special_tokens=True)
        return translated_text[0]
    except Exception as e:
        print(f"[Translation] Translation error: {e}")
        return text
