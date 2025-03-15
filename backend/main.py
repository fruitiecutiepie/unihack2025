from flask import Flask, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
from routes import initialize_routes
from services.service_audio import audio_service

app = Flask(__name__)
CORS(app)

socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

@app.route('/api/edit_video')
def edit_video():
  return jsonify({"response": "success"})

# Initialize all routes and services
initialize_routes(app, socketio)
audio_service(socketio)

if __name__ == "__main__":
  socketio.run(app, host='0.0.0.0', port=5033, debug=False)