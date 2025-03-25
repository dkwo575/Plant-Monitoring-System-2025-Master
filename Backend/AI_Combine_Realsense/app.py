# -*- coding: utf-8 -*-
import os
import json
import re
import uuid
import datetime
import numpy as np
import cv2 as cv
import mmcv
import requests
import pyrealsense2 as rs
from flask import Flask, request, jsonify, send_file, send_from_directory, Response
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from werkzeug.utils import secure_filename
import socket

# library for chatbot
# from langchain_community.llms import GPT4All
# from langchain.llms import llamacpp
# from langchain.chains import LLMchain
# from langchain_community.llms import llamacpp
# from langchain_core.prompts import chat



# Initialize Flask app and extensions
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://DoJunKwon:password@smartfarm2025-smartfarm25.g.aivencloud.com:28350/sensor_DB'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
ma = Marshmallow(app)

# # Initialize Langchain
# prompt_template = chat.ChatPromptTemplate.from_template("The user said : {user message} \n The bot should respond this")
#
# # Initialize chat bot model
# # model_path = "models/Meta-Llama-3-8B-Instruct.Q4_K_S.gguf"
# # llm = GPT4All(model_path)

# Initialize folders
SERVER_FOLDER = 'server'
SERVER_ORIGINAL_FOLDER = os.path.join(SERVER_FOLDER, 'Original')
SERVER_RESULT_FOLDER = os.path.join(SERVER_FOLDER, 'Result')
os.makedirs(SERVER_FOLDER, exist_ok=True)
os.makedirs(SERVER_ORIGINAL_FOLDER, exist_ok=True)
os.makedirs(SERVER_RESULT_FOLDER, exist_ok=True)

# Image directories for processing
IMAGE_DIRECTORY = SERVER_ORIGINAL_FOLDER
SAVE_DIRECTORY = SERVER_RESULT_FOLDER


# Function to simulate real-time sensor data

# @app.route("/chat", methods = ["POST"])
# def chat():
#     data = request.get_json()
#     print(data)
#     user_message = data["message"]
#     # user_message = data.get("message")
#
#     if "temperature" in user_message:
#         response = f"Temperature is {get_data['temperature']}°C"
#     elif "humidity" in user_message:
#         response = f"Humidity is {get_data['humidity']}%"
#     elif "light" in user_message:
#         response = f"Light is {get_data['light']} lux"
#     elif "water" in user_message:
#         response = f"Water level is {get_data['waterLevel']}%"
#     elif "soil" in user_message:
#         response = f"Soil humidity is {get_data['soilHumidity']}%"
#     elif "steam" in user_message:
#         response = f"Steam is {get_data['steam']}%"
#     else:
#         response = llm.chat(data["message"])
#
#     print(response)
#     return jsonify({"response": response})




# Get the local IP address
def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('10.254.254.254', 1))
        local_ip = s.getsockname()[0]
    except Exception:
        local_ip = '127.0.0.1'
    finally:
        s.close()
    return local_ip


local_ip = get_local_ip()
server_address = f"http://{local_ip}:5000"


# Database model and schema
class Environments(db.Model):
    __tablename__ = 'test_iot_2025'
    # id = db.Column(db.Integer, primary_key=True)
    # temperature = db.Column(db.Float(100))
    # humidity = db.Column(db.Float(100))
    # light = db.Column(db.Float(100))
    # waterLevel = db.Column(db.Float(100))
    # soilHumidity = db.Column(db.Float(100))
    # steam = db.Column(db.Float(100))
    # datetime = db.Column(db.DateTime, default=datetime.datetime.now)
    id = db.Column(db.Integer, primary_key=True)
    temperature = db.Column(db.Integer)
    humidity = db.Column(db.Integer)
    light = db.Column(db.Integer)
    waterLevel = db.Column(db.Integer)
    soilHumidity = db.Column(db.Integer)
    steam = db.Column(db.Integer)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.now)

    def __init__(self, temperature, humidity, light, waterLevel, soilHumidity, steam, timestamp):
        self.temperature = temperature
        self.humidity = humidity
        self.light = light
        self.waterLevel = waterLevel
        self.soilHumidity = soilHumidity
        self.steam = steam
        self.tiimestamp =timestamp or datetime.datetime.now


