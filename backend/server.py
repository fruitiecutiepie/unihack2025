import queue
import json
import zipfile
import pyaudio
import cv2
import numpy as np
import os
import io
# import tkinter as tk
import sounddevice as sd
from flask import Flask, Response, render_template, request
from flask_socketio import SocketIO
from vosk import Model, KaldiRecognizer
# from langdetect import detect

# Initialize Flask app
app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

VOSK_BASE_URL = "https://alphacephei.com/vosk/models/"
MODEL_BASE_URL = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models"))

# Define language-specific fonts
# These fonts are commonly available on macOS and support various scripts
LANGUAGE_FONTS = {
    "en": ("Arial", 24),  # English
    "es": ("Arial", 24),  # Spanish
    "fr": ("Arial", 24),  # French
    "de": ("Arial", 24),  # German
    "ru": ("AppleSDGothicNeo-Regular", 24),  # Russian
    "cn": ("PingFang SC", 24),  # Chinese
    "ja": ("Hiragino Sans", 24),  # Japanese
    "ko": ("AppleGothic", 24),  # Korean
    "default": ("Arial Unicode MS", 24)  # Fallback for all languages
}

# Available model information (name, download URL suffix, local dir name)
AVAILABLE_MODELS = {
    "en": {"name": "vosk-model-en-us-0.22", "url": "vosk-model-en-us-0.22.zip"},
    "es": {"name": "vosk-model-small-es-0.42", "url": "vosk-model-small-es-0.42.zip"},
    "fr": {"name": "vosk-model-small-fr-0.22", "url": "vosk-model-small-fr-0.22.zip"},
    "cn": {"name": "vosk-model-small-cn-0.22", "url": "vosk-model-small-cn-0.22.zip"},
    "ru": {"name": "vosk-model-small-ru-0.22", "url": "vosk-model-small-ru-0.22.zip"},
    "de": {"name": "vosk-model-small-de-0.15", "url": "vosk-model-small-de-0.15.zip"},
    "ja": {"name": "vosk-model-small-ja-0.22", "url": "vosk-model-small-ja-0.22.zip"},
    "ko": {"name": "vosk-model-small-ko-0.22", "url": "vosk-model-small-ko-0.22.zip"}
}

# Initially load only English model
models = {}
current_language = "en"  # Default to English

# Initialize Tkinter window
# root = tk.Tk()
# root.title("Live Subtitles")
# root.geometry("800x200")
# root.configure(bg="black")

def get_font_for_language(lang_code):
    if lang_code in LANGUAGE_FONTS:
        return LANGUAGE_FONTS[lang_code]
    return LANGUAGE_FONTS["default"]

# Create a label to display subtitles
font_name, font_size = get_font_for_language(current_language)
# subtitle_label = tk.Label(root, text="Listening...", fg="white", bg="black", 
#                           font=(font_name, font_size), wraplength=750, justify="center")
# subtitle_label.pack(expand=True)

def download_and_load_model(lang_code):
    """
    Download and load a language model if it's not already loaded
    Returns True if successful, False otherwise
    """
    global models
    
    if lang_code not in AVAILABLE_MODELS:
        print(f"Language code {lang_code} is not supported")
        return False
    
    # If model is already loaded, no need to download again
    if lang_code in models:
        return True
        
    model_info = AVAILABLE_MODELS[lang_code]
    model_dir = os.path.join(MODEL_BASE_URL, model_info["name"])
    
    # Check if model directory already exists
    if not os.path.exists(model_dir):
        print(f"Downloading {lang_code} model...")
        try:
            # Download the model
            model_url = VOSK_BASE_URL + model_info["url"]
            response = request.get(model_url, stream=True)
            if response.status_code == 200:
                z = zipfile.ZipFile(io.BytesIO(response.content))
                z.extractall(MODEL_BASE_URL)
                print(f"Successfully downloaded and extracted {lang_code} model")
            else:
                print(f"Failed to download {lang_code} model: HTTP {response.status_code}")
                return False
        except Exception as e:
            print(f"Error downloading {lang_code} model: {e}")
            return False
    
    # Load the model
    try:
        models[lang_code] = Model(model_dir)
        print(f"Successfully loaded {lang_code} model")
        return True
    except Exception as e:
        print(f"Error loading {lang_code} model: {e}")
        return False

# Load the default English model on startup
download_and_load_model(current_language)

# Initialize Recognizer with Default Model
rec = KaldiRecognizer(models[current_language], 16000)
rec.SetWords(True)

