import queue
import json
import pyaudio
from flask import request
from flask_socketio import emit
from vosk import KaldiRecognizer
from threading import Thread
from time import sleep

import services.service_model as service_model
import services.service_translation as service_translation

# Audio settings
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000
CHUNK = 1024

audio_queue = queue.Queue()       # Raw audio queue
translation_queue = queue.Queue() # Recognized text queue (to be translated)

# For partial results chunking
PARTIAL_WORD_THRESHOLD = 3

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
    # Download or load the Vosk model for the current language
    service_model.download_and_load_model(service_model.current_language)
    rec = KaldiRecognizer(service_model.models[service_model.current_language], RATE)
    rec.SetWords(True)
    return rec

rec = get_recognizer()

def update_recognizer():
    global rec
    rec = get_recognizer()

def process_audio_chunk():
    """
    Reads one chunk of data from audio_queue and passes it to Vosk.
    Returns either:
      - ("partial", partial_text)
      - ("final", final_text)
      - None (if nothing recognized or no data)
    """
    if not audio_queue.empty():
        data = audio_queue.get()
        if not data or len(data) == 0:
            return None

        # Provide chunk to recognizer
        if rec.AcceptWaveform(data):
            # Final recognized text
            result = json.loads(rec.Result())
            text = result.get("text", "").strip()
            if text:
                return ("final", text)
        else:
            # Partial recognized text
            part = json.loads(rec.PartialResult())
            partial_text = part.get("partial", "").strip()
            if partial_text:
                return ("partial", partial_text)
    return None

def transcription_thread(socketio, sid):
    """
    Continuously process audio chunks in one thread.
    Send recognized text (partial/final) to a translation queue.
    """
    partial_accumulator = []

    while True:
        result = process_audio_chunk()
        if not result:
            sleep(0.01)
            continue

        rtype, text = result

        if rtype == "final":
            # Clear partial accumulation, because we got the final
            partial_accumulator = []
            # Put final recognized text in translation queue
            translation_queue.put({
                "sid": sid,
                "original_text": text,
                "is_partial": False,  # final result
                "source_lang": service_model.current_language,
                "target_lang": service_translation.target_language
            })

        elif rtype == "partial":
            # Accumulate partial words
            partial_accumulator.extend(text.split())

            # If we reach threshold, push to translation queue
            if len(partial_accumulator) >= PARTIAL_WORD_THRESHOLD:
                chunk = " ".join(partial_accumulator)
                partial_accumulator = []
                translation_queue.put({
                    "sid": sid,
                    "original_text": chunk,
                    "is_partial": True,
                    "source_lang": service_model.current_language,
                    "target_lang": service_translation.target_language
                })

        sleep(0.01)

def translation_worker(socketio):
    """
    Translation thread that takes recognized text items from `translation_queue`,
    performs translation if needed, then emits results to the client.
    """
    while True:
        item = translation_queue.get()
        if item is None:
            # Signal to end the thread
            break

        sid = item["sid"]
        original_text = item["original_text"]
        is_partial = item["is_partial"]
        source_lang = item["source_lang"]
        target_lang = item["target_lang"]

        # If source != target, translate; otherwise keep it as is
        if source_lang != target_lang:
            translated_text = service_translation.translate_text(original_text, source_lang, target_lang)
        else:
            translated_text = original_text

        # You can structure the event data however you wish
        event_data = {
            "original": original_text,
            "translated": translated_text,
            "source_lang": source_lang,
            "target_lang": target_lang,
            "is_partial": is_partial
        }

        # Emit the result back to the client
        socketio.emit("subtitle", event_data, room=sid)

        translation_queue.task_done()

def start_transcription_thread(socketio, sid):
    """
    Helper to start the Vosk transcription in a background thread.
    """
    t = Thread(target=transcription_thread, args=(socketio, sid), daemon=True)
    t.start()

def start_translation_thread(socketio):
    """
    Helper to start the translation worker in a background thread.
    Only one instance is typically needed for all clients.
    """
    t = Thread(target=translation_worker, args=(socketio,), daemon=True)
    t.start()

def audio_service(socketio):
    """
    Sets up Socket.IO event handlers and starts background tasks.
    """
    @socketio.on('connect')
    def handle_connect():
        emit('status', {'data': 'Connected'})
        # Start or reuse the background transcription and translation threads
        start_transcription_thread(socketio, request.sid)
        start_translation_thread(socketio)
        print("[Audio] Transcription and translation threads started")

    @socketio.on('set_language_target')
    def handle_target_language(data):
        lang = data.get('lang', '').lower()
        if lang in service_model.AVAILABLE_MODELS:
            # Update the global target language in service_translation
            service_translation.target_language = lang
            emit('set_language_target', {'lang': lang})
        else:
            emit('error', {'message': 'Target language not available'})

    @socketio.on('set_language_source')
    def handle_source_language(data):
        global rec
        lang = data.get('lang', '').lower()
        if lang in service_model.AVAILABLE_MODELS:
            service_model.current_language = lang
            rec = get_recognizer()
            emit('set_language_source', {'lang': service_model.current_language})
        else:
            emit('error', {'message': 'Language not available'})

    @socketio.on('disconnect')
    def handle_disconnect():
        print('[Audio] Client disconnected')
        # Flush audio queue
        while not audio_queue.empty():
            audio_queue.get_nowait()
        stream.stop_stream()
        stream.close()
        p.terminate()
        print('[Audio] Audio stream closed')