class DataSchema(ma.Schema):
    class Meta:
        fields = ('id', 'temperature', 'humidity', 'light', 'waterLevel', 'soilHumidity', 'steam', 'timestamp')


environment_schema = DataSchema()
environments_schema = DataSchema(many=True)


# Routes and API endpoints
@app.route('/')
def welcome():
    return "<h1>Welcome to Smart Farm</h1>"


@app.route('/api/data', methods=['GET'])
def get_data():
    datas = Environments.query.all()
    result = environments_schema.dump(datas)
    return jsonify(result)


@app.route('/api/data/<id>', methods=['GET'])
def get_data_by_id(id):
    data = Environments.query.get(id)
    return environment_schema.jsonify(data)


@app.route('/api/data/count', methods=['GET'])
def get_data_count():
    count = Environments.query.count()
    return jsonify(count)


@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'})

    file = request.files['file']
    client_id = request.form.get('client_id', 'unknown')
    client_name = request.form.get('client_name', 'unknown')

    if file.filename == '':
        return jsonify({'error': 'No selected file'})

    if file:
        # Sanitize the filename
        filename = secure_filename(file.filename)

        # Determine the correct folder based on client_id and client_name
        if client_id == 'realsense_client':
            client_folder = os.path.join(SERVER_ORIGINAL_FOLDER, client_id, client_name)
        elif client_id == 'ai_client':
            client_folder = os.path.join(SERVER_RESULT_FOLDER, client_id, client_name)
        else:
            client_folder = os.path.join(SERVER_FOLDER, client_id, client_name)

        # Create the client-specific subfolder
        os.makedirs(client_folder, exist_ok=True)

        # Save the file in the respective subfolder
        file_path = os.path.join(client_folder, filename)
        file.save(file_path)

        file_type = filename.split('.')[-1].upper()

        print(f"Uploaded file: {filename}, Type: {file_type}, Client: {client_id}, Client Name: {client_name}")

        # Notify connected clients (if using WebSocket)
        notify_clients('File uploaded', filename, file_type, client_id, client_name)

        return jsonify({'message': 'File uploaded successfully', 'file_type': file_type, 'client_id': client_id,
                        'client_name': client_name})
    else:
        return jsonify({'error': 'Upload failed'})


@app.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    for root, dirs, files in os.walk(SERVER_FOLDER):
        if filename in files:
            file_path = os.path.join(root, filename)
            return send_file(file_path)
    return jsonify({'error': 'File not found'})


@app.route('/images', methods=['GET'])
def get_folder():
    images = get_all_files(IMAGE_DIRECTORY)
    return jsonify(images)


# @app.route('/image/<filename>', methods=['GET'])
# def get_image(filename):
#     return send_from_directory(IMAGE_DIRECTORY, filename)

@app.route('/image/<path:subpath>', methods=['GET'])
def get_image(subpath):
    # Construct the full file path
    file_path = os.path.join(IMAGE_DIRECTORY, subpath)
    if os.path.exists(file_path):
        return send_file(file_path)
    else:
        return jsonify({'error': 'File not found'}), 404


@app.route('/result', methods=['GET'])
def get_folder2():
    images = get_all_files(SAVE_DIRECTORY)
    return jsonify(images)


# @app.route('/result2/<filename>', methods=['GET'])
# def get_image2(filename):
#     return send_from_directory(SAVE_DIRECTORY, filename)
@app.route('/result2/<path:subpath>', methods=['GET'])
def get_image2(subpath):
    # Construct the full file path
    file_path = os.path.join(SAVE_DIRECTORY, subpath)
    if os.path.exists(file_path):
        return send_file(file_path)
    else:
        return jsonify({'error': 'File not found'}), 404


@app.route('/video_feed')
def video_feed():
    return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/api/process', methods=['GET'])
