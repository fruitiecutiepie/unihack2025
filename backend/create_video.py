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
from ML_mediapipe import generate_segments

def create_multicut_video(speaker_data):
  clips = []
  prev_end = 0
  center_video = VideoFileClip("./backend/angle_CENTER.mp4")

  for i in range(len(speaker_data)):
    start = floor(max(speaker_data[i][0], prev_end))
    if len(speaker_data) - 1 >= i + 1:
      end = floor(min(speaker_data[i + 1][0], speaker_data[i][1]))
    else:
      end = floor(speaker_data[i][1])

    if start > prev_end and prev_end != 0:
      print(prev_end, start, "center")
      clip = center_video.subclip(prev_end, start)
      clips.append(clip)

    video = VideoFileClip("./backend/angle_" + speaker_data[i][2] + ".mp4")
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


def create_angle_video(speaker_data):
  clips = []
  prev_end = 0
  center_video = VideoFileClip("./backend/angle_CENTER.mp4")
  w, h = center_video.size
  position = (w / 2, h / 2)

  for i in range(len(speaker_data)):
    start = floor(max(speaker_data[i][0], prev_end))
    if len(speaker_data) - 1 >= i + 1:
      end = floor(min(speaker_data[i + 1][0], speaker_data[i][1]))
    else:
      end = floor(speaker_data[i][1])

    speaker_id = int(speaker_data[i][2][9])
    if len(speaker_data[i][3]) > speaker_id:
      position = speaker_data[i][3][speaker_id]

    if start > prev_end and prev_end != 0:
      print(prev_end, start, "center")
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
  speaker_data = generate_segments()
  # create_multicut_video(speaker_data)
  create_angle_video(speaker_data)

if __name__ == "__main__":
  create_video()