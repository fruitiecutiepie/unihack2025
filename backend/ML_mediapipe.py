from pyannote.audio import Pipeline
import os
from os.path import join, dirname
import shutil
import sys
import json
ffmpeg_path = join(dirname(__file__), 'ffmpeg')
os.environ["IMAGEIO_FFMPEG_EXE"] = ffmpeg_path
from moviepy.editor import *
import cv2
import mediapipe as mp

AUTH_TOKEN = "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"

pipeline = Pipeline.from_pretrained("pyannote/speaker-diarization", use_auth_token=AUTH_TOKEN)


def detect_voices_with_speakers(audio_path):
    diarization = pipeline(audio_path)
    segments = []

    for turn, _, speaker in diarization.itertracks(yield_label=True):
        segments.append([turn.start, turn.end, speaker])

    return segments

def detect_faces_at_timestamp(video_path, timestamp):
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError("Could not open the video")
    
    fps = cap.get(cv2.CAP_PROP_FPS)
    
    frame_number = int(fps * timestamp)
    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
    
    ret, frame = cap.read()
    if not ret:
        raise ValueError("Could not obtain the frame of video")
    
    mp_face_detection = mp.solutions.face_detection
    face_detection = mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.5)
    
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_detection.process(rgb_frame)
    
    faces = []
    if results.detections:
        h, w, _ = frame.shape
        for detection in results.detections:
            bboxC = detection.location_data.relative_bounding_box
            x, y, w_box, h_box = (bboxC.xmin * w, bboxC.ymin * h, bboxC.width * w, bboxC.height * h)
            faces.append((int(x), int(y)))
    
    cap.release()
    return faces

# Example Usage

def generate_segments():
    audio_path = "./backend/center_audio.mp3"
    video_path = "./backend/angle_CENTER.mp4"
    video = VideoFileClip(video_path)
    audio = video.audio
    audio.write_audiofile(audio_path)

    segments = detect_voices_with_speakers(audio_path)
    print(segments)

    for segment in segments:
        position = detect_faces_at_timestamp(video_path, segment[0])
        position.sort(key=lambda x: x[0])
        segment.append(position)

    print(segments)
    return segments

if __name__ == "__main__":
    generate_segments()