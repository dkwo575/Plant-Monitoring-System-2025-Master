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
from langchain_mistralai import ChatMistralAI
import openai

from langchain.prompts import PromptTemplate
from langchain_huggingface import HuggingFaceEmbeddings

from langchain.chains import RetrievalQA
from langchain.callbacks import get_openai_callback
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

# library for generate report
from docx import Document
from docx.shared import Inches
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from io import BytesIO
from matplotlib import pyplot as plt
import pandas as pd




# Initialize Flask app and extensions
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, expose_headers = ["Content-Disposition"])
socketio = SocketIO(app, cors_allowed_origins="*")

load_dotenv()
# 关键：让 OpenAIEmbeddings 能找到 API KEY
# if os.getenv('OPENROUTE_API_KEY'):
#     os.environ['OPENAI_API_KEY'] = os.getenv('OPENROUTE_API_KEY')
openaikey = os.getenv('OPENAI_API_KEY')

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URL")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
ma = Marshmallow(app)
mysql_uri = app.config['SQLALCHEMY_DATABASE_URI']
# Example: mysql_uri = "mysql+pymysql://YuiWang:yourpassword@localhost:3306/sensor_DB"


# # Initialize Langchain
huggingfaceAPI = os.getenv('HUGGINGFACEHUB_API_TOKEN')
repo_id = 'mistralai/Mistral-7B-Instruct-v0.3'

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

