from routes.route_video import video_routes
from routes.route_language import language_routes

def initialize_routes(app, socketio):
    app.register_blueprint(video_routes)
    app.register_blueprint(language_routes)
