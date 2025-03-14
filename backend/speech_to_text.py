import queue
import json
import pyaudio
import cv2
import tkinter as tk
from vosk import Model, KaldiRecognizer
import os

# Set environment variable to handle camera authorization
os.environ['OPENCV_AVFOUNDATION_SKIP_AUTH'] = '1'

# Load the model
MODEL_PATH = "vosk-model-small-en-us-0.15"
model = Model(MODEL_PATH)

# Set up the recognizer
rec = KaldiRecognizer(model, 16000)
rec.SetWords(True)  # Enable word timestamps

# Audio settings
FORMAT = pyaudio.paInt16
CHANNELS = 1  # Use mono for better recognition
RATE = 16000  # Vosk expects 16kHz sample rate
CHUNK = 2000  # Number of frames per buffer

# Audio queue for processing
audio_queue = queue.Queue()

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

current_language = "en"

# Initialize Tkinter window
root = tk.Tk()
root.title("Live Subtitles")
root.geometry("800x200")
root.configure(bg="black")

def get_font_for_language(lang_code):
    if lang_code in LANGUAGE_FONTS:
        return LANGUAGE_FONTS[lang_code]
    return LANGUAGE_FONTS["default"]

# Create a label to display subtitles
font_name, font_size = get_font_for_language(current_language)
subtitle_label = tk.Label(root, text="Listening...", fg="white", bg="black", 
                          font=(font_name, font_size), wraplength=750, justify="center")
subtitle_label.pack(expand=True)

# PyAudio callback function
def callback(in_data, frame_count, time_info, status):
    audio_queue.put(in_data)
    return (None, pyaudio.paContinue)

# Initialize PyAudio
p = pyaudio.PyAudio()
stream = p.open(format=FORMAT, channels=CHANNELS, rate=RATE,
                input=True, frames_per_buffer=CHUNK, stream_callback=callback)
stream.start_stream()



print("Listening... Speak now!")

# Process audio in real-time
while True:
    data = audio_queue.get()
    if rec.AcceptWaveform(data):
        result = json.loads(rec.Result())
        print("Transcription:", result["text"])  # Print recognized text
    else:
        partial_result = json.loads(rec.PartialResult())
        print("Partial:", partial_result["partial"])  # Display intermediate results
