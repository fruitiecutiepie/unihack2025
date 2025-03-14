from flask import Flask, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
from routes import initialize_routes

import os

app = Flask(__name__)
CORS(app)

socketio = SocketIO(app, cors_allowed_origins="*")

@app.route('/api/edit_video')
def edit_video():
  return jsonify({"response": "success"})

# Initialize all routes
initialize_routes(app, socketio)

if __name__ == "__main__":
  socketio.run(app, host='0.0.0.0', port=5300, debug=False)