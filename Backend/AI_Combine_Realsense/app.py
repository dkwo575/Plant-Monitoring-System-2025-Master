# -*- coding: utf-8 -*-
import os
import json
import re
import uuid
import datetime
import numpy as np
import cv2 as cv
import mmcv
import pytz
import requests
import pyrealsense2 as rs
from flask import Flask, request, jsonify, send_file, send_from_directory, Response
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from werkzeug.utils import secure_filename
import socket
import torch
import torch.distributed as dist
from dotenv import load_dotenv
from pytz import UTC

from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain_community.llms import HuggingFaceHub
from langchain_core.prompts import PromptTemplate
from langchain_community.llms import huggingface_endpoint
from langchain_experimental.sql import SQLDatabaseChain  # library for database
from langchain_community.utilities.sql_database import SQLDatabase
from langchain_huggingface import HuggingFaceEndpoint

# langchain library for RAG
from langchain_community.embeddings import HuggingFaceEmbeddings, FastEmbedEmbeddings
from langchain_community.document_loaders import SQLDatabaseLoader, PyMuPDFLoader ,DirectoryLoader # SQLDatabaseLoader, pyMuPDFLoader,DirectoryLoader
from langchain_community.vectorstores.faiss import FAISS
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain.text_splitter import CharacterTextSplitter

from langchain_openai import ChatOpenAI, OpenAIEmbeddings

from langchain.prompts import PromptTemplate
from langchain_huggingface import HuggingFaceEmbeddings

from langchain.chains import RetrievalQA
#
# from langchain_core.prompts import PromptTemplate
# from langchain_openai import ChatOpenAI, OpenAIEmbeddings


# library for chatbot
# from langchain.llms import huggingface_hub


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

load_dotenv()

openaikey = os.getenv('OPENAI_API_KEY')

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://DoJunKwon@smartfarm2025-smartfarm25.g.aivencloud.com:28350/sensor_DB'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
ma = Marshmallow(app)
mysql_uri = f"mysql+pymysql://DoJunKwon@smartfarm2025-smartfarm25.g.aivencloud.com:28350/sensor_DB"


# # Initialize Langchain
os.environ['HUGGINGFACEHUB_API_TOKEN'] = 'Mytoken'
huggingfaceAPI = 'Mytoken'
repo_id = 'mistralai/Mistral-7B-Instruct-v0.3'

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

llm = HuggingFaceEndpoint(
    repo_id=repo_id,
    temperature = 0.5,
    model_kwargs={"max_length": 128},
    huggingfacehub_api_token=os.environ["HUGGINGFACEHUB_API_TOKEN"],
)

db_langchain = SQLDatabase.from_uri(mysql_uri, include_tables=['lab_iot_2025'], sample_rows_in_table_info=2)
db_chain = SQLDatabaseChain.from_llm(llm, db_langchain, verbose = True, top_k = 15)

#------------------------------


# RAG for document.
# ----------------------------------------
# 1. document loadeer(문서 로드)
# loader = PyMuPDFLoader("document_langchain/P61_ACRA.pdf")
# docs = loader.load()
#
# print(f"number of pages : {len(docs)}")
#
# # 2. text splitter(텍스트 분할)
# text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=50)
# split_document = text_splitter.split_documents(docs)
# print(f"number of chunks: {len(split_document)}")
#
#
# # 3. embedding(임베딩)
# # 각 문서 또는 문서의 일부를 벡터 형태로 변환하여, 문서의 의미를 수치화한다.
# # 이는 책의 내용을 요약하여 핵심 키워드로 표현하는 것과 비슷하다.
# embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-mpnet-base-v2")
#
#
# # 4. vector store(벡터 저장소), DB를 생성 및 저장
# # 백터 스토어 생성
# vector_store = FAISS.from_documents(documents= split_document, embedding= embeddings)
#
#
# # 5. retriever(검색기 생성)
# # 문서에 포함되어 있는 정보를 검색하고 생성합니다
# retriever = vector_store.as_retriever()
#
# # 6. create prompt(프롬프트를 생성합니다)
# # 프롬프트를 생성합니다
# template2 =   """You are an assistant for question-answering tasks.
# Use the following pieces of retrieved context to answer the question.
# If you don't know the answer, just say that you don't know.
# Answer in English.
#
# #Question:
# {question}
# #Context:
# {context}
#
# #Answer:"""
#
# prompt = PromptTemplate.from_template(template2)
#
#
# # 7. generate LLM (LLM 언어모델 생성)
# # 언어 모델을 생성합니다
#
# llm2 = HuggingFaceEndpoint(
#     repo_id=repo_id,
#     temperature = 0.5,
#     model_kwargs={"max_length": 128},
#     huggingfacehub_api_token=os.environ["HUGGINGFACEHUB_API_TOKEN"],
# )
# #
# # 8. create chian(체인 생성)
# # 체인을 생성합니다
# chain = (
#     {"context": retriever, "question": RunnablePassthrough()}
#     | prompt
#     | llm2
#     | StrOutputParser()
# )
#----------------------------------------RAG for pdf document done---------------------------------------------------


