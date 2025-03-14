from flask import Blueprint, Response, render_template
from services.service_audio import generate_frames

video_routes = Blueprint("video_routes", __name__)

@video_routes.route("/")
def index():
    return render_template("client.html")

@video_routes.route("/video_feed")
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')
