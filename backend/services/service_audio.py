import queue
import json
import pyaudio
from flask import request
from flask_socketio import emit
from vosk import KaldiRecognizer
from threading import Thread
from time import sleep
import services.service_model as service_model

# Audio settings
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000
CHUNK = 2000

# Audio queue
audio_queue = queue.Queue()

# Initialize PyAudio
p = pyaudio.PyAudio()
def audio_callback(in_data, frame_count, time_info, status):
    audio_queue.put(in_data)
    return (None, pyaudio.paContinue)

stream = p.open(
    format=FORMAT,
    channels=CHANNELS,
    rate=RATE,
    input=True,
    frames_per_buffer=CHUNK,
    stream_callback=audio_callback
)

stream.start_stream()

subtitle_text = "Listening..."

def get_recognizer():
    service_model.download_and_load_model(service_model.current_language)
    rec = KaldiRecognizer(service_model.models[service_model.current_language], 16000)
    return rec

rec = get_recognizer()
rec.SetWords(True)

def update_recognizer():
    global rec
    rec = get_recognizer()
    rec.SetWords(True)

def process_audio(socketio):
    global subtitle_text, rec
    
    if not audio_queue.empty():
        data = audio_queue.get()
        if rec.AcceptWaveform(data):
            result = json.loads(rec.Result())
            subtitle_text = result["text"]
            return subtitle_text
    
    return None

def transcription_thread(socketio, sid):
    while True:
        result = process_audio(socketio=socketio)
        if result:
            print(result)
            socketio.emit("subtitle", {"text": result, "lang": service_model.current_language}, room=sid)
        sleep(0.1)


def audio_service(socketio):
    @socketio.on('connect')
    def handle_connect():
        emit('status', {'data': 'Connected'})
        # Start transcription in a separate thread
        socketio.start_background_task(transcription_thread, socketio, request.sid)
        print("Transcription thread started")
        
    @socketio.on('language_changed')
    def handle_language_changed(data):
        global rec
        lang = data.get('lang', '').lower()
        if lang in service_model.AVAILABLE_MODELS:
            service_model.current_language = lang
            rec = get_recognizer()
            rec.SetWords(True)
            emit('language_updated', {'lang': service_model.current_language})
        else:
            emit('error', {'message': 'Language not available'})

    @socketio.on('disconnect')
    def handle_disconnect():
        print('Client disconnected')