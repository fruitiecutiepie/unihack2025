import os
from os.path import join, dirname
import shutil
import sys
import json
from math import *
ffmpeg_path = join(dirname(__file__), 'ffmpeg')
os.environ["IMAGEIO_FFMPEG_EXE"] = ffmpeg_path
import concurrent.futures
from PIL import Image, ImageDraw, ImageFont
from moviepy.editor import *
from crop_video import crop_video

def create_angle_video(speaker_data, i):
  clips = []
  prev = 0
  prev_speaker = speaker_list[0]
  speaker_list = [
    {"name": "speaker_1", "position": [0, 0]},
    {"name": "speaker_2", "position": [0, 0]},
    {"name": "speaker_3", "position": [0, 0]}
  ]
  center_video = VideoFileClip("center_video.mp4")

  for speaker in speaker_data:
    start = speaker["start"]
    end = speaker["end"]
    speaker = speaker["speaker"]

    if prev != start and prev != 0:
      if start - prev != 0:
        for each_speaker in speaker_list:
         if prev_speaker == each_speaker["name"]:
           video = crop_video(each_speaker["position"])
      else:
        video = center_video
      clip = video.subclip(prev, start)
      audio = VideoFileClip(center_video).subclip(prev, start).audio
      clip = clip.set_audio(audio)
      clips.append(clip)

    for each_speaker in speaker_list:
      if speaker == each_speaker["name"]:
        video = crop_video(each_speaker["position"])
        prev_speaker = each_speaker["name"]

    clip = video.subclip(start, end)
    audio = VideoFileClip(center_video).subclip(prev, start).audio
    clip = clip.set_audio(audio)
    clips.append(clip)

  tmp_video = concatenate_videoclips(clips)
  tmp_video.write_videofile("./backend/tmp/video_" + str(i) + ".mp4", fps=60, preset="urtlafast")

  for clip in clips:
    clip.close()
  video.close()
  center_video.close()
  tmp_video.close()


def create_video():
  speaker_data = []
  clips = []

  with concurrent.futures.ProcessPoolExecutor(max_workers=3) as executor:
    for i in range(ceil(len(speaker_data) / 5)):
      start = i * 5
      end = min((i + 1) * 5, len(speaker_data))
      executor.submit(create_angle_video, speaker_data[start : end], i)

  for i in range(ceil(len(speaker_data) / 5)):
    video = VideoFileClip("./backend/tmp/video_" + str(i) + ".mp4")
    clips.append(video)

  video = concatenate_videoclips(clips)
  with concurrent.futures.ThreadPoolExecutor() as executor:
    executor.submit(
      video.write_videofile, 
      fps=60,
      preset="urtlafast"
    )

