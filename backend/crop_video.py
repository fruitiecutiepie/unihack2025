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

def crop_video(each_speaker):
  video = VideoFileClip("center_video.mp4")
  video = video.resize(2)
  w, h = video.size
  