# Audio settings
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000
CHUNK = 2000

# Audio queue for processing
audio_queue = queue.Queue()

# PyAudio callback function
def callback(in_data, frame_count, time_info, status):
    audio_queue.put(in_data)
    return (None, pyaudio.paContinue)

p = pyaudio.PyAudio()
stream = p.open(format=FORMAT, channels=CHANNELS, rate=RATE,
                input=True, frames_per_buffer=CHUNK, stream_callback=callback)
stream.start_stream()

# def detect_language(text):
#     try:
#         lang = detect(text)  # Detect language
#         if lang in models and lang != current_language:
#             return lang
#     except:
#         pass
#     return None

# Function to update subtitles
# def update_subtitles():
#     global current_language
    
#     if not audio_queue.empty():
#         data = audio_queue.get()
#         if rec.AcceptWaveform(data):
#             result = json.loads(rec.Result())
#             text = result["text"]
            
#             # Detect language from the recognized text
#             detected_lang = detect_language(text)
            
#             # Update font if language changed
#             if detected_lang != current_language:
#                 current_language = detected_lang
#                 font_name, font_size = get_font_for_language(current_language)
#                 subtitle_label.config(font=(font_name, font_size))
#                 print(f"Detected language: {current_language}")
                
#             subtitle_label.config(text=text)  # Update GUI with full transcription
#         else:
#             partial_result = json.loads(rec.PartialResult())
#             subtitle_label.config(text=partial_result["partial"])  # Update with partial text
            
#     root.after(50, update_subtitles)  # Refresh every 50ms

# # Start updating subtitles
# update_subtitles()

# # Run the Tkinter GUI
# root.mainloop()

# Initialize OpenCV webcam feed
cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

# Subtitle text storage
subtitle_text = "Listening..."

def generate_frames():
    global subtitle_text, rec, current_language

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        # Process real-time audio
        if not audio_queue.empty():
            data = audio_queue.get()
            if rec.AcceptWaveform(data):
                result = json.loads(rec.Result())
                text = result["text"]
                subtitle_text = text

                # Detect language and switch models if needed
                # new_lang = detect_language(text)
                # if new_lang and new_lang != current_language:
                #     print(f"Switching language to: {new_lang.upper()}")
                #     current_language = new_lang
                #     rec = KaldiRecognizer(models[current_language], 16000)
                #     rec.SetWords(True)
            else:
                partial_result = json.loads(rec.PartialResult())
                subtitle_text = partial_result["partial"]

        # Overlay subtitles on frame
        overlay = frame.copy()
        frame_height, frame_width, _ = frame.shape
        cv2.rectangle(overlay, (50, frame_height - 100), (frame_width - 50, frame_height - 50), (0, 0, 0), -1)
        alpha = 0.5
        cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)

        cv2.putText(frame, subtitle_text, (60, frame_height - 65), cv2.FONT_HERSHEY_SIMPLEX,
                    1, (255, 255, 255), 2, cv2.LINE_AA)

        # Convert frame to JPEG format
        _, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()

        # Send subtitle text via WebSocket
        socketio.emit('subtitle', { 'text': subtitle_text, 'lang': current_language })

        # Yield the frame for HTTP streaming
        yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.route('/')
def index():
    return render_template('client.html')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/set_language', methods=['POST'])
def set_language():
    global rec, current_language
    lang = request.form.get("lang", "").lower()

    if lang in AVAILABLE_MODELS:
        # Download model if not already loaded
        success = download_and_load_model(lang)
        if success:
            current_language = lang
            rec = KaldiRecognizer(models[current_language], 16000)
            rec.SetWords(True)
            return f"Language switched to {lang.upper()}"
        else:
            return f"Failed to load {lang.upper()} model", 500
    return "Invalid language", 400

@app.route('/add_language', methods=['POST'])
def add_language():
    lang = request.form.get("lang", "").lower()
    
    if lang in AVAILABLE_MODELS:
        success = download_and_load_model(lang)
        if success:
            return f"Language {lang.upper()} successfully added", 200
        else:
            return f"Failed to add language {lang.upper()}", 500
    return "Invalid language code", 400

@app.route('/available_languages', methods=['GET'])
def available_languages():
    return {
        "available": list(AVAILABLE_MODELS.keys()),
        "loaded": list(models.keys()),
        "current": current_language
    }

# Run Flask server
if __name__ == "__main__":
    socketio.run(app, host='0.0.0.0', port=5300, debug=False)