def send_files_to_ai():
    try:
        # Get all image and depth files
        image_files = [f for f in get_all_files(SERVER_ORIGINAL_FOLDER) if f.endswith('.png')]
        depth_files = [f for f in get_all_files(SERVER_ORIGINAL_FOLDER) if f.endswith('.npy')]

        # Log the number of files found
        print(f"Found {len(image_files)} image files and {len(depth_files)} depth files")

        # Check if there is a mismatch between images and depth files
        if len(image_files) != len(depth_files):
            raise ValueError("Mismatch between number of image files and depth files")

        # Emit each file to the AI client
        for image_file, depth_file in zip(image_files, depth_files):
            # Extract filenames from paths
            image_filename = os.path.basename(image_file)
            depth_filename = os.path.basename(depth_file)

            # Create download URLs for the files
            image_download_url = f"{server_address}/download/{image_filename}"
            depth_download_url = f"{server_address}/download/{depth_filename}"
            print(f"Image download URL: {image_download_url}")
            print(f"Depth download URL: {depth_download_url}")

            # Emit the URLs to the AI client
            file_dumps(image_filename, image_download_url, depth_filename, depth_download_url)

        return jsonify({"message": "Files sent to AI client successfully"}), 200

    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({"message": "An error occurred", "error": str(e)}), 500


def gen_frames():
    while True:
        frame = get_frame()
        if frame:
            yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')


def get_frame():
    global pipelines, align
    for (device, pipe) in pipelines:
        frames = pipe.wait_for_frames()
        aligned_frames = align.process(frames)
        aligned_depth_frame = aligned_frames.get_depth_frame()
        color_frame = aligned_frames.get_color_frame()
        if not aligned_depth_frame or color_frame:
            continue
        depth_image = np.asanyarray(aligned_depth_frame.get_data())
        color_image = np.asanyarray(color_frame.get_data())
        depth_colormap = cv.applyColorMap(cv.convertScaleAbs(depth_image, alpha=0.03), cv.COLORMAP_JET)
        images = np.hstack((color_image, depth_colormap))
        _, buffer = cv.imencode('.jpg', images)
        return buffer.tobytes()
    return None


def notify_clients(event, filename, file_type, client_id, client_name):
    download_url = f"{server_address}/download/{filename}"
    socketio.emit('update', {
        'event': event,
        'filename': filename,
        'download_url': download_url,
        'file_type': file_type,
        'client_id': client_id,
        'client_name': client_name
    })
    print(
        f"Notification sent to all clients: {event} - {filename} - Download URL: {download_url} - Client ID: {client_id} - Client Name: {client_name}")


def file_dumps(image_file, image_download_url, depth_file, depth_download_url):
    socketio.emit('send_file_to_ai', {
        'image_file': image_file,
        'image_download_url': image_download_url,
        'depth_file': depth_file,
        'depth_download_url': depth_download_url
    })
    print(
        f"Notification sent to all AI clients: Image_file: {image_file} - Depth_file: {depth_file}")


@socketio.on('connect')
def handle_connect():
    print("Client connected")
    emit('response', {'message': 'Connected to server'})


@socketio.on('disconnect')
def handle_disconnect():
    print("Client disconnected")


# Helper function to get all files in a directory and its subdirectories
def get_all_files(directory):
    files = []
    for root, dirs, filenames in os.walk(directory):
        for filename in filenames:
            files.append(os.path.relpath(os.path.join(root, filename), directory))
    return files


# Endpoint to list all subfolders within a specified directory (Original or Result)
@app.route('/api/subfolders', methods=['GET'])
def get_subfolders():
    folder_type = request.args.get('folder', 'Original')
    base_path = os.path.join('server', folder_type)

    print(f"Base path: {base_path}")  # Debugging line

    if not os.path.exists(base_path):
        return jsonify({'error': f"The folder '{folder_type}' does not exist."}), 404

    subfolders = [f for f in os.listdir(base_path) if os.path.isdir(os.path.join(base_path, f))]

    print(f"Subfolders found: {subfolders}")  # Debugging line

    return jsonify(subfolders)


# Endpoint to list all files within a specified subfolder
@app.route('/api/files', methods=['GET'])
def get_files():
    global IMAGE_DIRECTORY, SAVE_DIRECTORY
    folder_type = request.args.get('folder', 'Original')
    subfolder = request.args.get('subfolder', '')

    base_path = os.path.join('server', folder_type, subfolder)
    if not os.path.exists(base_path):
        return jsonify({'error': f"The folder '{folder_type}/{subfolder}' does not exist."}), 404

    files = get_all_files(base_path)
    if folder_type == "Original":
        IMAGE_DIRECTORY = base_path
    elif folder_type == "Result":
        SAVE_DIRECTORY = base_path
    return jsonify(files)


if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)