llm = HuggingFaceEndpoint(
    repo_id=repo_id,
    temperature = 0.5,
    model_kwargs={"max_length": 128},
    huggingfacehub_api_token=huggingfaceAPI,
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
        self.timestamp =timestamp or datetime.datetime.now


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
# llm_openai = ChatOpenAI(model_name ="gpt-3.5-turbo", temperature=0)
# 需要更改，上面的这个
openRouterAPI = os.getenv('OPENROUTER_API_KEY')
llm_openai = ChatOpenAI(model = "deepseek/deepseek-chat-v3.1:free", openai_api_key = openRouterAPI, base_url = "https://openrouter.ai/api/v1")

dbsql_chain = SQLDatabaseChain.from_llm(llm_openai, db_sql, verbose=True, return_intermediate_steps=False)

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
embeddings_sql = HuggingFaceEmbeddings(model_name= "sentence-transformers/all-MiniLM-L12-v2")
# embeddings_sql = OpenAIEmbeddings()
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
llm_openai = ChatOpenAI(model_name ="gpt-4o-mini", temperature=0)
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

repo_id_mistral = "mistralai/Mistral-7B-Instruct-v0.2"
repo_id_llama = "meta-llama/Llama-3.1-8B-Instruct"

# how can

llm3 = HuggingFaceEndpoint(
    repo_id=repo_id_llama,
    model_kwargs={"max_length": 128},
    temperature=0.5,
    huggingfacehub_api_token= huggingfaceAPI,
)

llm_mistralai = ChatMistralAI(model = repo_id_mistral, temperature=0.5, max_tokens=128, mistral_api_key = huggingfaceAPI)
#  os.environ["HUGGINGFACEHUB_API_TOKEN"]

# llm_chain = prompt | llm
# print(llm_chain.invoke({"question": question}))



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
ESP32_IP = 'http://10.106.190.88:60' #'http://192.168.137.238' # f"http://{local_ip}:60"

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

   # ------------------------ Turn on and off motor using button --------------

    # @app.route('/api/motor/on', methods=['POST'])
    # def motor_on():
    #     requests.get(f"{ESP32_IP}/motor/on")
    #     return jsonify({"message": "Motor turned ON"})
    #
    # @app.route('/api/motor/off', methods=['POST'])
    # def motor_off():
    #     requests.get(f"{ESP32_IP}/motor/off")
    #     return jsonify({"message": "Motor turned OFF"})

@app.route('/api/motor/<state>', methods = ['GET'])
def motor_control(state):
    try:
        requests.get(f"{ESP32_IP}/motor/{state}")
        return jsonify({'status': f"Motor turned {state}"})
    except:
        return jsonify({'status': 'Failed to reach ESP32 and check'}), 500
        print("Failed to reach ESP32 and check the connection.")

    # ----------------------------------- Turn on and off LED using button ---------------

    # @app.route('/api/led/on', methods=['POST'])
    # def led_on():
    #     requests.get(f"{ESP32_IP}/led/on")
    #     return jsonify({"message": "LED turned ON"})
    #
    # @app.route('/api/led/off', methods = ['POST'])
    # def led_off():
    #     requests.get(f"{ESP32_IP}/led/off")
    #     return jsonify({"message": "LED turned OFF"})

@app.route('/api/led/<state>', methods = ['GET'])
def led_control(state):
    try:
        requests.get(f"{ESP32_IP}/led/{state}")
        return jsonify({'status': f"LED turned {state}"})
    except:
        return jsonify({'status': 'Failed to reach ESP32'}), 500
        print("Failed to reach ESP32 and check the LED connection.")






# -------------------------------- admin chat Version2 -----------------

@app.route('/api/admin_chat_V2', methods=['POST'])
def admin_chat_V2():
    global current_rules
    data = request.json
    question = data.get("question")

    system_prompt = """
You are a smart IoT rule assistant. Extract condition and action from admin command.

Respond in JSON like:
{"condition": "temperature < 25", "action": "motor_on"}

Supported actions: motor_on, motor_off, fan_on, fan_off.

ONLY RETURN JSON.
"""

    prompt = system_prompt + "\nCommand: " + question
    # llm_chain3 = prompt | llm3
    # print(llm_chain.invoke({"question": question}))

    # result = llm3.invoke(llm_chain3)
    result = llm_openai.invoke(prompt)

    try:
        rule = json.loads(result)
        current_rules.append(rule)
        return jsonify({"answer": "Rule added successfully", "rule": rule})
    except Exception as e:
        return jsonify({"answer": "Failed to parse rule", "error": str(e)})

@app.route('/api/get_rules', methods=['GET'])
def get_rules():
    return jsonify(current_rules)


# --------------------------- admin chat version 1----------------------

@app.route('/api/add_condition', methods=['POST'])
def add_condition():
    data = request.json
    conditions.append(data)
    print("Current Conditions:", conditions)
    return jsonify({"status": "condition added"})

def parse_condition(command, sensor_data):
    # Define patterns and actions
    condition_patterns = [
        ('temperature', r'temperature\s*(<=|>=|<|>)\s*(\d+)'),
        ('humidity', r'humidity\s*(<=|>=|<|>)\s*(\d+)'),
        ('light', r'light\s*(<=|>=|<|>)\s*(\d+)'),
        ('soil_humidity', r'soil humidity\s*(<=|>=|<|>)\s*(\d+)'),
        ('water_level', r'water level\s*(<=|>=|<|>)\s*(\d+)'),
        ('steam', r'steam\s*(<=|>=|<|>)\s*(\d+)'),
    ]

    # Determine device type from command
    device_type = "motor"  # default
    command_lower = command.lower()
    if any(word in command.lower() for word in ['led', 'light', 'lamp', 'bulb']):
        device_type = "led"
    elif any(word in command.lower() for word in ['motor', 'pump', 'fan']):
        device_type = "motor"

    for key, pattern in condition_patterns:
        match = re.search(pattern, command, re.IGNORECASE)
        if match:
            operator = match.group(1)
            threshold = int(match.group(2))
            current_value = sensor_data.get(key)

            if current_value is None:
                continue

                # Perform the actual comparison
            # if operator == '<' and current_value < threshold:
            #     return "on", f"{key} ({current_value}) is less than {threshold}"
            # elif operator == '>' and current_value > threshold:
            #     return "on", f"{key} ({current_value}) is greater than {threshold}"
            # elif operator == '<=' and current_value <= threshold:
            #     return "on", f"{key} ({current_value}) is less than or equal to {threshold}"
            # elif operator == '>=' and current_value >= threshold:
            #     return "on", f"{key} ({current_value}) is greater than or equal to {threshold}"
            # else:
            #     return "off", f"{key} ({current_value}) does not meet the condition ({operator} {threshold})"

                # Perform the actual comparison
            condition_met = False
            if operator == '<' and current_value < threshold:
                condition_met = True
            elif operator == '>' and current_value > threshold:
                condition_met = True
            elif operator == '<=' and current_value <= threshold:
                condition_met = True
            elif operator == '>=' and current_value >= threshold:
                condition_met = True
            elif operator == '=' and current_value == threshold:
                condition_met = True

                # # Determine action based on command intent and condition
                # if condition_met:
                #     if any(word in command.lower() for word in ['turn on', 'start', 'activate', 'enable']):
                #         return device_type, "on", f"{key} ({current_value}) meets condition ({operator} {threshold})"
                #     elif any(word in command.lower() for word in ['turn off', 'stop', 'deactivate', 'disable']):
                #         return device_type, "off", f"{key} ({current_value}) meets condition ({operator} {threshold})"
                #     else:
                #         # Default to 'on' if condition is met but no clear action specified
                #         return device_type, "on", f"{key} ({current_value}) meets condition ({operator} {threshold})"
                # else:
                #     # Condition not met, return opposite action
                #     if any(word in command.lower() for word in ['turn on', 'start', 'activate', 'enable']):
                #         return device_type, "off", f"{key} ({current_value}) does not meet condition ({operator} {threshold})"
                #     elif any(word in command.lower() for word in ['turn off', 'stop', 'deactivate', 'disable']):
                #         return device_type, "on", f"{key} ({current_value}) does not meet condition ({operator} {threshold})"
                #     else:
                #         return device_type, "off", f"{key} ({current_value}) does not meet condition ({operator} {threshold})"
                # Determine the intended action from the command
                intended_action = "on"  # default
                if any(phrase in command_lower for phrase in ['turn on', 'start', 'activate', 'enable']):
                    intended_action = "on"
                elif any(phrase in command_lower for phrase in ['turn off', 'stop', 'deactivate', 'disable']):
                    intended_action = "off"

                # Execute the intended action only if condition is met
                if condition_met:
                    return device_type, intended_action, f"{key} ({current_value}) meets condition ({operator} {threshold})"
                else:
                    # Condition not met, do the opposite
                    opposite_action = "off" if intended_action == "on" else "on"
                    return device_type, opposite_action, f"{key} ({current_value}) does not meet condition ({operator} {threshold})"

            return None, None, None  # No matching condition


def send_device_command(device_type, action, esp32_ip):
    """Send command to appropriate device endpoint"""
    try:
        endpoint = f"{esp32_ip}/{device_type}/{action}"
        print(f"Sending command to: {endpoint}")
        response = requests.get(endpoint, timeout=10)

        if response.status_code == 200:
            return True, f"{device_type.upper()} turned {action}"
        else:
            return False, f"ESP32 returned status {response.status_code}"

    except requests.exceptions.ConnectionError:
        return False, f"ESP32 unreachable at {esp32_ip}"
    except requests.exceptions.Timeout:
        return False, f"ESP32 connection timed out"
    except Exception as e:
        return False, f"Error: {str(e)}"


@app.route('/api/admin_chat', methods=['POST'])
def admin_chat():
    data = request.json
    user_input = data.get('question', '') or data.get('text', '')

    # Get latest sensor data using ORM
    latest_data = Environments.query.order_by(Environments.id.desc()).first()
    if not latest_data:
        return jsonify({'answer': 'No sensor data available or database error.'})

    if isinstance(latest_data, str):
        print("DB Error:", latest_data)
        return jsonify({'answer': f"Database error: {latest_data}"})

    # sensor_data = dict(zip(results.columns, results.rows[0]))

    sensor_data = {
        'temperature': latest_data.temperature,
        'humidity': latest_data.humidity,
        'light': latest_data.light,
        'soil_humidity': latest_data.soilHumidity,
        'water_level': latest_data.waterLevel,
        'steam': latest_data.steam,
        # 'timestamp': latest_data.created_at.strftime("%Y-%m-%d %H:%M:%S")
    }



    # if hasattr(llm_response, "content"):
    #     llm_text = llm_response.content.strip()
    # else:
    #     llm_text = str(llm_response).strip()

    # Basic fallback parser
    # # 🔍 Step 1: Try rule-based parser first
    # action = parse_condition(user_input, sensor_data)
    # if action in ("on", "off"):
    #     try:
    #         requests.get(f"{ESP32_IP}/motor/{action}")
    #         return jsonify({'answer': f"Motor turned {action}. Reason: condition"})
    #     except:
    #         return jsonify({'answer': f"ESP32 unreachable. Motor should be {action}. Reason: condition "})

    # Step 1: Try rule-based parser first
    result = parse_condition(user_input, sensor_data)
    if result and len(result) == 3:  # device_type, action, reason
        device_type, action, reason = result
        if device_type and action in ("on", "off"):
            success, message = send_device_command(device_type, action, ESP32_IP)
            if success:
                return jsonify({'answer': f"{message}. Reason: {reason}"})
            else:
                return jsonify({'answer': f"{message}. {device_type.upper()} should be {action}. Reason: {reason}"})

    # return jsonify({'answer': llm_text})

    # Build prompt for LLM
    # 📚 Step 2: Use LLM if rule-based logic fails
    context = (
        f"Sensor readings:\n"
        f"- Temperature: {sensor_data['temperature']} °C\n"
        f"- Humidity: {sensor_data['humidity']} %\n"
        f"- Light: {sensor_data['light']}\n"
        f"- Soil Humidity: {sensor_data['soil_humidity']} %\n"
        f"- Water Level: {sensor_data['water_level']} cm\n"
        f"- Steam: {sensor_data['steam']} %\n"
        # f"- Time: {sensor_data['timestamp']}\n\n"
    )

    prompt = context + (f"User command: {user_input}\n" 
        #                "If the command includes a condition like 'temperature < 25', evaluate only that condition. "
        # "If not, analyze all sensor values to decide. "
        # "Respond strictly with 'on' or 'off' and a brief reason."
                        "IMPORTANT: Interpret commands literally, not based on logical assumptions.\n"
        "If user says 'turn on X if condition Y', turn on X ONLY when condition Y is TRUE.\n"
        "If user says 'turn off X if condition Y', turn off X ONLY when condition Y is TRUE.\n"
        "Examples:\n"
        "- 'turn on led if temperature > 20' with temp=25 → turn LED ON (condition is true)\n"
        "- 'turn on led if temperature > 20' with temp=15 → turn LED OFF (condition is false)\n"
        "- 'turn off led if temperature > 20' with temp=25 → turn LED OFF (condition is true)\n"
        "- 'turn off led if temperature > 20' with temp=15 → turn LED ON (condition is false)\n\n"
        "Device identification:\n"
        "- If command mentions 'LED', 'light', 'lamp', or 'bulb', control the LED\n"
        "- If command mentions 'motor', 'pump', or 'fan', control the motor\n"
        "- If no device specified, default to motor\n\n"
        "For conditional commands (with 'if'):\n"
        "1. Check if the condition is true or false\n"
        "2. If condition is TRUE, execute the requested action (on/off)\n"
        "3. If condition is FALSE, do the opposite action\n\n"
        "For non-conditional commands, analyze sensor values to decide the best action.\n\n"
        "Respond EXACTLY in this format: 'DEVICE:ACTION:REASON'\n"
        "Where DEVICE is 'motor' or 'led', ACTION is 'on' or 'off', and REASON explains your decision."
                        )
    # Generate LLM response
    # llm_prompt = (
    #     f"Sensor reading: {sensor_data}. Based on this, analyze the command: '{question}' "
    #     "and respond whether motor should turn 'on' or 'off'."
    # )
    # llm_response = llm_openai.invoke(prompt)

    try:
        llm_response = llm_openai.invoke(prompt)
        print("User input:", user_input)
        print("LLM response type:", type(llm_response))
        print("LLM response:", llm_response)

        llm_text = getattr(llm_response, "content", str(llm_response)).strip()

        # Parse LLM response in format "DEVICE:ACTION:REASON"
        if ':' in llm_text:
            parts = llm_text.split(':', 2)
            if len(parts) >= 2:
                device_type = parts[0].lower().strip()
                action = parts[1].lower().strip()
                reason = parts[2] if len(parts) > 2 else "LLM decision"

                if device_type in ['motor', 'led'] and action in ['on', 'off']:
                    success, message = send_device_command(device_type, action, ESP32_IP)
                    if success:
                        return jsonify({'answer': f"{message}. Reason: {reason}"})
                    else:
                        return jsonify(
                            {'answer': f"{message}. {device_type.upper()} should be {action}. Reason: {reason}"})

        # Fallback parsing if format is not followed
        device_type = "motor"  # default
        if any(word in llm_text.lower() for word in ['led', 'light', 'lamp', 'bulb']):
            device_type = "led"

        action = None
        if llm_text.lower().startswith('on') or ' on ' in llm_text.lower():
            action = "on"
        elif llm_text.lower().startswith('off') or ' off ' in llm_text.lower():
            action = "off"

        if action:
            success, message = send_device_command(device_type, action, ESP32_IP)
            if success:
                return jsonify({'answer': f"{message}. LLM reason: {llm_text}"})
            else:
                return jsonify({'answer': f"{message}. {device_type.upper()} should be {action}. Reason: {llm_text}"})

        return jsonify({'answer': f"LLM was unsure: {llm_text}"})

    except Exception as e:
        print(f"LLM error: {e}")
        return jsonify({'answer': f"LLM error: {str(e)}"})

# ----------------------- Report generation ------------------------------

def create_graph(df, column_name, file_path):
    plt.figure(figsize=(10, 5))
    plt.plot(df['timestamp'], df[column_name], marker='o', linestyle='-', color='b')
    plt.title(f'{column_name.capitalize()} Over Time')
    plt.xlabel('Timestamp')
    plt.ylabel(column_name.capitalize())
    plt.xticks(rotation=45)
    plt.grid(True)
    plt.savefig(file_path)
    plt.close()

def generate_llm_summary(df):
    summary_prompt_V2 = f"""
    
    Analyze the following sensor data and provide a summary of the plant's health and environment.
    The data covers the period from {df['timestamp'].min()} to {df['timestamp'].max()}.
    
    Key statistics:
    - Temperature:
        - Average: {df['temperature'].mean():.2f} °C
        - Min: {df['temperature'].min()} °C
        - Max: {df['temperature'].max()} °C
        
    - Humidity:
        - Average: {df['humidity'].mean():.2f} %
        - Min: {df['humidity'].min()} %
        - Max: {df['humidity'].max()} %
         
    - Light:
        - Average: {df['light'].mean():.2f}
        - Min: {df['light'].min()}
        - Max: {df['light'].max()} 
    
    - Soil Humidity:
        - Average: {df['soilHumidity'].mean():.2f} %
        - Min: {df['soilHumidity'].min()} %
        - Max: {df['soilHumidity'].max()} %    
    
    - Water Level:
        - Average: {df['waterLevel'].mean():.2f} cm
        - Min: {df['waterLevel'].min()} cm
        - Max: {df['waterLevel'].max()} cm
           
    - Steam:
        - Average: {df['steam'].mean():.2f} %
        - Min: {df['steam'].min()} %
        - Max: {df['steam'].max()} %
        
    Based on this data, please provide a brief analysis and any recommendations for improving the plant's environment.
        
    """
    summary_response = llm_openai.invoke(summary_prompt_V2)
    return summary_response.content


def create_pdf_report(summary, graph_paths):

    bio = BytesIO()
    doc = SimpleDocTemplate(bio, pagesize=A4)
    style = getSampleStyleSheet()
    story = []

    story.append(Paragraph("Farm Environmental Report", style['Title']))
    story.append(Spacer(1, 12))

    # Replace newlines with HTML line breaks for proper rendering in the PDF
    summary_with_breaks = summary.replace('\n', '<br/>')
    story.append(Paragraph(summary_with_breaks, style['BodyText']))
    story.append(Spacer(1, 24))

    for graph_path in graph_paths:
        # Extract the metric name from the file path to use as a subtitle
        metric_name = os.path.basename(graph_path).split('_')[0].capitalize()
        
        # Add a subtitle for each graph
        story.append(Paragraph(f"{metric_name} Over Time", style['h2']))
        story.append(Spacer(1, 6))

        img = Image(graph_path, width=400, height=300)
        story.append(img)
        story.append(Spacer(1, 24))

    doc.build(story)
    bio.seek(0)
    return bio


@app.route('/api/report', methods=['GET'])
def generate_report():
    period = request.args.get('period', 'weekly')  # Default to daily report
    report_format = request.args.get('format', 'pdf')  # Default to PDF format

    end_date = datetime.datetime.now(nz)

    if period == 'weekly':
        start_date = end_date - datetime.timedelta(days=7)
    elif period == 'monthly':
        start_date = end_date - datetime.timedelta(days=30)
    else:  # Default to daily report
        return jsonify({"error": "Invalid period specified. Use 'daily', 'weekly', or 'monthly'."}), 400

    # Fetch data from the database
    query = db.session.query(Environments).filter(Environments.timestamp.between(start_date, end_date))
    df = pd.read_sql(query.statement, db.engine)

    if df.empty:
        return jsonify({"error": "No data available for the specified period."}), 404

    # Generate graphs
    graph_paths = []
    for col in ['temperature', 'humidity', 'light', 'soilHumidity', 'waterLevel', 'steam']:
        graph_path = f"static/graphs/{col}_{start_date.strftime('%Y%m%d')}_to_{end_date.strftime('%Y%m%d')}.png"
        create_graph(df, col, graph_path)
        graph_paths.append(graph_path)

    # Generate LLM summary
    summary = generate_llm_summary(df)

    current_date = datetime.datetime.now(nz).strftime("%Y-%m-%d %H:%M:%S")

    # convert datetime obj to string
    str_current_datetime = str(current_date)

    # Create report
    if report_format == 'pdf':
        report_bio = create_pdf_report(summary, graph_paths)
        mimetype = 'application/pdf'
        filename = (str_current_datetime + "_report.pdf").replace(" ", "_").replace(":", "-")  # Replace spaces and colons for filename

    else:
        return jsonify({"error": "Invalid format specified. Use 'pdf'."}), 400

    # clean up temporary graph files
    # for path in graph_paths:
    #     os.remove(path)

    return send_file(report_bio, mimetype = mimetype, as_attachment= True, download_name=filename)


# ------------------------------------------------------
#         # Extract action more reliably
#         action = None
#         if llm_text.lower().startswith('on'):
#             action = "on"
#         elif llm_text.lower().startswith('off'):
#             action = "off"
#         elif ' on ' in llm_text.lower() or llm_text.lower().endswith(' on'):
#             action = "on"
#         elif ' off ' in llm_text.lower() or llm_text.lower().endswith(' off'):
#             action = "off"
#
#         if action:
#             try:
#                 requests.get(f"{ESP32_IP}/motor/{action}")
#                 return jsonify({'answer': f"Motor turned {action}. LLM reason: {llm_text}"})
#             except:
#                 return jsonify({'answer': f"ESP32 unreachable. LLM says motor should be {action}. Reason: {llm_text}"})
#
#         return jsonify({'answer': f"LLM was unsure: {llm_text}"})
#
#     except Exception as e:
#         print(f"LLM error: {e}")
#         return jsonify({'answer': f"LLM error: {str(e)}"})

# ----------------------------

    # llm_response = llm_openai.invoke(prompt)
    # print("User input :", user_input)
    # print("LLM response type:", type(llm_response))
    # print("LLM response:", llm_response)
    # llm_text = getattr(llm_response, "content", str(llm_response)).strip()
    #
    # # print(f"Sensor data: {sensor_data}")
    # # print(f"Parsed command result: action={action}, reason={llm_response}")
    #
    # # Optional: Extract "on" or "off" from LLM text for safety
    # action = "on" if "on" in llm_text.lower() else "off" if "off" in llm_text.lower() else None
    #
    # if action:
    #     try:
    #         requests.get(f"{ESP32_IP}/motor/{action}")
    #         return jsonify({'answer': f"Motor turned {action}. LLM reason: {llm_text}"})
    #     except:
    #         return jsonify({'answer': f"ESP32 unreachable. LLM says motor should be {action}. Reason: {llm_text}"})
    #
    # return jsonify({'answer': f"LLM was unsure: {llm_text}"})






#  Function for condition evaluation and action execution



def generate_text(prompt):
    """
    Generate text using the LLM.
    """
    chain = LLMChain(llm=llm, prompt=PromptTemplate(template=prompt))
    response = chain.run(prompt)
    return response


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
