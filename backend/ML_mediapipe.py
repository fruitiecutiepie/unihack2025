from pyannote.audio import Pipeline
import os
from os.path import join, dirname
import shutil
import sys
import json
ffmpeg_path = join(dirname(__file__), 'ffmpeg')
os.environ["IMAGEIO_FFMPEG_EXE"] = ffmpeg_path
from moviepy.editor import *

AUTH_TOKEN = "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"

pipeline = Pipeline.from_pretrained("pyannote/speaker-diarization", use_auth_token=AUTH_TOKEN)


def detect_voices_with_speakers(audio_path):
    diarization = pipeline(audio_path)
    segments = []

    for turn, _, speaker in diarization.itertracks(yield_label=True):
        segments.append((turn.start, turn.end, speaker))

    return segments

def create_segments(video_path, segments, output_folder):
    video = VideoFileClip(video_path)
    speaker_clips = {}

    for start, end, speaker in segments:
        clip = video.subclip(start, end)
        if speaker not in speaker_clips:
            speaker_clips[speaker] = []
        speaker_clips[speaker].append(clip)

    for speaker, clips in speaker_clips.items():
        combined_clip = concatenate_videoclips(clips)
        output_path = f"{output_folder}/{speaker}_segment.mp4"
        combined_clip.write_videofile(output_path, codec="libx264")

# Example Usage

def generate_segments():
    audio_path = "./backend/center_audio.mp3"
    video_path = "./backend/angle_CENTER.mp4"
    video = VideoFileClip(video_path)
    audio = video.audio
    audio.write_audiofile(audio_path)

    segments = detect_voices_with_speakers(audio_path)
    print(segments)
    return segments

if __name__ == "__main__":
    generate_segments()