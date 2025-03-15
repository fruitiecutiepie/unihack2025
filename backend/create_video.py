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
from ML_mediapipe import calculate_time

def create_angle_video(speaker_data):
  clips = []
  prev_end = 0
  center_video = VideoFileClip("./backend/center_video.mp4")

  for i in range(len(speaker_data)):
    start = floor(max(speaker_data[i][0], prev_end))
    if len(speaker_data) - 1 >= i + 1:
      end = floor(min(speaker_data[i + 1][0], speaker_data[i][1]))
    else:
      end = floor(speaker_data[i][1])
    position = speaker_data[i][2]

    if start > prev_end and prev_end != 0:
      print(prev_end, start, "center")
      w, h = center_video.size
      clip = center_video.subclip(prev_end, start).resize(2/3)
      clips.append(clip)

    video = crop_video(start, end, position)
    print(start, end, "cropped")
    clip = video.subclip(start, end)
    clips.append(clip)

    prev_end = end

  tmp_video = concatenate_videoclips(clips)
  tmp_video.write_videofile("./backend/output.mp4", fps=60, preset="ultrafast")

  for clip in clips:
    clip.close()
  video.close()
  center_video.close()
  tmp_video.close()


def create_video():
  speaker_data = calculate_time("./backend/center_video.mp4")
  clips = []

  '''
  with concurrent.futures.ProcessPoolExecutor(max_workers=3) as executor:
    for i in range(ceil(len(speaker_data) / 5)):
      start = i * 5
      end = min((i + 1) * 5, len(speaker_data))
      executor.submit(create_angle_video, speaker_data[start : end], i)
  
  for i in range(ceil(len(speaker_data) / 5)):
    video = VideoFileClip("./backend/tmp/video_" + str(i) + ".mp4")
    clips.append(video)
  '''

  create_angle_video(speaker_data)

  '''
  video = concatenate_videoclips(clips)
  with concurrent.futures.ThreadPoolExecutor() as executor:
    executor.submit(
      video.write_videofile,
      "./backend/output.mp4",
      fps=60,
      preset="urtlafast"
    )
  '''

if __name__ == "__main__":
  create_video()