# question = "what technology was used for plant monitoring system?"
# response = chain.invoke(question)
# print(response)
# -----------------------------------



# # sample query for chatbot
#
# # template = """ Quenstion : {user message} \n Answer : {bot response}"""
# template1 = """Question: {question}
#
# Answer: Let's think step by step."""
# promt_template = PromptTemplate.from_template(template1)
#
# # prompt_template = chat.ChatPromptTemplate.from_template("The user said : {user message} \n The bot should respond this")
# #
# # # Initialize chat bot model
# # # model_path = "models/Meta-Llama-3-8B-Instruct.Q4_K_S.gguf"
# # # llm = GPT4All(model_path)
#
# # llm_chain = LLMChain(llm = llm, prompt_template = promt_template)
# llm_chain = promt_template | llm
#
# question = "Who is Donald Trump?"
# # responses = llm.chain.invoke({"question " : question})
# responses = llm_chain.invoke({"question": question})
#
# print(responses)
#

# ------------------------------ STT  speech to text ------------------------------


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
nz = pytz.timezone('Pacific/Auckland')

# Database model and schema
class Environments(db.Model):
    __tablename__ = 'lab_data_2025'
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


#--------------------------------------Using RAG for MySQL database--------------------------
# 1. db connection done
db_sql = SQLDatabase.from_uri(mysql_uri)
#
# # 2. HuggingfaceLLM
# # use LLM what we made
llm_openai = ChatOpenAI(model_name ="gpt-3.5-turbo", temperature=0)
dbsql_chain = SQLDatabaseChain.from_llm(llm_openai, db_sql, verbose=True, return_intermediate_steps=False)

db_sql = SQLDatabase.from_uri(mysql_uri)
# 1.db
query = "SELECT * FROM lab_data_2025"

# Step 2: Load tables as documents
loader = SQLDatabaseLoader(query, db_sql)
documents = loader.load()
print(f"pagenumber : {len(documents)}")

text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=50)
split_doc = text_splitter.split_documents(documents)
print(f"chunk : {len(split_doc)}")

# Step 4: Embed documents
# embeddings_sql = HuggingFaceEmbeddings(model_name= "sentence-transformers/all-MiniLM-L12-v2")
embeddings_sql = OpenAIEmbeddings()
vectorstore_sql = FAISS.from_documents(split_doc, embeddings_sql)

template2 =   """You are a smart assistant that answers questions based on lab data retrieved from a MySQL database.

Only answer based on the provided context. Be precise and avoid guessing. If the data is unclear or missing, respond with "I don't know."

Make sure to include temperature ranges correctly when asked, and check the dates carefully.

#Question:
{question}
#Context:
{context}

#Answer:"""

prompt = PromptTemplate.from_template(template2)

# Step 5: Set up RetrievalQA
retriever_sql = vectorstore_sql.as_retriever()
llm_openai = ChatOpenAI(model_name ="gpt-3.5-turbo", temperature=0)
qa_chain = RetrievalQA.from_chain_type(
    llm=llm_openai,
    retriever=retriever_sql,
    return_source_documents=True
)

chain_sql = (
    {"context": retriever_sql, "question": RunnablePassthrough()}
    | prompt
    | llm_openai
    | StrOutputParser()
)

# -----------------------------
# ------------------------------- LLM for control sensor or motor using LLM -------------

llm3 = HuggingFaceHub(
    repo_id="meta-llama/Llama-3.1-8B-Instruct",
    model_kwargs={"temperature": 0.5, "max_length": 100}
)



# ------------------------------- LLM for control sensor or motor using LLM -------------


