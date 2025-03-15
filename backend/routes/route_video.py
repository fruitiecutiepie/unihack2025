from flask import Blueprint, Response, render_template

video_routes = Blueprint("video_routes", __name__)

@video_routes.route("/")
def index():
    return render_template("client.html")
