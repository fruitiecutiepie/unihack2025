import queue
import json
import cv2
import numpy as np
import pyaudio
from flask_socketio import emit
from vosk import KaldiRecognizer
from services.service_model import models, current_language
import os

# Set environment variable to handle camera authorization
os.environ['OPENCV_AVFOUNDATION_SKIP_AUTH'] = '1'

# Audio settings
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000
CHUNK = 2000

# Audio queue
audio_queue = queue.Queue()

# Initialize PyAudio
p = pyaudio.PyAudio()
stream = p.open(format=FORMAT, channels=CHANNELS, rate=RATE,
                input=True, frames_per_buffer=CHUNK, stream_callback=lambda in_data, frame_count, time_info, status: (audio_queue.put(in_data), pyaudio.paContinue)[1])
stream.start_stream()

# OpenCV Webcam
cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

subtitle_text = "Listening..."
rec = KaldiRecognizer(models[current_language], 16000)
rec.SetWords(True)

def generate_frames():
    global subtitle_text, rec, current_language

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        if not audio_queue.empty():
            data = audio_queue.get()
            if rec.AcceptWaveform(data):
                result = json.loads(rec.Result())
                subtitle_text = result["text"]

        # Overlay subtitles on frame
        overlay = frame.copy()
        frame_height, frame_width, _ = frame.shape
        cv2.rectangle(overlay, (50, frame_height - 100), (frame_width - 50, frame_height - 50), (0, 0, 0), -1)
        alpha = 0.5
        cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)

        cv2.putText(frame, subtitle_text, (60, frame_height - 65), cv2.FONT_HERSHEY_SIMPLEX,
                    1, (255, 255, 255), 2, cv2.LINE_AA)

        # Convert frame to JPEG
        _, buffer = cv2.imencode(".jpg", frame)
        frame_bytes = buffer.tobytes()

        emit("subtitle", {"text": subtitle_text, "lang": current_language})

        yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n")