# # Connect to MySQL database
# db_sql = SQLDatabase.from_uri(mysql_uri)
# SQL_splitter = SQLDatabaseLoader.load_and_split(text_splitter= RecursiveCharacterTextSplitter)
# retriever2 = SQLDatabaseLoader(db_sql).load()
# embeddings2 = HuggingFaceEmbeddings()
# vectorstore = FAISS.from_documents(retriever2, embeddings2)
# qa = RetrievalQA.from_chain_type(llm=llm2, retriever=vectorstore.as_retriever())
# prompt_template = PromptTemplate(
#     template="""
#     You are an assistant that answers weather-related questions based on database records.
#     {question}
#     """,
#     input_variables=["question"]
# )
#
# # chain2 = (
# #     {"context": retriever2, "question": RunnablePassthrough()}
# #     | prompt_template
# #     | llm2
# #     | StrOutputParser()
# # )
# question2 = "what temperature on 3/4/2025 5am?"
# response2 = qa.run(prompt_template.format(question=question2))
# print(response2)

# Replace this with the actual IP address of your ESP32
ESP32_IP = 'http://192.168.137.238' # f"http://{local_ip}:60"

# store rule in memory for now
current_rules = []
conditions = []

# ----------- Intent recognition and function

# def determine_intent()

@app.route('/api/move_motor', methods=['POST'])
def move_motor():
    data = request.json
    angle = data.get('angle')
    if not angle:
        return jsonify({'error': 'No angle provided'}), 400

    resp = request.post(f"{ESP32_IP}/move", json={'angle': angle})
    return jsonify({'message': 'Motor moved successfully', 'response': resp.text})



@app.route('/api/chat_simple', methods = ['POST'])
def chat_simple():
    data = request.json
    question = data.get("question")

    # Basic keyword intent handling
    if "turn on motor" in question:
        try:
            r = requests.get(f"{ESP32_IP}/motor/on", timeout=3)
            return jsonify({'answer': "Motor is now ON ✅"})
        except Exception as e:
            return jsonify({'answer': f"⚠️ Failed to turn on motor: {e}"})

    elif "turn off motor" in question:
        try:
            r = requests.get(f"{ESP32_IP}/motor/off", timeout=3)
            return jsonify({'answer': "Motor is now OFF ❌"})
        except Exception as e:
            return jsonify({'answer': f"⚠️ Failed to turn off motor: {e}"})

        # --------------------

    if not question:
        return jsonify({"error": "No question provided"}), 400

    print(f"Received question: {question}")

    print("Calling chain...")
    response = dbsql_chain.invoke(question)
    formatted = f"\nResult:\n{response['result']}"
    print(f"Response: {formatted}")
    return jsonify({"answer": formatted})
    # print(f"Response: {response}")
    # return jsonify({"answer": response})

# SQL Query:\n{response['query']}\n

# @app.route('/api/navigate', methods=['POST'])
# def navigate():
#
#

def parse_condition(command, sensor_data):
    pattern = re.search(r'temperature\s*<\s*(\d+)', command, re.I)
    if pattern:
        threshold = int(pattern.group(1))
        current_temp = sensor_data.get("temperature", 100)
        return "on" if current_temp < threshold else "off"
    return None


# @app.route('/api/admin_chat', methods=['POST'])
# def admin_chat():
#     global current_rules
#     data = request.json
#     question = data.get("question")
#
#     system_prompt = """
# You are a smart IoT rule assistant. Extract condition and action from admin command.
#
# Respond in JSON like:
# {"condition": "temperature < 25", "action": "motor_on"}
#
# Supported actions: motor_on, motor_off, fan_on, fan_off.
#
# ONLY RETURN JSON.
# """
#
#     prompt = system_prompt + "\nCommand: " + question
#
#     result = llm.invoke(prompt)
#
#     try:
#         rule = json.loads(result)
#         current_rules.append(rule)
#         return jsonify({"answer": "Rule added successfully", "rule": rule})
#     except Exception as e:
#         return jsonify({"answer": "Failed to parse rule", "error": str(e)})
#
# @app.route('/api/get_rules', methods=['GET'])
# def get_rules():
#     return jsonify(current_rules)
#
# @app.route('/api/motor/on', methods=['POST'])
# def motor_on():
#     requests.get(f"{ESP32_IP}/motor/on")
#     return jsonify({"message": "Motor turned ON"})
#
# @app.route('/api/motor/off', methods=['POST'])
# def motor_off():
#     requests.get(f"{ESP32_IP}/motor/off")
#     return jsonify({"message": "Motor turned OFF"})

