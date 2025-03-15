from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO
from routes import initialize_routes
from create_video import create_video
import os

app = Flask(__name__)
CORS(app)

socketio = SocketIO(app, cors_allowed_origins="*")

@app.route('/api/edit_video')
def edit_video():
  create_video()
  return jsonify({"response": "success"})

@app.route('/api/upload', methods=["POST"])
def upload_video():
  file = request.files['file']

  if file:
    try:
      file_path = "./backend/center_video.mp4"
      file.save(file_path)
      return jsonify({'message': f'File center_video successfully uploaded to database'}), 200
    except Exception as e:
        return jsonify({'error': f'Failed to save file: {str(e)}'}), 500
    
@app.route('/api/download', methods=["GET"])
def download_video():
  video_path = "./backend/output.mp4"

  if not os.path.exists(video_path):
        return jsonify({"error": "Video file not found"}), 404
  
  return send_from_directory(os.path.dirname(video_path), os.path.basename(video_path), as_attachment=False)

# Initialize all routes
initialize_routes(app, socketio)

if __name__ == "__main__":
  socketio.run(app, host='0.0.0.0', port=5300, debug=False)