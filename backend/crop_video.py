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

def crop_video(start, end, mouth_position):
  video = VideoFileClip("./backend/center_video.mp4")
  w, h = video.size
  crop_width = w * 2/3
  crop_height = h * 2/3

  x1 = max(0, mouth_position[0] - crop_width // 2)
  y1 = max(0, mouth_position[1] - crop_height // 2)

  x2 = min(w, x1 + crop_width)
  y2 = min(h, y1 + crop_height)

  video = video.crop(x1=x1, y1=y1, x2=x2, y2=y2)
  return video