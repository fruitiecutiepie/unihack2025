from routes.route_language import language_routes

def initialize_routes(app, socketio):
    app.register_blueprint(language_routes)
