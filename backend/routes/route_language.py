from typing import List

from flask import Blueprint, request, jsonify
from flask_cors import cross_origin

from services.service_model import download_and_load_model, models, AVAILABLE_MODELS
from services.service_language import Language, LanguageCode, get_language_name

import services.service_model as service_model

language_routes = Blueprint("language_routes", __name__)

# @language_routes.route("/set_language", methods=["POST"])
# @cross_origin()
# def set_language():
#     data = request.get_json() if request.is_json else request.form
#     lang = data.get("lang", "").lower()

#     if lang in AVAILABLE_MODELS:
#         success = download_and_load_model(lang)
#         if success:
#             from services.service_audio import update_recognizer
#             service_model.current_language = lang
#             update_recognizer()
#             return jsonify({
#                 "status": "success",
#                 "message": f"Language switched to {lang.upper()}",
#                 "language": lang
#             }), 200
#         else:
#             return jsonify({
#                 "status": "error",
#                 "message": f"Failed to load {lang.upper()} model"
#             }), 500
#     return jsonify({
#         "status": "error",
#         "message": "Invalid language"
#     }), 400


@language_routes.route("/available_languages", methods=["GET"])
@cross_origin()
def available_languages() -> List[Language]:
    return jsonify([{
        "code": lang,
        "name": get_language_name(lang),
        "status": "loaded" if lang in models else "not-loaded"
    } for lang in LanguageCode])
