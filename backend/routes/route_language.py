from flask import Blueprint
from services.service_model import download_and_load_model, models, current_language, AVAILABLE_MODELS

language_routes = Blueprint("language_routes", __name__)

@language_routes.route("/set_language", methods=["POST"])
def set_language():
    lang = request.form.get("lang", "").lower()

    if lang in AVAILABLE_MODELS:
        success = download_and_load_model(lang)
        if success:
            return f"Language switched to {lang.upper()}", 200
        else:
            return f"Failed to load {lang.upper()} model", 500
    return "Invalid language", 400

@language_routes.route("/available_languages", methods=["GET"])
def available_languages():
    return {
        "available": list(AVAILABLE_MODELS.keys()),
        "loaded": list(models.keys()),
        "current": current_language
    }