@app.route('/api/add_condition', methods=['POST'])
def add_condition():
    data = request.json
    conditions.append(data)
    print("Current Conditions:", conditions)
    return jsonify({"status": "condition added"})




@app.route('/api/admin_chat', methods=['POST'])
def admin_chat():
    question = request.json.get("question")

    # Get latest sensor values
    rows = db_sql.run_no_throw("SELECT * FROM lab_data_2025 ORDER BY id DESC LIMIT 1")
    if not rows or not rows.rows:
        return jsonify({'answer': "No sensor data available."})

    sensor_data = dict(zip(rows.columns, rows.rows[0]))

    # Generate LLM response
    llm_prompt = (
        f"Sensor reading: {sensor_data}. Based on this, analyze the command: '{question}' "
        "and respond whether motor should turn 'on' or 'off'."
    )
    response = llm3(llm_prompt)

    # Basic fallback parser
    action = parse_condition(question, sensor_data)
    if action in ("on", "off"):
        try:
            requests.get(f"{ESP32_IP}/motor/{action}")
            return jsonify({'answer': f"Motor turned {action}. Reason: {response.strip()}"})
        except:
            return jsonify({'answer': f"Failed to contact ESP32. Decision was to turn motor {action}."})

    return jsonify({'answer': response.strip()})

@app.route('/api/motor/<state>')
def motor_control(state):
    try:
        r = requests.get(f"{ESP32_IP}/motor/{state}")
        return jsonify({'status': f"Motor turned {state}"})
    except:
        return jsonify({'status': 'Failed to reach ESP32'}), 500


def generate_text(prompt):
    """
    Generate text using the LLM.
    """
    chain = LLMChain(llm=llm, prompt=PromptTemplate(template=prompt))
    response = chain.run(prompt)
    return response

def text_to_speech(text):

    """
    Convert text to speech using TTS.
    gTTS를 사용하여 텍스트를 음성으로 변환
    """
    # Implement your TTS logic here
    pass

@app.route('/query', methods=['POST'])
def query_db():
    try:
        data = request.json
        query = data.get("query")

        # Use LangChain to convert natural language into SQL queries
        response = db_chain.run(query)

        return jsonify({"response": response})

    except Exception as e:
        return jsonify({"error": str(e)})


# @app.route("/chat", methods=["POST"])
# def chat():
#     user_input = request.json["message"]
#
#     import re
#     match = re.search(r"(\d{2}/\d{2}/\d{2})[, ]+(\d{1,2}:\d{2}(?:am|pm)?)", user_input)
#
#     if match:
#         date_str, time_str = match.groups()
#
#         # Convert date/time to proper format
#         from datetime import datetime
#         date_obj = datetime.strptime(date_str, "%d/%m/%y")
#         time_obj = datetime.strptime(time_str, "%I:%M%p")
#
#         # Combine into full datetime format
#         timestamp = datetime.combine(date_obj, time_obj.time())
#
#         # Identify the measurement type (temperature, humidity, etc.)
#         keywords = ["temperature", "humidity", "light", "waterLevel", "soilHumidity", "steam"]
#         measurement = next((word for word in keywords if word in user_input.lower()), None)
#
#         if measurement:
#             # Query SQLAlchemy instead of using cursor
#             result = Environments.query.filter_by(timestamp=timestamp).first()
#
#             if result:
#                 value = getattr(result, measurement)  # Dynamically get the correct column value
#                 reply = f"The {measurement} value on {date_str}, {time_str} is {value}."
#             else:
#                 reply = "I couldn't find the data for that date and time."
#         else:
#             reply = "Please specify what measurement you want (temperature, humidity, etc.)."
#
#     else:
#         reply = llm(user_input)  # Use GPT4All for general questions
#
#     return jsonify({"reply": reply})


# Routes and API endpoints
@app.route('/')
def welcome():
    return "<h1>Welcome to Smart Farm</h1>"


@app.route('/api/data', methods=['GET'])
def get_data():
    datas = Environments.query.all()
    result = environments_schema.dump(datas)
    return jsonify(result)

@app.route('/api/data/timestamp', methods=['GET'])
def get_data_by_timestamp():
    timestamp = request.args.get('timestamp')
    data = Environments.query.filter_by(timestamp=timestamp).first()
    if data:
        return environment_schema.jsonify(data)
    else:
        return jsonify({"message": "No data found for this timestamp"}), 404


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
