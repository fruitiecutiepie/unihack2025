from flask import Flask, jsonify, request, send_from_directory, send_file
from flask_cors import CORS
from flask_socketio import SocketIO
from routes import initialize_routes
from create_video import create_video
from services.service_audio import audio_service
import os

app = Flask(__name__)
CORS(app)

socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

@app.route('/api/edit_video')
def edit_video():
  create_video()
  return jsonify({"response": "success"})

@app.route('/api/upload', methods=["POST"])
def upload_video():
  file = request.files['file']
  file_name = request.form.get('file_name')

  if file:
    try:
      file_path = "./backend/" + file_name
      file.save(file_path)
      return jsonify({'message': f'File center_video successfully uploaded to database'}), 200
    except Exception as e:
        return jsonify({'error': f'Failed to save file: {str(e)}'}), 500
    
@app.route('/api/download', methods=["GET"])
def download_video():
  video_path = "./backend/output.mp4"

  if not os.path.exists(video_path):
        return jsonify({"error": "Video file not found"}), 404
  
  # video = send_from_directory("backend", "output.mp4", mimetype="video/mp4", as_attachment=False)
  video = send_file("output.mp4", mimetype="video/mp4", as_attachment=False)
  print('video', video)
  return video

@app.route('/api/test', methods=["GET"])
def api_test():
  return jsonify({"message": "success"})

# Initialize all routes
initialize_routes(app, socketio)
audio_service(socketio)

if __name__ == "__main__":
  socketio.run(app, host='0.0.0.0', port=5033, debug=False)