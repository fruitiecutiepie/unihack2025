# VideoAI Processing Platform

## Overview
This project is a comprehensive video processing platform with face tracking, speech-to-text capabilities, and machine learning features. It consists of a Python backend for video processing and multiple frontend applications for different use cases.

## Architecture
- **Backend**: Python-based server with ML models for video processing
- **Frontend**: Multiple Next.js applications for different user interfaces:
  - Live face tracking demo
  - Live processing interface
  - Upload and process interface

## Prerequisites
- Python 3.7+
- Node.js 16+ and pnpm
- ffmpeg
- ngrok account for exposing local server

## Installation

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Frontend Setup
1. Choose the appropriate frontend directory (face_live_tracking_demo, frontend_live, or frontend_upload):
   ```bash
   cd frontend_live  # or another frontend directory
   ```

2. Install Node.js dependencies:
   ```bash
   pnpm install
   ```

3. Configure the application by creating a `config.json` file based on the template:
   ```bash
   cp config.json.stub config.json
   # Edit config.json with your settings
   ```

## Running the Application

1. Sign in to your ngrok account from the command line:
   ```bash
   ngrok authtoken YOUR_AUTH_TOKEN
   ```

2. Start the backend server:
   ```bash
   cd backend
   python dev.py
   ```
   Note the remote URL displayed in the terminal.

3. Start the frontend application:
   ```bash
   cd frontend_live  # or another frontend directory
   pnpm dev
   ```

4. Access the application via the ngrok URL provided by the backend server.

## Features
- Face tracking and recognition
- Video processing and manipulation
- Speech-to-text conversion
- Live video analysis

## Project Structure
- **backend/**: Python server with ML models and video processing
  - **models/**: ML model definitions
  - **routes/**: API endpoint definitions
  - **services/**: Business logic services
- **face_live_tracking_demo/**: Next.js app for demonstrating face tracking
- **frontend_live/**: Interface for live processing
- **frontend_upload/**: Interface for uploading and processing videos
