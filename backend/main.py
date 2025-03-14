from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

@app.route('/api/edit_video')
def edit_video():
  return jsonify({"response": "success"})

if __name__ == 'main':
  app.run(port=5000)
