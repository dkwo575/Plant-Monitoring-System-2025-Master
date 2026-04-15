# -*- coding: utf-8 -*-
import os
import json
import re
import uuid
import datetime
from functools import wraps
from types import SimpleNamespace
import time
import tempfile
from os import getenv
import sys

from collections import Counter

import numpy as np
import cv2 as cv
import mmcv
import pytz
import requests
import pyrealsense2 as rs
import roslibpy
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
from PIL import Image as PILImage
from reportlab.platypus import Image as RLImage
import base64
import time
import getpass
import io
from google import genai
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Any
import threading

from langchain_classic.chains import LLMChain
# from langchain.prompts import PromptTemplate
from langchain_community.llms import HuggingFaceHub
# from langchain_core.prompts import PromptTemplate, ChatPromptTemplate
from langchain_community.llms import huggingface_endpoint
from langchain_experimental.sql import SQLDatabaseChain  # library for database
from langchain_community.utilities.sql_database import SQLDatabase
from langchain_huggingface import HuggingFaceEndpoint, ChatHuggingFace
# from langchain.memory import ConversationBufferMemory  # library for memory
from langchain_classic.memory import ConversationBufferMemory
# from langchain.schema import BaseMessage, HumanMessage, AIMessage
from langchain.messages import AIMessage, HumanMessage
from langchain_core.messages import HumanMessage
from langchain_ollama import ChatOllama
from langchain_huggingface.llms.huggingface_endpoint import HuggingFaceEndpoint
from huggingface_hub import login

# langchain library for RAG
from langchain_community.embeddings import HuggingFaceEmbeddings, FastEmbedEmbeddings
from langchain_community.document_loaders import SQLDatabaseLoader, PyMuPDFLoader ,DirectoryLoader # SQLDatabaseLoader, pyMuPDFLoader,DirectoryLoader
from langchain_community.vectorstores.faiss import FAISS
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
# from langchain.text_splitter import CharacterTextSplitter
from langchain_text_splitters import CharacterTextSplitter

from langchain_openrouter import ChatOpenRouter

from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_mistralai import ChatMistralAI
import openai
from langsmith import traceable

# from langchain.prompts import PromptTemplate
from langchain_core.prompts import PromptTemplate
from langchain_huggingface import HuggingFaceEmbeddings

# from langchain.chains import RetrievalQA
from langchain_classic.chains import RetrievalQA
# from langchain.callbacks import get_openai_callback
from langchain_community.callbacks import get_openai_callback
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from huggingface_hub import InferenceClient

# from langchain_classic import RetrievalQA

from langchain_groq import ChatGroq
from langchain_ollama import ChatOllama
from langchain_core.language_models.chat_models import BaseChatModel

from transformers import AutoTokenizer, AutoModelForImageTextToText, AutoModelForVision2Seq, AutoProcessor, pipeline, AutoModelForCausalLM
from langchain_huggingface.llms.huggingface_pipeline import HuggingFacePipeline
#
# from langchain_core.prompts import PromptTemplate
# from langchain_openai import ChatOpenAI, OpenAIEmbeddings

# ===== RAG Import ====
from langchain_experimental.open_clip import OpenCLIPEmbeddings
from langchain_chroma import Chroma
from langchain_core.messages import SystemMessage
from langchain_groq import ChatGroq
from langchain_google_genai import GoogleGenerativeAI
from langchain_nvidia_ai_endpoints import ChatNVIDIA

# library for chatbot
# from langchain.llms import huggingface_hub

# library for controlling
import controll

# library for chatbot
# from langchain_community.llms import GPT4All
# from langchain.llms import llamacpp
# from langchain.chains import LLMchain
# from langchain_community.llms import llamacpp
# from langchain_core.prompts import chat

from langchain_classic.chains import create_sql_query_chain
# from langchain.chains import create_sql_query_chain
from langchain_community.tools.sql_database.tool import QuerySQLDataBaseTool
from langchain_core.runnables import RunnableLambda, RunnablePassthrough
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser


# LIBRARY FOR ROBOT CONTROL

# library for generate report
from docx import Document
from docx.shared import Inches
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from io import BytesIO
from matplotlib import pyplot as plt
import pandas as pd
import logging

from multi_robot_manager import MultiRobotManager, RobotConfig


# Initialize Flask app and extensions
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, expose_headers = ["Content-Disposition"])
socketio = SocketIO(app, cors_allowed_origins="*")


env_path = os.path.join(os.path.dirname(__file__), '.env')
loaded = load_dotenv(env_path)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

openaikey = os.getenv('OPENAI_API_KEY')

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://DoJunKwon:AVNS_KE99pn7l6Y54WtmzIsQ@smartfarm2025-smartfarm25.g.aivencloud.com:28350/sensor_DB'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
ma = Marshmallow(app)
mysql_uri = f"mysql+pymysql://DoJunKwon:AVNS_KE99pn7l6Y54WtmzIsQ@smartfarm2025-smartfarm25.g.aivencloud.com:28350/sensor_DB"


# # Initialize Langchain
huggingfaceAPI = os.getenv('HUGGINGFACEHUB_API_TOKEN')
inferenceAPI = os.getenv('HUGGINGFACEHUB_INFERENCE_PROVIDER_API')
googleAPI = os.getenv('GOOGLE_API_KEY')
langsmithAPI = os.getenv('LANGSMITH_API_KEY')
repo_id_mistralai = 'mistralai/Mistral-7B-Instruct-v0.3'
huggingfaceREAD = os.getenv("HUGGINGFACE_READ_TOKEN")
groqAPI = os.getenv("GROQ_API_KEY")
openrouterAPI = os.getenv("OPENROUTER_API_KEY")
nvidiaAPI = os.getenv("NVIDIA_API_KEY")
ollamaAPI = os.getenv("OLLAMA_API_KEY")
cerebrasAPI = os.getenv("CEREBRAS_API_KEY")
openrouterAPI_2 = os.getenv("OPENROUTER_API_KEY_2")
googleAPI2 = os.getenv('GOOGLE_API_KEY_2')

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"


os.environ["HUGGINGFACEHUB_API_TOKEN"] = inferenceAPI

os.environ["LANGSMITH_TRACING"] = "true"
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGSMITH_API_KEY"] = langsmithAPI
os.environ["LANGSMITH_PROJECT"] = "Smart_Farm_Project"
os.environ["LANGSMITH_ENDPOINT"] = "https://api.smith.langchain.com"

os.environ["HUGGINGFACEHUB_API_TOKEN"] = "add your huggingface api"

os.environ['PYT_HF_HUB_ENCODING'] = 'utf-8'

# Disable ChromaDB telemetry (prevents some network-related crashes on startup)
os.environ["ANONYMIZED_TELEMETRY"] = "False"

# configuration of controlling Robot
app.config['JSON_AS_ASCII'] = False

# ================= API key available check Start =================
print("-" * 30)

if loaded:
    print(f"✅ .env file found at: {env_path}")
else:
    print(f"❌ .env file NOT found at: {env_path}")

if openrouterAPI:
    # Print first 5 chars to verify it's the right key
    print(f"🔑 API Key loaded: {openrouterAPI[:5]}... (Length: {len(openrouterAPI)})")
else:
    print("❌ API Key is MISSING or EMPTY in the .env file")
print("-" * 30)

if groqAPI:
    print(f"🔑 API Key loaded: {groqAPI[:5]}... (Length: {len(groqAPI)})")
else:
    print("❌ API Key is MISSING or EMPTY in the .env file")
print("-" * 30)

if googleAPI:
    print(f"🔑 Google API Key loaded: {googleAPI[:5]}... (Length: {len(googleAPI)})")
else:
    print("❌ Google API Key is MISSING or EMPTY in the .env file")
print("-" * 30)

if openaikey:
    print(f"🔑 OpenAI API Key loaded: {openaikey[:5]}... (Length: {len(openaikey)})")
else:
    print("❌ OpenAI API Key is MISSING or EMPTY in the .env file")
print("-" * 30)

if huggingfaceAPI:
    print(f"🔑 Huggingface API Key loaded: {huggingfaceAPI[:5]}... (Length: {len(huggingfaceAPI)})")
else:
    print("❌ huggingface API Key is MISSING or EMPTY in the .env file")
print("-" * 30)

# If key is missing, STOP immediately so you don't get 401 errors
if not openrouterAPI:
    print("STOPPING: Please fix your .env file and restart.")
    sys.exit(1)

# ====== API key available check END ========
# # --- DEBUGGING: Print the loaded API key to the console ---
# print(f"Attempting to use Hugging Face API Key: {inferenceAPI}")
# # --- END DEBUGGING ---
#
# if not inferenceAPI:
#     print("Error: HUGGINGFACE_API_KEY not found in .env file. Make sure the .env file is in the same directory as app.py and contains the line HUGGINGFACE_API_KEY='your_key_here'")
#     exit()

llm = HuggingFaceEndpoint(
    repo_id=repo_id_mistralai,
    temperature = 0.5,
    model_kwargs={"max_length": 128},
    huggingfacehub_api_token=huggingfaceAPI,
)

client_gemma = InferenceClient(provider= "nebius", api_key= inferenceAPI)

db_langchain = SQLDatabase.from_uri(mysql_uri, include_tables=['lab_iot_2025'], sample_rows_in_table_info=2)
db_chain = SQLDatabaseChain.from_llm(llm, db_langchain, verbose = True, top_k = 15)

#check list all available model
client_google = genai.Client()

for m in client_google.models.list():
    print(f"Model name : {m.name}")

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
llm_openrouter = ChatOpenRouter(model="stepfun/step-3.5-flash:free")
llm_googleai = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.5, max_output_tokens=1024, google_api_key=googleAPI)
llm_gemma = ChatGoogleGenerativeAI(model = "gemma-3-27b-it", temperature = 0.5, max_tokens=1024, max_retries=2)
    # ChatOpenAI(model = "openai/gpt-oss-20b:free", openai_api_key = openrouterAPI, base_url = "https://openrouter.ai/api/v1"))
dbsql_chain = SQLDatabaseChain.from_llm(llm_gemma, db_sql, verbose=True, return_intermediate_steps=False)

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
# embeddings_sql = GoogleGenerativeAIEmbeddings(
#     model="gemini-embedding-001", # Or "gemini-embedding-2-preview"
#     google_api_key=googleAPI
# )
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
llm_openrouter = ChatOpenRouter(model="stepfun/step-3.5-flash:free")
    # ChatOpenAI(model = "openai/gpt-oss-20b:free", openai_api_key = openrouterAPI, base_url = "https://openrouter.ai/api/v1"))
qa_chain = RetrievalQA.from_chain_type(
    llm=llm_openrouter,
    retriever=retriever_sql,
    return_source_documents=True
)

chain_sql = (
    {"context": retriever_sql, "question": RunnablePassthrough()}
    | prompt
    | llm_openrouter
    | StrOutputParser()
)

# -------------- Migration version (Version1) langchain for chatbot ---------------
# 1. Create the chain that ONLY generates the SQL query
generate_query_chain = create_sql_query_chain(llm_gemma, db_sql)

# 2. Create the tool that executes the SQL query against your DB
execute_query_tool = QuerySQLDataBaseTool(db=db_sql)


# 3. Create a helper function to strip the markdown blocks
def clean_sql(query: str) -> str:
    """Strips markdown formatting and extra conversational text from the generated SQL query."""
    print(f"--- RAW LLM OUTPUT ---\n{query}\n----------------------")

    # Use regex to extract everything specifically inside a ```sql ... ``` block
    match = re.search(r"```sql(.*?)```", query, re.DOTALL | re.IGNORECASE)
    if match:
        query = match.group(1)
    else:
        # Fallback: Strip standard markdown backticks if regex didn't match perfectly
        query = query.replace("```sql", "").replace("```", "")

    # Remove common prefixes the LLM might add (e.g., "SQLQuery: ")
    query = re.sub(r"(?i)^SQLQuery:\s*", "", query)

    cleaned_query = query.strip()
    print(f"--- CLEANED SQL TO EXECUTE ---\n{cleaned_query}\n------------------------------")
    return cleaned_query


# 4. Create the prompt to format the final answer
answer_prompt = PromptTemplate.from_template(
    "Given the following user question, corresponding SQL query, and SQL result, answer the user question in a conversational, human-friendly way.\n\n"
    "Question: {question}\n"
    "SQL Query: {query}\n"
    "SQL Result: {result}\n"
    "Answer: "
)

# 5. Link them together into a new execution chain using LCEL
# Flow: Question -> Generate & Clean Query -> Execute DB -> Format Answer -> LLM String
query_chain = generate_query_chain | RunnableLambda(clean_sql)

sql_execution_chain = (
        RunnablePassthrough.assign(query=query_chain)
        .assign(result=lambda inputs: execute_query_tool.invoke(inputs["query"]))
        | answer_prompt
        | llm_gemma  # Passes the prompt back to Gemini to format it nicely
        | StrOutputParser()  # Extracts just the text from the LLM's response
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

#------------------open ai token usage --------------------------

def openai_token_usage():
    response = openai.ChatCompletion.create(
        model="gpt-5-nano",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Tell me a joke."}
        ]
    )

    print(response['usage'])


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

    # print(f"Received question: {question}")
    #
    # print("Calling chain...")
    # response = dbsql_chain.invoke(question)
    # formatted = f"\nResult:\n{response['result']}"
    # print(f"Response: {formatted}")
    # return jsonify({"answer": formatted})

    if not question:
        return jsonify({"error": "No question provided"}), 400

    print(f"Received question: {question}")
    print("Calling modern SQL execution chain...")

    try:
        # Pass the question to our new chain
        # The chain handles generating SQL, running it, and generating the final sentence!
        human_friendly_answer = sql_execution_chain.invoke({"question": question})

        print(f"Response: {human_friendly_answer}")
        return jsonify({"answer": human_friendly_answer})

    except Exception as e:
        print(f"Database Query Error: {e}")
        return jsonify({"answer": "Sorry, I encountered an error running the database query."}), 500
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
    result = llm_googleai.invoke(prompt)

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
        # llm_response = llm_openai.invoke(prompt)
        llm_response = llm_googleai.invoke(prompt)
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

    try:
        os.makedirs(os.path.dirname(file_path), exist_ok=True)


        plt.figure(figsize=(10, 6))
        plt.plot(df['timestamp'], df[column_name], marker='o', linestyle='-', color='b', linewidth=2, markersize=4)
        plt.title(f'{column_name.capitalize()} Over Time', fontsize = 16, fontweight = 'bold')
        plt.xlabel('Timestamp', fontsize = 12)
        plt.ylabel(column_name.capitalize(), fontsize = 12)
        plt.xticks(rotation=45)
        plt.grid(True, alpha=0.3)
        plt.tight_layout()  # This prevents labels from being cut off

        plt.savefig(file_path, dpi=300, bbox_inches='tight')
        plt.close()  # Important: close the figure to free memory

        print(f"Graph saved successfully: {file_path}")
        return True

    except Exception as e:
        print(f"Error creating graph for {column_name}: {str(e)}")
        plt.close()  # Make sure to close even if there's an error
        return False

@traceable(run_type="chain")
def generate_llm_summary(df):
    summary_prompt_V2 = f"""
    
    Analyze the following sensor data and provide a summary of the plant's health and environment.
    The data covers the period from {df['timestamp'].min()} to {df['timestamp'].max()}.
    In the first line, include the date range of the data.
    
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
    summary_response = llm_gemma.invoke(summary_prompt_V2)
    with get_openai_callback() as callback:
        print(f"Total Tokens: {callback.total_tokens}")
        print(f"Prompt Tokens: {callback.prompt_tokens}")
        print(f"Completion Tokens: {callback.completion_tokens}")
        print(f"Total Cost: ${callback.total_cost}")
    return summary_response.content


def create_pdf_report(summary, graph_paths):
    try:
        bio = BytesIO()
        doc = SimpleDocTemplate(bio, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []

        story.append(Paragraph("Farm Environmental Report", styles['Title']))
        story.append(Spacer(1, 12))
        story.append(Paragraph("Executive Summary", styles['Heading2']))
        summary_with_breaks = summary.replace('\n', '<br/>')
        story.append(Paragraph(summary_with_breaks, styles['BodyText']))
        story.append(Spacer(1, 24))
        story.append(Paragraph("Sensor Data Visualizations", styles['Heading2']))
        story.append(Spacer(1, 12))

        graphs_added = 0
        for i, graph_path in enumerate(graph_paths):
            # Resolve to absolute path just in case
            abs_path = os.path.abspath(graph_path)
            print(f"Trying to load graph from: {abs_path}")  # <-- key debug line

            if not os.path.exists(abs_path):
                print(f"WARNING: File does not exist: {abs_path}")
                continue

            if os.path.getsize(abs_path) == 0:
                print(f"WARNING: File is empty: {abs_path}")
                continue

            sensor_name = os.path.basename(abs_path).split('_')[0]
            story.append(Paragraph(f"{sensor_name.capitalize()} Data", styles['Heading3']))
            story.append(Spacer(1, 6))

            img = RLImage(abs_path, width=400, height=300)  # <-- use abs_path
            story.append(img)
            story.append(Spacer(1, 12))
            graphs_added += 1

            if graphs_added % 2 == 0 and i < len(graph_paths) - 1:
                story.append(PageBreak())

        print(f"Total graphs added to PDF: {graphs_added}/{len(graph_paths)}")
        if graphs_added == 0:
            story.append(Paragraph("No sensor graphs could be generated.", styles['BodyText']))

        doc.build(story)
        bio.seek(0)
        return bio

    except Exception as e:
        print(f"Error creating PDF report: {str(e)}")
        raise
    # try:
    #     bio = BytesIO()
    #     doc = SimpleDocTemplate(bio, pagesize=A4)
    #     style = getSampleStyleSheet()
    #     story = []
    #
    #     # Add title
    #     story.append(Paragraph("Farm Environmental Report", style['Title']))
    #     story.append(Spacer(1, 12))
    #
    #  # Add summary
    #     story.append(Paragraph("Executive Summary", style['Heading2']))
    #     summary_with_breaks = summary.replace('\n', '<br/>')
    #     story.append(Paragraph(summary_with_breaks, style['BodyText']))
    #     story.append(Spacer(1, 24))
    #
    # # Add graphs section
    #     story.append(Paragraph("Sensor Data Visualizations", style['Heading2']))
    #     story.append(Spacer(1, 12))
    #
    # # # Replace newlines with HTML line breaks for proper rendering in the PDF
    # # summary_with_breaks = summary.replace('\n', '<br/>')
    # # story.append(Paragraph(summary_with_breaks, style['BodyText']))
    # # story.append(Spacer(1, 24))
    #
    #
    # # Process each graph
    #     graphs_added = 0
    #     for i, graph_path in enumerate(graph_paths):
    #         try:
    #             print(f"Processing graph {i + 1}/{len(graph_paths)}: {graph_path}")
    #
    #             # Check if file exists
    #             if not os.path.exists(graph_path):
    #                 print(f"Warning: Graph file not found: {graph_path}")
    #                 continue
    #
    #             # Check file size
    #             file_size = os.path.getsize(graph_path)
    #             if file_size == 0:
    #                 print(f"Warning: Graph file is empty: {graph_path}")
    #                 continue
    #
    #             # Extract sensor name from file path
    #             sensor_name = os.path.basename(graph_path).split('_')[0]
    #
    #             # Add sensor name as subtitle
    #             story.append(Paragraph(f"{sensor_name.capitalize()} Data", style['Heading3']))
    #             story.append(Spacer(1, 6))
    #
    #             # Add the image
    #             img = Image(graph_path, width=400, height=300)
    #             story.append(img)
    #             story.append(Spacer(1, 12))
    #
    #             graphs_added += 1
    #             print(f"Successfully added graph for {sensor_name}")
    #
    #             # Add page break after every 2 graphs (except the last one)
    #             if graphs_added % 2 == 0 and i < len(graph_paths) - 1:
    #                 story.append(PageBreak())
    #
    #         except Exception as e:
    #             print(f"Error processing graph {graph_path}: {str(e)}")
    #             continue
    #
    #     print(f"Total graphs added to PDF: {graphs_added}/{len(graph_paths)}")
    #
    #     if graphs_added == 0:
    #         story.append(Paragraph("No sensor graphs could be generated.", style['BodyText']))
    #
    #     # Build the PDF
    #     doc.build(story)
    #     bio.seek(0)
    #
    #     print("PDF report created successfully")
    #     return bio
    #
    # except Exception as e:
    #     print(f"Error creating PDF report: {str(e)}")
    #     # Return a basic PDF with just the summary if graph processing fails
    #     bio = BytesIO()
    #     doc = SimpleDocTemplate(bio, pagesize=A4)
    #     story = [
    #         Paragraph("Farm Environmental Report", style['Title']),
    #         Spacer(1, 12),
    #         Paragraph(summary, style['BodyText']),
    #         Spacer(1, 12),
    #         Paragraph("Note: Graphs could not be generated due to technical issues.", style['BodyText'])
    #     ]
    #     doc.build(story)
    #     bio.seek(0)
    #     return bio


    # for graph_path in graph_paths:
    #     # Extract the metric name from the file path to use as a subtitle
    #     metric_name = os.path.basename(graph_path).split('_')[0].capitalize()
    #
    #     # Add a subtitle for each graph
    #     story.append(Paragraph(f"{metric_name} Over Time", style['h2']))
    #     story.append(Spacer(1, 6))
    #
    #     img = Image(graph_path, width=400, height=300)
    #     story.append(img)
    #     story.append(Spacer(1, 24))
    #
    # doc.build(story)
    # bio.seek(0)
    # return bio


@app.route('/api/report', methods=['GET'])
def generate_report():
    period = request.args.get('period', 'daily')  # Default to daily report
    report_format = request.args.get('format', 'pdf')  # Default to PDF format



    end_date = datetime.datetime.now(nz)

    if period == 'daily':
        start_date = end_date - datetime.timedelta(days=1)
    elif period == 'weekly':
        start_date = end_date - datetime.timedelta(days=7)
    elif period == 'monthly':
        start_date = end_date - datetime.timedelta(days=30)
    else:
        return jsonify({"error": "Invalid period specified. Use 'daily', 'weekly', or 'monthly'."}), 400

    # Fetch data from the database
    query = db.session.query(Environments).filter(Environments.timestamp.between(start_date, end_date))
    df = pd.read_sql(query.statement, db.engine)

    if df.empty:
        return jsonify({"error": "No data available for the specified period."}), 404

    # Generate graphs
    graph_paths = []
    for col in ['temperature', 'humidity', 'light', 'soilHumidity', 'waterLevel', 'steam']:
        # graph_path = f"static/graphs/{col}_{start_date.strftime('%Y%m%d')}_to_{end_date.strftime('%Y%m%d')}.png"
        graph_path = os.path.join(app.root_path, "static", "graphs",
                                  f"{col}_{start_date.strftime('%Y%m%d')}_to_{end_date.strftime('%Y%m%d')}.png")
        create_graph(df, col, graph_path)
        graph_paths.append(graph_path)

    # Generate LLM summary
    summary = generate_llm_summary(df)

    # Create report
    if report_format == 'pdf':
        report_bio = create_pdf_report(summary, graph_paths)
        mimetype = 'application/pdf'
        filename = f"report_{start_date.strftime('%Y%m%d')}_to_{end_date.strftime('%Y%m%d')}.pdf"
        print(f"Generated filename: {filename}")  # Debugging line

    else:
        return jsonify({"error": "Invalid format specified. Use 'pdf'."}), 400

    # clean up temporary graph files
    # for path in graph_paths:
    #     os.remove(path)

    return send_file(report_bio, mimetype=mimetype, as_attachment=True, download_name=filename)



@app.route('/api/report_bydate', methods=['GET'])
def generate_report_bydate():
    try:
        period = request.args.get('period', 'weekly')  # Default to weekly report
        report_format = request.args.get('format', 'pdf')  # Default to PDF format

        # Get custom start and end dates from parameters
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        use_custom_date = request.args.get('use_custom_date', 'false').lower() == 'true'

        if use_custom_date and start_date_str and end_date_str:
            # Use custom dates if provided
            try:
                start_date = datetime.datetime.strptime(start_date_str, '%Y-%m-%d')
                end_date = datetime.datetime.strptime(end_date_str, '%Y-%m-%d')

                # Convert to your timezone
                start_date = start_date.replace(tzinfo=nz)
                # Set end_date to end of day to include all data from that day
                end_date = end_date.replace(hour=23, minute=59, second=59, tzinfo=nz)

                print(f"Using custom dates: {start_date} to {end_date}")  # Debug log

            except ValueError as e:
                print(f"Date parsing error: {str(e)}")
                return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400
        else:
            # Original logic - calculate from current date backwards
            end_date = datetime.datetime.now(nz)

            if period == 'weekly':
                start_date = end_date - datetime.timedelta(days=7)
            elif period == 'monthly':
                start_date = end_date - datetime.timedelta(days=30)
            else:
                return jsonify({"error": "Invalid period specified. Use 'weekly' or 'monthly'."}), 400

            print(f"Using default dates: {start_date} to {end_date}")  # Debug log

        # Validate date range
        if start_date >= end_date:
            return jsonify({"error": "Start date must be before end date."}), 400

        # Fetch data from the database
        try:
            query = db.session.query(Environments).filter(Environments.timestamp.between(start_date, end_date))
            df = pd.read_sql(query.statement, db.engine)
            print(f"Query returned {len(df)} rows")  # Debug log
        except Exception as e:
            print(f"Database query error: {str(e)}")
            return jsonify({"error": "Database query failed."}), 500

        if df.empty:
            return jsonify({"error": "No data available for the specified period."}), 404

        # Generate graphs with proper date range in filename
        graph_paths = []
        sensor_columns = ['temperature', 'humidity', 'light', 'soilHumidity', 'waterLevel', 'steam']

        print(f"Available columns in dataframe: {list(df.columns)}")  # Debug log

        for col in sensor_columns:
            # graph_path = f"static/graphs/{col}_{start_date.strftime('%Y%m%d')}_to_{end_date.strftime('%Y%m%d')}.png"
            graph_path = os.path.join(app.root_path, "static", "graphs",
                                      f"{col}_{start_date.strftime('%Y%m%d')}_to_{end_date.strftime('%Y%m%d')}.png")
            print(f"Generating graph for {col} at path: {graph_path}")  # Debug log

            # Check if column exists in dataframe
            if col in df.columns:
                # Check if column has data
                if not df[col].isna().all():
                    success = create_graph(df, col, graph_path)
                    if success and os.path.exists(graph_path):
                        graph_paths.append(graph_path)
                        print(f"Successfully generated and added graph for {col}")
                    else:
                        print(f"Failed to generate graph for {col}")
                else:
                    print(f"Warning: Column '{col}' has no data (all NaN values)")
            else:
                print(f"Warning: Column '{col}' not found in dataframe. Available columns: {list(df.columns)}")

        print(f"Total graphs generated: {len(graph_paths)}")
        print(f"Graph paths: {graph_paths}")

        if len(graph_paths) == 0:
            print("Warning: No graphs were generated!")

        # Generate LLM summary
        try:
            summary = generate_llm_summary(df)
        except Exception as e:
            print(f"Error generating LLM summary: {str(e)}")
            summary = "Summary could not be generated due to technical issues."

        # Create report
        if report_format == 'pdf':
            try:
                report_bio = create_pdf_report(summary, graph_paths)
                mimetype = 'application/pdf'
                # Use actual date range for filename
                filename = f"{start_date.strftime('%Y-%m-%d')}_to_{end_date.strftime('%Y-%m-%d')}_report.pdf"

                print(f"PDF report created successfully with filename: {filename}")

                # Clean up temporary graph files (uncomment if needed)
                # for path in graph_paths:
                #     if os.path.exists(path):
                #         os.remove(path)

                return send_file(report_bio, mimetype=mimetype, as_attachment=True, download_name=filename)

            except Exception as e:
                print(f"Error creating PDF report: {str(e)}")
                return jsonify({"error": f"Failed to create PDF report: {str(e)}"}), 500
        else:
            return jsonify({"error": "Invalid format specified. Use 'pdf'."}), 400

    except Exception as e:
        print(f"Unexpected error in generate_report: {str(e)}")
        import traceback
        traceback.print_exc()  # This will print the full stack trace
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500


@app.route('/api/report_status', methods = ['GET'])
def report_status():
    def generate():
        """Generate a report with real-time updates"""
        yield "data: Start report generation...\n\n"
        time.sleep(3)
        yield "data : Generate graphs....\n\n"
        time.sleep(4)
        yield "data: Graphs generated successfully!\n\n"
        time.sleep(3)
        yield "data: Analyzing Data.....\n\n"
        time.sleep(4)
        yield "data: Compiling report...\n\n"
        time.sleep(4)
        yield "data: Almost done...\n\n"
        try:
            # Simulate report generation
            time.sleep(4)  # Simulate some processing time
            yield "data: Report generated successfully!\n\n"
        except Exception as e:
            yield f"data: Error generating report: {str(e)}\n\n"

    return Response(generate(), mimetype='text/event-stream')


# ---------------------------- Report generation done --------------------



# ---------------------------- Chatbox for recognize image version 2--------------------\

# Configuration
#
# class Config_chatbox:
#     chat_api = inferenceAPI
#     UPLOAD_FOLDER = 'static/uploaded'
#     ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}
#     MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB limit for uploaded files
#
    # AVAILABLE_MODEL = {
    #
    #     "gemini-2.5-flash" : {
    #         "loader" : lambda: ChatGoogleGenerativeAI(model = "gemini-2.5-flash", temperature = 0.1, max_output_tokens = 1024),
    #         "package" : "langchain_google_genai"
    #     },
    #
    #     "gemma-3-27b-it" : {
    #         "loader" : lambda: ChatGoogleGenerativeAI(model = "google/gemma-3-27b-it", temperature = 0.1, max_output_tokens = 1024), #HuggingFaceEndpoint(repo_id = "google/gemma-3-27b-it", temperature = 0.1, max_new_tokens = 512),
    #         "package" : "langchain_huggingface"
    #     },
    #
    #     "openai": {
    #         "loader" : lambda: ChatOpenAI(model_name="gpt-4o-mini", temperature=0.1, max_tokens=512),
    #         "package" : "langchain_openai"
    #     }
    # }
    #
    #     'gemini-2.5-flash': {
    #         'type': 'text',
    #         'endpoint': 'google/gemma-2-2b-it',
    #         'api_url': None
    #     },
    #     'llama': {
    #         'type': 'text',
    #         'endpoint': 'meta-llama/Llama-2-7b-chat-hf',
    #         'api_url': None
    #     },
    #     'openai': {
    #         'type': 'text',
    #         'endpoint': 'microsoft/DialoGPT-medium',
    #         'api_url': None
    #     },
    #     'gemma-2-27b-it': {
    #         'type': 'text',
    #         'endpoint': 'google/gemma-2-27b-it',
    #         'api_url': None
    #     },
    #     'qwen': {
    #         'type': 'text',
    #         'endpoint': 'Qwen/Qwen2-7B-Instruct',
    #         'api_url': None
    #     },
    #     # Multimodal models
    #     'blip-image-captioning': {
    #         'type': 'multimodal',
    #         'endpoint': 'Salesforce/blip-image-captioning-large',
    #         'api_url': 'https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large'
    #     },
    #     'llava': {
    #         'type': 'multimodal',
    #         'endpoint': 'llava-hf/llava-1.5-7b-hf',
    #         'api_url': 'https://api-inference.huggingface.co/models/llava-hf/llava-1.5-7b-hf'
    #     }
    # }
#
#         # # Multimodal Models (Vision)
#         #     "blip-vqa": {
#         #         "repo_id": "Salesforce/blip-vqa-base",
#         #         "type": "multimodal"
#         #     },
#         #     "blip-captioning": {
#         #         "repo_id": "Salesforce/blip-image-captioning-large",
#         #         "type": "multimodal"
#         #     },
#         #     # Text-Only Models
#         #     "mistral-7b": {
#         #         "repo_id": "mistralai/Mistral-7B-Instruct-v0.2",
#         #         "type": "text"
#         #     },
#         #     "zephyr-7b": {
#         #         "repo_id": "HuggingFaceH4/zephyr-7b-beta",
#         #         "type": "text"
#         #     },
#
#     }
#
# app.config.from_object(Config_chatbox)
#
# # Ensure upload directory exists
# os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
#
# @dataclass
# class Message:
#     role : str
#     content: str
#     timestamp : datetime
#     image_path : Optional[str] = None
#
#
# class ConversationManager:
#     def __init__(self):
#         self.conversations: Dict[str, List[Message]] = {}
#         self.memories: Dict[str, ConversationBufferMemory] = {}
#
#     def get_conversation(self, conversation_id: str) -> List[Message]:
#         if conversation_id not in self.conversations:
#             self.conversations[conversation_id] = []
#             self.memories[conversation_id] = ConversationBufferMemory(
#                 return_messages=True,
#                 memory_key="chat_history"
#             )
#         return self.conversations[conversation_id]
#
#     def add_message(self, conversation_id: str, role: str, content: str, image_path: Optional[str] = None):
#         conversation = self.get_conversation(conversation_id)
#         message = Message(
#             role=role,
#             content=content,
#             timestamp=datetime.now(),
#             image_path=image_path
#         )
#         conversation.append(message)
#
#         # Update Langchain memory
#         memory = self.memories[conversation_id]
#         if role == 'user':
#             memory.chat_memory.add_user_message(content)
#         else:
#             memory.chat_memory.add_ai_message(content)
#
#     def clear_conversation(self, conversation_id: str):
#         if conversation_id in self.conversations:
#             del self.conversations[conversation_id]
#         if conversation_id in self.memories:
#             del self.memories[conversation_id]
#
#
# class ModelManager:
#     def __init__(self, model_name: str):
#         self.model_name = {}
#         self.header = {
#             "Authorization": f"Bearer {huggingfaceAPI}",
#         }


# ------------------------ chatbox test-----------------------------

# Initialize LLM
llm_test = ChatGoogleGenerativeAI(model="gemini-2.5-flash",
                                  temperature = 0.1,
                                  max_tokens = None)

# llm_test2 = HuggingFaceEndpoint(
#     repo_id = "SillyTilly/mistralai_Mistral-Nemo-Instruct-2407",
#     provider = "featherless-ai",
#     max_new_token = 100,
#     hugginfacehub_api_token = huggingfaceAPI,
#     temperature = 0.2,
# )



template1 =   """You are agent that answer based on user question. If you can't understand or not sure just say "I don't know".

#Question:
{question}
#Context:
{context}

#Answer:"""

# template_test = """ You are a helpful assistant that answer based on user question. If you can't understand or not sure just say "I don't know".
#
#  Question : {question}
#  Answer : Let's think step by step.
#
# """


# Simple Prompt
# prompt_teest = PromptTemplate.from_template(template_test)


# chain_test = prompt_test | llm_test()
TOKEN = "add_yout_token"
TOKEN2 = "add_yout_token2"
TOKEN3 = "add_yout_token3"

MODEL = "google/gemma-2-2b-it"

res = requests.post(
    f"https://api-inference.huggingface.co/models/{MODEL}",
    headers={"Authorization": f"Bearer {TOKEN3}"},
    json={"inputs": "Hello!"}
)
print(res.status_code, res.text)

# client = InferenceClient(model="mistralai/Mistral-7B-Instruct-v0.3")  # Example free model
# output = client.text_generation("Hello!", max_new_tokens=20)
# print(output)

# client = InferenceClient()
# models = client.list_deployed_models(frameworks="all")
# for task, model_list in models.items():
#     print(f"\n{task}:")
#     for m in model_list[:10]:
#         print(f"  {m}")

# client = InferenceClient(model=MODEL, token=TOKEN3, timeout = 300)
#
# try:
#     output = client.text_generation("Hello!", max_new_tokens=10)
#     print(output)
# except Exception as e:
#     print(f"Error: {e}")

@app.route("/api/chat_test", methods=["POST"])
def chat_test():
    data = request.get_json()
    user_input = data.get("message", "")

    if not user_input:
        return jsonify({"error": "No message provided"}), 400


    llm_test2 = HuggingFaceEndpoint(
        repo_id="google/gemma-2-2b-it",
        provider="auto",
        max_new_tokens=100,
        huggingfacehub_api_token=huggingfaceREAD,
        temperature=0.2,
    )

    template_test = """ You are a helpful assistant that answer based on user question. If you can't understand or not sure just say "I don't know".

     Question : {question}
     Answer : Let's think step by step.

    """

    prompt_teest = PromptTemplate.from_template(template_test)
    llm_chain_test = prompt_teest | llm_test2

    # response_test = llm_test.invoke(prompt_test.format(question = user_input, context = "You are a helpful assistant."))
    ans = llm_chain_test.invoke({"question": user_input})
    return jsonify(ans)
# --------------------------- chat with image version 2 end--------------


# Image upload for chatbot Configuration
# UPLOAD_FOLDER = 'static/uploaded'
# ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}
# MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB limit for uploaded files
#
# app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
# app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH
conversations = {}
# In-memory store for conversation history
# For a production environment, you would use a database.
conversation_history = {}

# --- Create a simple class to hold and run your local model ---
# class LocalHuggingFaceModel:
#     def __init__(self, model_path):
#         print(f"Loading model from {model_path}...")
#         # Ensure you have a GPU, otherwise this will be very slow
#
#         self.model = AutoModelForImageTextToText.from_pretrained(
#             model_path,
#             torch_dtype= torch.bfloat16, # Use bfloat16 for better performance on modern GPUs
#             device_map="auto" # Automatically use the GPU
#         )
#         self.tokenizer = AutoTokenizer.from_pretrained(model_path)
#         print("Model loaded successfully!")
#
#     def invoke(self, messages):
#         # This is a simplified invoke. LangChain's 'invoke' expects a specific input format.
#         # We'll handle the conversion from LangChain's message format.
#         # The last message is usually the user's prompt.
#         prompt = messages[-1][1] # Extracts the text from ("human", "text")
#
#         # Create the prompt for the model
#         inputs = self.tokenizer(prompt, return_tensors="pt").to("cuda")
#
#         # Generate a response
#         outputs = self.model.generate(**inputs, max_new_tokens=500)
#         response_text = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
#
#         # Mimic LangChain's response structure
#         from langchain_core.messages import AIMessage
#         return AIMessage(content=response_text)
#
# class LocalVLM(BaseChatModel):
#     """Custom wrapper to integrate a Hugging Face VLM into LangChain chat interface."""
#
#     model_path: str
#     processor: Any = None
#     model: Any = None
#
#     def __init__(self, model_path: str, **kwargs):
#         super().__init__(model_path=model_path, **kwargs)
#         object.__setattr__(self, "processor", AutoProcessor.from_pretrained(model_path))
#         object.__setattr__(self, "model", AutoModelForVision2Seq.from_pretrained(model_path))
#
#     def _generate(self, messages, stop=None, run_manager=None, **kwargs):
#         # ... (same as before) ...
#         pass
#
#     @property
#     def _llm_type(self) -> str:
#         return "local_vlm"
#
#
# def create_local_vlm_pipeline(model_path):
#     """Create a local VLM pipeline that's compatible with LangChain"""
#
#     try:
#         # Load your fine-tuned model and processor
#         model = AutoModelForImageTextToText.from_pretrained(
#             model_path,
#             torch_dtype=torch.float16,
#             device_map="GPU",
#             trust_remote_code=True  # Add if your model needs it
#         )
#
#         processor = AutoProcessor.from_pretrained(
#             model_path,
#             trust_remote_code=True
#         )
#
#         # Create a vision-language pipeline
#         vlm_pipeline = pipeline(
#             "image-to-text",  # or "visual-question-answering" depending on your model
#             model=model,
#             tokenizer=processor.tokenizer,
#             image_processor=processor.image_processor,
#             device_map="auto",
#             torch_dtype=torch.float16
#         )
#
#         # Wrap in a custom class that mimics LangChain's interface
#         return LocalVLMWrapper(vlm_pipeline, processor)
#
#     except Exception as e:
#         print(f"Error loading local VLM model: {e}")
#         raise
#
#
# class MockResponse:
#     """Mock response class to mimic LangChain response format"""
#
#     def __init__(self, content):
#         self.content = content
#
#
# class LocalVLMWrapper:
#     """Wrapper class to make local VLM compatible with your existing code structure"""
#
#     def __init__(self, pipeline, processor):
#         self.pipeline = pipeline
#         self.processor = processor
#
#     def invoke(self, messages):
#         """Process messages in the same format as other models"""
#         try:
#             # Extract the message content
#             if isinstance(messages, list) and len(messages) > 0:
#                 message = messages[0]  # Get the HumanMessage
#
#                 text_content = ""
#                 image_data = None
#
#                 # Parse the content
#                 if hasattr(message, 'content') and isinstance(message.content, list):
#                     for item in message.content:
#                         if item["type"] == "text":
#                             text_content = item["text"]
#                         elif item["type"] == "image_url":
#                             # Extract base64 image data
#                             image_url = item["image_url"]
#                             if image_url.startswith("data:image/jpeg;base64,"):
#                                 base64_data = image_url.split(",")[1]
#                                 image_data = base64.b64decode(base64_data)
#
#                 # Convert image data back to PIL Image
#                 if image_data:
#                     from PIL import Image
#                     import io
#                     image = Image.open(io.BytesIO(image_data))
#
#                     # Generate response using your local model
#                     if text_content:
#                         # If there's a text prompt, use it
#                         prompt = text_content
#                     else:
#                         # Default prompt for image description
#                         prompt = "Describe this image in detail."
#
#                     # Generate response
#                     result = self.pipeline(image, prompt=prompt, max_new_tokens=512)
#
#                     # Return response in the expected format
#                     return MockResponse(
#                         result[0]['generated_text'] if isinstance(result, list) else result['generated_text'])
#
#                 else:
#                     return MockResponse("No image provided.")
#
#             else:
#                 return MockResponse("Invalid message format.")
#
#         except Exception as e:
#             print(f"Error in LocalVLMWrapper.invoke: {e}")
#             import traceback
#             traceback.print_exc()
#             return MockResponse(f"Error processing request: {str(e)}")
#
#
# # Alternative approach with accelerate (install: pip install accelerate)
# def create_local_vlm_pipeline_optimized(model_path):
#     """Create optimized local VLM pipeline with accelerate"""
#
#     try:
#         # Load your fine-tuned model and processor with device_map
#         model = AutoModelForImageTextToText.from_pretrained(
#             model_path,
#             dtype=torch.float16,
#             device_map="auto",  # This works with accelerate installed
#             trust_remote_code=True
#         )
#
#         processor = AutoProcessor.from_pretrained(
#             model_path,
#             trust_remote_code=True
#         )
#
#         # Create a vision-language pipeline
#         vlm_pipeline = pipeline(
#             "image-to-text",
#             model=model,
#             tokenizer=processor.tokenizer,
#             image_processor=processor.image_processor,
#             device_map="auto",
#             dtype=torch.float16
#         )
#
#         return LocalVLMWrapper(vlm_pipeline, processor)
#
#     except Exception as e:
#         print(f"Error loading optimized local VLM model: {e}")
#         raise
#     """Alternative approach using HuggingFace pipeline wrapper"""
#
#     # Create the pipeline
#     vlm_pipeline = pipeline(
#         "image-to-text",
#         model=model_path,
#         torch_dtype=torch.float16,
#         device_map="auto"
#     )
#
#     # Use HuggingFacePipeline wrapper
#     return HuggingFacePipeline(
#         pipeline=vlm_pipeline,
#         model_kwargs={"temperature": 0.1, "max_new_tokens": 512}
#     )

# --- NEW: Wrapper Class for your Local Fine-Tuned Model ---

# class LocalFineTunedMultimodal:
#     def __init__(self, model_path: str):
#         """
#         Loads the model and processor from a local path and prepares it for inference.
#         This is done only ONCE when the application starts.
#         """
#         print(f"Loading local model from: {model_path}...")
#         self.device = "cuda" if torch.cuda.is_available() else "cpu"
#         # --- FIXED: Use dtype instead of torch_dtype ---
#         self.dtype = torch.float16 if self.device == "cuda" else torch.float32
#
#         # --- FIXED: Added use_fast=True to silence the warning ---
#         self.processor = AutoProcessor.from_pretrained(model_path, use_fast=True)
#
#         # --- FINAL FIX: Use the correct AutoModel class for Vision-to-Sequence models ---
#         self.model = AutoModelForVision2Seq.from_pretrained(
#             model_path,
#             # --- FIXED: Use the correct dtype argument ---
#             dtype=self.dtype,
#             low_cpu_mem_usage=True  # Optimization for loading
#         ).to(self.device)
#         self.model.eval()  # Set the model to evaluation mode
#         print("Local model loaded successfully.")
#
#     def invoke(self, messages: list):
#         """
#         This method mimics the behavior of LangChain's .invoke() method.
#         It takes a list of messages, processes them, and returns a response.
#         """
#         # Extract the prompt and image from the HumanMessage
#         user_message = messages[-1]
#
#         prompt_text = ""
#         base64_image_str = ""
#
#         for part in user_message.content:
#             if part["type"] == "text":
#                 prompt_text = part["text"]
#             elif part["type"] == "image_url":
#                 base64_image_str = part["image_url"].split(",")[1]
#
#         if not base64_image_str:
#             raise ValueError("Image data not found in the message.")
#
#         image_bytes = base64.b64decode(base64_image_str)
#         image = Image.open(io.BytesIO(image_bytes))
#
#         # Get the correct image token string from the processor
#         # For Gemma, the image token is part of the chat template applied by the processor.
#         # We no longer need to manually insert it if we format the input correctly.
#
#         # The Gemma processor expects a chat-like structure.
#         # We will create this structure and let the processor handle the template.
#         chat_messages = [
#             {"role": "user", "content": [{"type": "image"}, {"type": "text", "text": prompt_text}]}
#         ]
#
#         prompt = self.processor.apply_chat_template(chat_messages, tokenize=False, add_generation_prompt=True)
#
#         # --- UPDATED DEBUGGING STEP ---
#         print("-----------------------------------------")
#         print("DEBUG: Final prompt string being passed to processor:")
#         print(repr(prompt))
#         print("-----------------------------------------")
#
#         # The processor now correctly receives the text with the placeholder and the image.
#         inputs = self.processor(
#             text=prompt,
#             images=image,
#             return_tensors="pt"
#         ).to(self.device, self.dtype)
#
#         generate_ids = self.model.generate(**inputs, max_new_tokens=200)
#
#         # Decode only the newly generated tokens to avoid repeating the input prompt in the output
#         input_token_len = inputs["input_ids"].shape[1]
#         generated_tokens = generate_ids[:, input_token_len:]
#         response_text = self.processor.batch_decode(generated_tokens, skip_special_tokens=True)[0]
#
#         # Return the response in an object with a .content attribute to match LangChain's output
#         return SimpleNamespace(content=response_text.strip())


# class LocalFineTunedMultimodal:
#     def __init__(self, model_path: str):
#         """
#         Loads the model and processor from a local path and prepares it for inference.
#         This is done only ONCE when the application starts.
#         """
#         print(f"Loading local model from: {model_path}...")
#
#         # --- NEW: Explicitly check for CUDA and print the device being used ---
#         if torch.cuda.is_available():
#             self.device = "cuda"
#             print("✅ CUDA is available. Using GPU for acceleration.")
#         else:
#             self.device = "cpu"
#             print("⚠️ WARNING: CUDA not available. Model will run on CPU, which will be very slow.")
#
#         # --- FIXED: Use dtype instead of torch_dtype ---
#         self.dtype = torch.float16 if self.device == "cuda" else torch.float32
#
#         # --- FIXED: Added use_fast=True to silence the warning ---
#         self.processor = AutoProcessor.from_pretrained(model_path, use_fast=True)
#
#         # --- FINAL FIX: Use the correct AutoModel class for Vision-to-Sequence models ---
#         # --- PERFORMANCE UPGRADE: Use `device_map="auto"` to leverage both GPU and CPU ---
#         # This will automatically load model layers onto the GPU if available,
#         # and offload the rest to the CPU, significantly speeding up inference.
#         self.model = AutoModelForVision2Seq.from_pretrained(
#             model_path,
#             # --- FIXED: Use the correct dtype argument ---
#             dtype=self.dtype,
#             low_cpu_mem_usage=True,  # Optimization for loading
#             device_map="auto"  # <-- THE KEY CHANGE FOR PERFORMANCE
#         )
#         # NOTE: We no longer need `.to(self.device)` on the model, as device_map handles placement.
#
#         self.model.eval()  # Set the model to evaluation mode
#         print("✅ Local model loaded with automatic device mapping.")
#
#     def invoke(self, messages: list):
#         """
#         This method mimics the behavior of LangChain's .invoke() method.
#         It takes a list of messages, processes them, and returns a response.
#         """
#         # Extract the prompt and image from the HumanMessage
#         user_message = messages[-1]
#
#         prompt_text = ""
#         base64_image_str = ""
#
#         for part in user_message.content:
#             if part["type"] == "text":
#                 prompt_text = part["text"]
#             elif part["type"] == "image_url":
#                 base64_image_str = user_message.content[1]["image_url"].split(",")[1]
#
#         if not base64_image_str:
#             raise ValueError("Image data not found in the message.")
#
#         image_bytes = base64.b64decode(base64_image_str)
#         image = Image.open(io.BytesIO(image_bytes))
#
#         # --- FINAL FIX for Qwen2.5-VL Processor ---
#         # The new error "Keyword argument 'messages' is not a valid argument" tells
#         # us this processor expects the prompt as a `text` string, not a `messages` list.
#         # The correct way to handle this is to first use the processor's chat templater
#         # to build the final, correctly formatted prompt string.
#
#         chat_messages = [
#             # Note: We provide the content as a list of dictionaries as expected by the templater.
#             {"role": "user", "content": [{"type": "image"}, {"type": "text", "text": prompt_text}]}
#         ]
#
#         # Step 1: Use the processor to apply the model-specific chat template.
#         # This converts the structured chat into the final string with the correct image token.
#         prompt = self.processor.apply_chat_template(chat_messages, tokenize=False, add_generation_prompt=True)
#
#         # Step 2: Pass the generated `prompt` string as the `text` argument, along with the image.
#         # This is the calling convention the Qwen processor expects.
#         # We still need to move the input tensors to the primary device.
#         inputs = self.processor(
#             text=prompt,
#             images=image,
#             return_tensors="pt"
#         ).to(self.device, self.dtype)
#
#         generate_ids = self.model.generate(**inputs, max_new_tokens=200)
#
#         # Decode only the newly generated tokens to avoid repeating the input prompt in the output
#         input_token_len = inputs["input_ids"].shape[1]
#         generated_tokens = generate_ids[:, input_token_len:]
#         response_text = self.processor.batch_decode(generated_tokens, skip_special_tokens=True)[0]
#
#         # Return the response in an object with a .content attribute to match LangChain's output
#         return SimpleNamespace(content=response_text.strip())


# Model configuration - choose your model here

# ========================== RAG Multimodal(Image) Start ========================

## ========== Configuration for multimodal data ===========
# Assumes you have a folder structure like: ./dataset/Early_Blight/img1.jpg
# RAG_CONFIG = {
#     "dataset_path": "./dataset",
#     "db_path": "./chroma_db",
#     "k_neighbors": 4  # How many similar images to check
# }
#
# # --- 1. SETUP RAG ENGINE (OpenCLIP) ---
# # We use CLIP because it maps images to vectors based on visual content.
# print("Loading Visual Embedding Model (CLIP)... this may take a moment.")
# embedding_model = OpenCLIPEmbeddings(
#     model_name="ViT-B-32",
#     checkpoint="laion2b_s34b_b79k"
# )
#
# # Initialize Vector DB
# vector_db = Chroma(
#     collection_name="tomato_diseases",
#     embedding_function=embedding_model,
#     persist_directory=RAG_CONFIG["db_path"]
# )
#
#
# # --- HELPER: INDEXING FUNCTION ---
# # Run this once (or on startup) to read your labeled images
# def build_index_if_empty():
#     """Scans the dataset folder and indexes images if DB is empty."""
#     # Check if DB has data
#     # 1. Check if DB already exists
#     if vector_db._collection.count() > 0:
#         print(f"✅ RAG Index loaded with {vector_db._collection.count()} images.")
#         return
#
#     print("⚠️ Index empty. Building RAG index from dataset folders...")
#     image_paths = []
#     metadatas = []
#     ids = []
#
#     # 2. Collect all paths first (this is fast and doesn't open file)
#     # Walk through folders: dataset/Disease_Name/image.jpg
#     if not os.path.exists(RAG_CONFIG["dataset_path"]):
#         print("❌ Dataset folder not found! RAG will not work until you add data.")
#         return
#
#     for disease_name in os.listdir(RAG_CONFIG["dataset_path"]):
#         folder_path = os.path.join(RAG_CONFIG["dataset_path"], disease_name)
#         if not os.path.isdir(folder_path): continue
#
#         for img_file in os.listdir(folder_path):
#             if img_file.lower().endswith(('.jpg', '.jpeg', '.png')):
#                 full_path = os.path.join(folder_path, img_file)
#                 image_paths.append(full_path)
#                 metadatas.append({"disease": disease_name, "source": img_file})
#                 ids.append(full_path)
#
#     total_images = len(image_paths)
#     if total_images == 0:
#         print("⚠️ No images found to index.")
#         return
#
#     print(f"found {total_images} images. Starting batch indexing...")
#
#     # 3. BATCH PROCESSING (The Fix)
#
#     # Batch process embeddings (CLIP handles images directly via path)
#     # We process 50 images at a time to prevent "Too many open files" error
#
#     BATCH_SIZE = 50
#     for i in range(0, total_images, BATCH_SIZE):
#         # Slice the lists
#         batch_paths = image_paths[i: i + BATCH_SIZE]
#         batch_metas = metadatas[i: i + BATCH_SIZE]
#         batch_ids = ids[i: i + BATCH_SIZE]
#
#         try:
#             # Add this small chunk to the database
#             # This opens, reads, embeds, and closes these 50 files only.
#             vector_db.add_images(uris=batch_paths, metadatas=batch_metas, ids=batch_ids)
#             print(f"  Indexed batch {i} to {i + len(batch_paths)} / {total_images}")
#
#         except Exception as e:
#             print(f"❌ Error indexing batch {i}: {e}")
#             # Optional: continue to next batch even if one fails
#             continue
#
#     print("✅ Indexing complete!")
#
#
# # Run indexing check on startup
# build_index_if_empty()

# --- CONFIG ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "faiss_index")

# --- LOAD RESOURCES ---
print("🧠 Loading AI Model...")
embedding_model = OpenCLIPEmbeddings(model_name="ViT-B-32", checkpoint="laion2b_s34b_b79k")

print("📂 Loading Database...")
try:
    vector_db = FAISS.load_local(
        DB_PATH,
        embedding_model,
        allow_dangerous_deserialization=True
    )
    print("✅ RAG System Ready!")
except Exception as e:
    print(f"❌ Error loading DB: {e}")
    vector_db = None
## ================= Model Configration ================


# ======================== RAG multimodal(Image) STILL ======================
# Create a global instance so we don't reload the model on every request (slow!)
# WARNING: This consumes VRAM. Only load if you have the hardware.
# LOCAL_MODEL_PATH = r"D:\UOA2\2025_Master\finetuned_model\quantized_Qwen2.5-VL-7B-Instruct"
# local_vlm_instance = None
#
# def get_local_model():
#     global local_vlm_instance
#     if local_vlm_instance is None:
#         local_vlm_instance = LocalFineTunedMultimodal(LOCAL_MODEL_PATH)
#     return local_vlm_instance


## ================= Available model configuratin =================
AVAILABLE_MODEL = {

    "gemini-2.5-flash" : {
        "loader" : lambda: ChatGoogleGenerativeAI(model = "gemini-2.5-flash", temperature = 0.1,),
        "package" : "langchain_google_genai",
        "type" : "multimodal"
    },

    "gpt5": {
        "loader" : lambda: ChatOpenRouter(model="nvidia/nemotron-3-super-120b-a12b:free"),
        "package" : "langchain_openai",
        "type" : "text"
    },

    "openai-oss" : {
        "loader" : lambda : ChatOpenRouter(model="stepfun/step-3.5-flash:free"),
        "package" : "langchain_groq",
        "type" : "text"
    },

    "gemma3-RAG" : {
        "loader" : lambda : ChatGoogleGenerativeAI(model = "gemma-3-27b-it", temperature = 0.1, max_tokens=1024, max_retries=2),
            # lambda: ChatOpenAI(model = "mistralai/mistral-small-3.1-24b-instruct:free", api_key = getenv("OPENROUTER_API_KEY_2") , base_url = "https://openrouter.ai/api/v1"),
        "package" : "langchain_huggingface",
        "type" : "multimodal"
    },
    
    "gemini-2.5-flash-RAG" : {
        "loader" : lambda: ChatGoogleGenerativeAI(model = "gemini-2.5-flash", temperature = 0.3, max_tokens=1024, max_retries=2),
        "package" : "langchain_google_genai",
        "type" : "multimodal"
    },
    # "gemma-3-4b-local": {
    #     # The loader now creates an instance of our custom class
    #     "loader": lambda: create_local_vlm_pipeline(r"D:\UOA2\2025_Master\finetuned_model\quantized_Qwen2.5-VL-7B-Instruct"),
    #     "package": "local",
    #     "type": "multimodal"
    # },
    # "gemma-3-4b-local": {
    #     "loader" : lambda : LocalFineTunedMultimodal(model_path = r"D:\UOA2\2025_Master\finetuned_model\quantized_Qwen2.5-VL-7B-Instruct"),
    #     "package" : "local",
    #     "type": "multimodal"
    # },


    "qwen2.5-VL-RAG" : {
        "loader" : lambda : ChatOpenRouter(model="nvidia/llama-nemotron-embed-vl-1b-v2:free", temperature=0.5, max_tokens=1024, max_retries=2),
        "package" : "langchain_openai",
        "type" : "multimodal"
    },

    "gemma3" : {
        "loader" : lambda : ChatGoogleGenerativeAI(model = "gemma-3-27b-it", temperature = 0.1, max_tokens=1024, max_retries=2),
            # lambda: ChatOpenAI(model = "mistralai/mistral-small-3.1-24b-instruct:free", api_key = getenv("OPENROUTER_API_KEY_2") , base_url = "https://openrouter.ai/api/v1"),
        "package" : "langchain_huggingface",
        "type" : "multimodal"
    },

    "qwen2.5-VL" : {
        "loader" : lambda : ChatOpenAI(model = "qwen/qwen-2.5-vl-7b-instruct:free", api_key = getenv("OPENROUTER_API_KEY") , base_url = "https://openrouter.ai/api/v1"),
        "package" : "langchain_openai",
        "type" : "multimodal"
    },


    # "qwen2.5-VL-finetuned" :
    #     {
    #     "loader": get_local_model, # Calls the function that returns the loaded instance
    #     "package": "local",
    #     "type": "multimodal"
    #     },

}
#
#     'gemini-2.5-flash': {
#             'type': 'text',
#             'endpoint': 'google/gemma-2-2b-it',
#             'api_url': None
#         },
#         'llama': {
#             'type': 'text',
#             'endpoint': 'meta-llama/Llama-2-7b-chat-hf',
#             'api_url': None
#         },
#         'openai': {
#             'type': 'text',
#             'endpoint': 'microsoft/DialoGPT-medium',
#             'api_url': None
#         },
#         'gemma-2-27b-it': {
#             'type': 'text',
#             'endpoint': 'google/gemma-2-27b-it',
#             'api_url': None
#         },
#         'qwen': {
#             'type': 'text',
#             'endpoint': 'Qwen/Qwen2-7B-Instruct',
#             'api_url': None
#         },
#         # Multimodal models
#         'blip-image-captioning': {
#             'type': 'multimodal',
#             'endpoint': 'Salesforce/blip-image-captioning-large',
#             'api_url': 'https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large'
#         },
#         'llava': {
#             'type': 'multimodal',
#             'endpoint': 'llava-hf/llava-1.5-7b-hf',
#             'api_url': 'https://api-inference.huggingface.co/models/llava-hf/llava-1.5-7b-hf'
#         }
#
# # # Multimodal Models (Vision)
# #     "blip-vqa": {
# #         "repo_id": "Salesforce/blip-vqa-base",
# #         "type": "multimodal"
# #     },
# #     "blip-captioning": {
# #         "repo_id": "Salesforce/blip-image-captioning-large",
# #         "type": "multimodal"
# #     },
# #     # Text-Only Models
# #     "mistral-7b": {
# #         "repo_id": "mistralai/Mistral-7B-Instruct-v0.2",
# #         "type": "text"
# #     },
# #     "zephyr-7b": {
# #         "repo_id": "HuggingFaceH4/zephyr-7b-beta",
# #         "type": "text"
# #     },
#
# }

# AVAILABLE_MODELS = {
#     # Multimodal Models (Vision)
#     "blip-vqa": {
#         "repo_id": "Salesforce/blip-vqa-base",
#         "type": "multimodal"
#     },
#     "blip-captioning": {
#         "repo_id": "Salesforce/blip-image-captioning-large",
#         "type": "multimodal"
#     },
#     # Text-Only Models
#     "mistral-7b": {
#         "repo_id": "mistralai/Mistral-7B-Instruct-v0.1",
#         "type": "text"
#     },
#     "zephyr-7b": {
#         "repo_id": "HuggingFaceH4/zephyr-7b-beta",
#         "type": "text"
#     },
#     "llama3" : {
#         "repo_id" : "meta-llama/Meta-Llama-3-8B-Instruct",
#         "type": "text"
#     }
# }

def image_to_base64(image_file):
    """ the function is to convert image file to base64 string"""

    try:
        buffered = io.BytesIO()
        # Ensure image is in RGB mode
        if image_file.mode != 'RGB':
            image_file = image_file.convert('RGB')
        image_file.save(buffered, format="JPEG")
        return base64.b64encode(buffered.getvalue()).decode('utf-8')
    except Exception as e:
        print(f"Error in image_to_base64: {e}")
        raise

@app.route('/api/health', methods = ['GET'])
def health_check():
    """ health check endpoint"""
    # model_status = "initialized" if llm is not None else "not initialized"
    #
    # return jsonify({
    #     'status': 'healthy',
    #     'model': MODEL_CONFIG['model_name'],
    #     'model_status': model_status,
    #     'model_type': MODEL_CONFIG['model_type'],
    #     'api_type': MODEL_CONFIG['api_type'],
    #     'hf_token_configured': bool('inferenceAPI'),
    #     'timestamp': datetime.datetime.now(tz=nz).isoformat()
    # return jsonify({
    #     "status": "ok" if llm else "error",
    #     "model": MODEL_NAME,
    #     "available models" : list(AVAILABLE_MODEL.keys())
    # })

    # try:
    #     test_model_id = "gemini-2.5-flash"
    #
    #     if test_model_id in AVAILABLE_MODEL:
    #         try:
    #             model_status = {
    #                 "status": "connected",
    #                 "models": list(AVAILABLE_MODEL.keys()),
    #                 "text_models": [k for k, v in AVAILABLE_MODEL.items() if v["type"] == "text"],
    #                 "multimodal_models": [k for k, v in AVAILABLE_MODEL.items() if v["type"] == "multimodal"],
    #                 "test_model": test_model_id,
    #                 "test_result": "success"
    #             }
    #             return jsonify(model_status), 200
    #         except Exception as e:
    #             return jsonify({
    #                 "status": "partial",
    #                 "models": list(AVAILABLE_MODEL.keys()),
    #                 "text_models": [k for k, v in AVAILABLE_MODEL.items() if v["type"] == "text"],
    #                 "multimodal_models": [k for k, v in AVAILABLE_MODEL.items() if v["type"] == "multimodal"],
    #                 "test_model": test_model_id,
    #                 "test_result": "failed",
    #                 "error": str(e)
    #             }), 200
    #         else:
    #             return jsonify({
    #                 "status": "error",
    #                 "message": "No test model available",
    #                 "models": list(AVAILABLE_MODEL.keys())
    #             }), 500
    #
    #         except Exception as e:
    #         return jsonify({
    #             "status": "disconnected",
    #             "error": str(e),
    #             "models": []
    #         }), 500

        # test a simple model to vericy basic connnection

    return jsonify({"status" : "connected", "models" : list(AVAILABLE_MODEL.keys())}), 200


# # Initialize the default model
# try:
#     llm_image = Config_chatbox.AVAILABLE_MODEL['gemini-2.5-flash']['loader']()
#     MODEL_NAME = "gemini-2.5-flash"
# except Exception as e:
#     print(f"Failed to initialize LLM: {e}")
#     llm_image = None
#     MODEL_NAME = "not-loaded"



# # ------ utility function ----
# def get_model(model_name: str):
#     """Dynamically gets the model instance based on the name."""
#     if model_name not in Config_chatbox.AVAILABLE_MODEL:
#         raise ValueError(f"Model {model_name} not found.")
#
#     config = Config_chatbox.AVAILABLE_MODEL[model_name]
#
#     if "error" in config:
#         raise RuntimeError(config["error"])
#
#     # For now, we only have gemini configured
#     if model_name == "gemini-2.5-flash":
#         return llm_image  # Return the pre-initialized one
#     else:
#         # Here you would add logic to load other models if they were configured
#         # For example:
#         if model_name == "openai":
#             return ChatOpenAI(model="gpt-4o-mini", max_tokens=512)
#         elif model_name == "gemma-3-27b-it":
#             return HuggingFaceEndpoint(repo_id = "google/gemma-3-12b-it", model_kwargs={"temperature": 0.7, "max_new_tokens": 100} ,huggingfacehub_api_token=huggingfaceAPI, )
#         raise NotImplementedError(f"Model {model_name} is not fully implemented yet.")

# def initalize_langchain_model():
#     """ Initaialize Langchian Model """
#
#     global llm_vision
#     global llm_text
#     try:
#         if not huggingfaceAPI:
#             logger.error("Hugging Face API token not found. Please set the HUGGINGFACE_API_KEY environment variable.")
#             return False
#
#         if MODEL_CONFIG['model_type'] == 'vision':
#             # from langchain_community.chat_models import HuggingFaceInferenceChat
#             # llm_vision = HuggingFaceInferenceChat(
#             #     model_name=MODEL_CONFIG['model_name'],
#             #     huggingfacehub_api_token=huggingfaceAPI,
#             #     model_kwargs={"temperature": 0.1, "max_new_tokens": 2048}
#             # )
#             llm_vision = HuggingFaceEndpoint(repo_id =AVAILABLE_MODEL[SELECTED_MODEL],
#                                             huggingfacehub_api_token= inferenceAPI,
#
#                                             temperature = 0.5,
#                                             max_new_tokens = 512,
#                                             repetition_penalty= 1.1,
#                                              provider = "auto" )
#
#
#         else:
#             llm_text = HuggingFaceEndpoint(repo_id = MODEL_CONFIG['model_name'],
#                                            hugginfacehub_api_token = inferenceAPI,
#                                            max_new_tokens = 512,
#                                            temperature = 0.5)
#
#         logger.info(f"Initialized LangChain model: {MODEL_CONFIG['model_name']} ({MODEL_CONFIG['model_type']})")
#         return True
#
#     except Exception as e:
#         logger.error(f"Error initializing LangChain model: {str(e)}")
#         return False
#
# def get_or_create_memory(conversation_id: str) -> ConversationBufferMemory:
#     """Get or create conversation memory for a conversation ID"""
#     if conversation_id not in memory_store:
#         memory_store[conversation_id] = ConversationBufferMemory(
#             return_messages=True,
#             memory_key="history"
#         )
#     return memory_store[conversation_id]

# nebiusai : qwen/Qwen2.5-VL-72B-Instruct, Qwen2-VL-72B-Instruct, google/gemma-3-27b-it
# Novida : meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8, meta-llama/Llama-4-Scout-17B-16E-Instruct

# def huggingface_vision_api(image_data: str, text_prompt: str, model_name: str):
#     """ call hugging face inference API for vision model"""
#
#     url =
#


# def allowed_file(filename):
#     return '.' in filename and \
#         filename.rsplit('.', 1)[1].lower() in Config_chatbox.ALLOWED_EXTENSIONS
#
# def encode_image_to_base64(image_path: str) -> str:
#     """Encode image to base64 string"""
#     with open(image_path, 'rb') as image_file:
#         return base64.b64encode(image_file.read()).decode('utf-8')
#
# def get_file_mime_type(filename):
#     """Get MIM type based on file extension"""
#     ext = filename.rsplit('.', 1)[1].lower()
#     mime_types = {
#         'png': 'image/png',
#         'jpg': 'image/jpeg',
#         'jpeg': 'image/jpeg',
#         'gif': 'image/gif',
#         'bmp': 'image/bmp',
#         'webp': 'image/webp'
#     }
#     return mime_types.get(ext, 'image/jpeg')

@app.route('/api/chat', methods=['POST'])
def handle_chat():
    """Handles both text-only and multimodal chat requests."""
    is_image_request = 'image' in request.files

    if is_image_request:
        return handle_image_request()
    else:
        return handle_text_request()

@app.route('/api/chat_RAG', methods=['POST'])
def handle_chat_RAG():
    # ROUTING LOGIC: Check if image exists in request
    if 'image' in request.files and request.files['image'].filename != '':
        return handle_image_request_RAG()
    else:
        return handle_text_request_RAG()

def handle_image_request_RAG():
    if not vector_db:
        return jsonify({"error": "Database not loaded."}), 500

    try:
        image_file = request.files['image']
        prompt_text = request.form.get('message', 'What is wrong with this plant?')
        model_id = request.form.get('model', 'gemini-2.5-pro')

        # 1. Save temp file for RAG
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp_img:
            image_file.save(temp_img.name)
            temp_img_path = temp_img.name

        # 2. RAG Retrieval
        print("🔍 Searching database...")
        query_vector = embedding_model.embed_image(uris=[temp_img_path])
        results = vector_db.similarity_search_by_vector(embedding=query_vector[0], k=10)

        # 3. Diagnosis
        votes = [res.metadata.get('disease', 'Unknown') for res in results]
        detected_disease = Counter(votes).most_common(1)[0][0] if votes else "Unknown"
        print(f"✅ Diagnosis: {detected_disease} (Matches: {votes})")

        # 4. Generate Answer
        augmented_prompt = f"""
        You are an expert plant pathologist.
        
        SYSTEM DIAGNOSIS:
        Our visual database strongly suggests: **{detected_disease}**.
        (Similar matches found: {votes})

        USER QUESTION: 
        {prompt_text}

        INSTRUCTIONS:
        1. Start by stating the diagnosis clearly.
        2. Explain the symptoms seen in the image.
        3. Provide 3 concrete steps to treat it.
        """

        image = PILImage.open(temp_img_path).convert("RGB")
        base64_img = image_to_base64(image)

        message = HumanMessage(content=[
            {"type": "text", "text": augmented_prompt},
            {"type": "image_url", "image_url": f"data:image/jpeg;base64,{base64_img}"}
        ])

        llm = AVAILABLE_MODEL[model_id]["loader"]()
        response = llm.invoke([message])

        os.remove(temp_img_path)

        return jsonify({
            "response": response.content.strip(),
            "diagnosis": detected_disease
        })

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500



# this is previous code
    # try:
    #     if is_image_request:
    #         # --- Image + Text Request ---
    #         image_file = request.files['image']
    #         prompt = request.form.get('message', 'Describe the image.')
    #         # FIX: Default to a multimodal model that exists in your dictionary
    #         model_id = request.form.get('model', 'gemini-2.5-flash')
    #
    #         # FIX: Corrected validation logic
    #         if model_id not in AVAILABLE_MODEL or AVAILABLE_MODEL[model_id]["type"] != "multimodal":
    #             return jsonify({"error": f"Model '{model_id}' is not a valid multimodal model."}), 400
    #
    #         image = Image.open(image_file.stream)
    #         message = HumanMessage(
    #             content=[
    #                 {"type": "text", "text": prompt},
    #                 {"type": "image_url", "image_url": f"data:image/jpeg;base64,{image_to_base64(image)}"}
    #             ]
    #         )
    #
    #         # FIX: Use the loader from the dictionary to create the model instance
    #         llm_image = AVAILABLE_MODEL[model_id]["loader"]()
    #         response = llm_image.invoke([message])
    #
    #     else:
    #         # --- Text-Only Request ---
    #         data = request.get_json()
    #         if not data or 'message' not in data:
    #             return jsonify({"error": "Message is required."}), 400
    #
    #         prompt = data['message']
    #         # FIX: Default to a text model that exists in your dictionary
    #         model_id = data.get('model', 'gemini-2.5-flash')
    #
    #         # FIX: This validation now works correctly because the "type" key exists
    #         if model_id not in AVAILABLE_MODEL or AVAILABLE_MODEL[model_id]["type"] != "text":
    #             return jsonify({"error": f"Model '{model_id}' is not a valid text model."}), 400
    #
    #         # FIX: Use the loader from the dictionary to create the model instance
    #         llm_text = AVAILABLE_MODEL[model_id]["loader"]()
    #
    #         message_txt = [
    #             (
    #                 "system",
    #                 "You are a helpful assistant that answer based on user question. If you can't understand or not sure just say 'I don't know'."
    #                 "Our user is normally unprofessional farmer."
    #             ),
    #             ("human", prompt)
    #         ]
    #         response = llm_text.invoke(message_txt)
    #
    #     response_content = response if isinstance(response, str) else response.content
    #     return jsonify({"response": response_content.strip()})
    #
    # except Exception as e:
    #     # It's good practice to log the full exception for debugging
    #     import traceback
    #     print(f"Error processing request: {e}")
    #     traceback.print_exc()
    #     return jsonify({"error": "Failed to process the request on the backend."}), 500


# @app.route('/api/chat', methods=['POST'])
# def handle_chat():
#     """Handles both text-only and multimodal chat requests."""
#     # Check if the request is multipart/form-data (for images) or application/json
#     """Handles both text-only and multimodal chat requests."""
#     is_image_request = 'image' in request.files
#
#     try:
#         if is_image_request:
#             # --- Image + Text Request ---
#             image_file = request.files['image']
#             prompt = request.form.get('message', 'Describe the image.')
#             model_id = request.form.get('model', 'blip-vqa')  # Default to a multimodal model
#
#             if model_id not in AVAILABLE_MODEL or AVAILABLE_MODEL[model_id]["package"] != "multimodal":
#                 return jsonify({"error": f"Model '{model_id}' is not a valid multimodal model."}), 400
#
#             image = Image.open(image_file.stream)
#             # The HumanMessage format for multimodal prompts is specific
#             message = HumanMessage(
#                 content=[
#                     {"type": "text", "text": prompt},
#                     {"type": "image_url", "image_url": f"data:image/jpeg;base64,{image_to_base64(image)}"}
#                 ]
#             )
#             repo_id = AVAILABLE_MODEL[model_id]["repo_id"]
#             llm_image = HuggingFaceEndpoint(
#                 repo_id=repo_id,
#                 huggingfacehub_api_token = inferenceAPI,
#                 temperature=0.7,
#             )
#             response = llm_image.invoke([message])
#
#         else:
#             # --- Text-Only Request ---
#             data = request.get_json()
#             if not data or 'message' not in data:
#                 return jsonify({"error": "Message is required."}), 400
#
#             prompt = data['message']
#             model_id = data.get('model', 'mistral-7b')  # Default to a text model
#
#             if model_id not in AVAILABLE_MODEL or AVAILABLE_MODEL[model_id]["type"] != "text":
#                 return jsonify({"error": f"Model '{model_id}' is not a valid text model."}), 400
#
#             repo_id = AVAILABLE_MODEL[model_id]["repo_id"]
#
#             llm_text = ChatGoogleGenerativeAI(
#                 model = "gemini-2.5-flash",
#                 temperature = 0.1,
#                 max_tokens = None,
#                 max_output_tokens = 512,
#             )
#
#             message_txt = [
#                 (
#                     "system",
#                     "You are a helpful assistant that answer based on user question. If you can't understand or not sure just say 'I don't know'."
#                     "Our user is normally unprofessional farmer."
#                 ),
#                 ("human" , prompt)
#             ]
#             # llm_text = HuggingFaceEndpoint(
#             #     repo_id=repo_id,
#             #     huggingfacehub_api_token=inferenceAPI,
#             #     temperature = 0.1,
#             #     max_new_tokens = 512
#             # )
#             response = llm_text.invoke(message_txt)
#
#         # Clean up the response content
#         response_content = response if isinstance(response, str) else response.content
#         return jsonify({"response": response_content.strip()})
#
#     except Exception as e:
#         print(f"Error processing request: {e}")
#         return jsonify({"error": "Failed to process the request on the backend."}), 500


# def chatbox():
#     """
#     Handles text-only chat messages.
#     Maintains a conversation history for context.
#     """
#     if not llm:
#         return jsonify({"error": "Model not loaded"}), 500
#
#     data = request.json
#     message_text = data.get("message")
#     conversation_id = data.get("conversation_id", "default")
#     model_name = data.get("model", "gemini-2.5-flash")
#
#     if not message_text:
#         return jsonify({"error": "Message is required"}), 400
#
#     try:
#         # Get the selected model
#         current_llm = get_model(model_name)
#
#         # Get conversation history
#         history = conversation_history.get(conversation_id, [])
#
#         # Construct message for the model
#         message = HumanMessage(content=message_text)
#
#         # Combine history and new message
#         full_prompt = history + [message]
#
#         # Get the model's response
#         response = current_llm.invoke(full_prompt)
#         response_text = response.content
#
#         # Update conversation history
#         history.append(message)
#         history.append(response)  # response is an AIMessage
#         conversation_history[conversation_id] = history
#
#         return jsonify({"response": response_text})
#
#     except Exception as e:
#         print(f"Error during text chat: {e}")
#         return jsonify({"error": "Failed to process text message"}), 500
    # if not inferenceAPI:
    #     return jsonify({"error": "Hugging Face inference API token not configured."}), 400
    #
    # try:
    #     data = request.get_json()
    #
    #     if not data or 'message' not in data:
    #         return jsonify({'error' : 'Message is required'}), 400
    #
    #     user_message = data['message']
    #     conversation_id = data.get('conversation_id', 'default')
    #
    #     # Get conversation memory
    #     memory = get_or_create_memory(conversation_id)
    #
    #     # Create conversation chain
    #     conversation = ConversationChain(
    #         llm=llm_qwen,
    #         memory=memory,
    #         verbose=True
    #     )
    #
    #     # Get response from model
    #     response = conversation.predict(input=user_message)
    #
    #     return jsonify({
    #         'response': response,
    #         'conversation_id': conversation_id,
    #         'model': SELECTED_MODEL,
    #         'timestamp': datetime.datetime.now(tz=nz).isoformat()
    #     })
    #
    # except Exception as e:
    #     logger.error(f"Error in chat endpoint: {str(e)}")
    #     return jsonify({'error': str(e)}), 500

# @app.route("/api/chat/image", methods = ["POST"])
# def chat_with_image():
#     """
#         Handles messages that include an image for analysis.
#         """
#     if not llm_image:
#         return jsonify({"error": "Model not loaded"}), 500
#
#     if 'image' not in request.files:
#         return jsonify({"error": "No image file provided"}), 400
#
#     image_file = request.files['image']
#     question = request.form.get("message", "What is in this image?")
#     model_name = request.form.get("model", "gemini-2.5-flash")
#     # conversation_id is not used for single image queries in this implementation
#     conversation_id = request.form.get("conversation_id", "default")
#
#     if not question:
#         question = "Describe the image in detail."
#
#     try:
#         # Read image
#         image_bytes = image_file.read()
#         # Encode image to base64
#         base64_image = base64.b64encode(image_bytes).decode('utf-8')
#         mime_type = get_file_mime_type(image_file.filename)
#         image_url = f"data:{mime_type};base64,{base64_image}"
#
#
#         # Get the selected model
#         current_llm = get_model(model_name)
#
#         # Construct message for the vision model
#         message = HumanMessage(
#             content=[
#                 {"type": "text", "text": question},
#                 {"type": "image_url", "image_url": {"url": image_url}},
#             ]
#         )
#
#         # Get the model's prediction
#         response = current_llm.invoke([message])
#         response_text = response.content
#
#         return jsonify({"response": response_text})
#
#     except Exception as e:
#         print(f"Error during image chat: {e}")
#         return jsonify({"error": "Failed to process image"}), 500

# def handle_image_request():
#     """Handle multimodal (image + text) requests."""
#     try:
#         # Debug: Check if image file exists
#         if 'image' not in request.files:
#             return jsonify({"error": "No image file in request"}), 400
#
#         image_file = request.files['image']
#
#         # Debug: Check file properties
#         print(f"Image file: {image_file}")
#         print(f"Image filename: {image_file.filename}")
#         print(f"Image content type: {image_file.content_type}")
#
#         if image_file.filename == '':
#             return jsonify({"error": "No image file selected"}), 400
#
#         prompt = request.form.get('message', 'Describe the image.')
#         model_id = request.form.get('model', 'gemini-2.5-flash')
#
#         # Validation code (same as before)...
#         if model_id not in AVAILABLE_MODEL:
#             available_multimodal = [k for k, v in AVAILABLE_MODEL.items() if v["type"] == "multimodal"]
#             return jsonify({
#                 "error": f"Model '{model_id}' not found. Available multimodal models: {available_multimodal}"
#             }), 400
#
#         if AVAILABLE_MODEL[model_id]["type"] != "multimodal":
#             available_multimodal = [k for k, v in AVAILABLE_MODEL.items() if v["type"] == "multimodal"]
#             return jsonify({
#                 "error": f"Model '{model_id}' is not a multimodal model. Available multimodal models: {available_multimodal}"
#             }), 400
#
#         # FIXED: Multiple ways to handle image processing
#         try:
#             # Method 1: Reset stream position
#             image_file.stream.seek(0)
#             image = Image.open(image_file.stream)
#             print(f"Successfully opened image: {image.format}, {image.size}")
#
#         except Exception as e1:
#             print(f"Method 1 failed: {e1}")
#             try:
#                 # Method 2: Read into BytesIO
#                 image_file.stream.seek(0)
#                 image_data = image_file.stream.read()
#                 image = Image.open(io.BytesIO(image_data))
#                 print(f"Method 2 success: {image.format}, {image.size}")
#
#             except Exception as e2:
#                 print(f"Method 2 failed: {e2}")
#                 try:
#                     # Method 3: Use file directly
#                     image = Image.open(image_file)
#                     print(f"Method 3 success: {image.format}, {image.size}")
#
#                 except Exception as e3:
#                     print(f"Method 3 failed: {e3}")
#                     return jsonify({
#                         "error": f"Failed to open image file. Tried 3 methods. Last error: {str(e3)}"
#                     }), 400
#
#         # Create message with image
#         message = HumanMessage(
#             content=[
#                 {"type": "text", "text": prompt},
#                 {"type": "image_url", "image_url": f"data:image/jpeg;base64,{image_to_base64(image)}"}
#             ]
#         )
#
#         # Create and invoke the model
#         llm_image = AVAILABLE_MODEL[model_id]["loader"]()
#         response = llm_image.invoke([message])
#
#         # Process response
#         response_content = response if isinstance(response, str) else response.content
#         return jsonify({"response": response_content.strip()})
#
#     except Exception as error:
#         import traceback
#         print(f"Error processing image request: {error}")
#         traceback.print_exc()
#         return jsonify({
#             "error": f"Failed to process image: {str(error)}"
#         }), 500
def handle_image_request():
    """Handle multimodal (image + text) requests."""
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image file in request"}), 400

        image_file = request.files['image']
        if image_file.filename == '':
            return jsonify({"error": "No image file selected"}), 400

        prompt = request.form.get('message', 'Describe the image.')
        model_id = request.form.get('model', 'gemini-2.5-pro')

        # Validation
        if model_id not in AVAILABLE_MODEL:
            available_multimodal = [k for k, v in AVAILABLE_MODEL.items() if v["type"] == "multimodal"]
            return jsonify({
                "error": f"Model '{model_id}' not found. Available multimodal models: {available_multimodal}"
            }), 400

        if AVAILABLE_MODEL[model_id]["type"] != "multimodal":
            return jsonify({
                "error": f"Model '{model_id}' is not a multimodal model."
            }), 400

        # Open the image safely
        image_file.stream.seek(0)
        image = PILImage.open(image_file.stream).convert("RGB")

        # Convert to base64 for consistency
        base64_img = image_to_base64(image)

        # Construct HumanMessage
        message = HumanMessage(
            content=[
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": f"data:image/jpeg;base64,{base64_img}"}
            ]
        )

        # Load model + invoke
        llm = AVAILABLE_MODEL[model_id]["loader"]()
        response = llm.invoke([message])

        response_content = response if isinstance(response, str) else response.content
        return jsonify({"response": response_content.strip()})

    except Exception as error:
        import traceback
        print(f"Error processing image request: {error}")
        traceback.print_exc()
        return jsonify({"error": f"Failed to process image: {str(error)}"}), 500


def handle_text_request_RAG():
    try:
        # Support both JSON and multipart form data
        if request.is_json:
            data = request.get_json()
            prompt_text = data.get('message')
            model_id = data.get('model', 'gemini-2.5-flash')
        else:
            prompt_text = request.form.get('message')
            model_id = request.form.get('model', 'gemini-2.5-flash')

        if not prompt_text:
            return jsonify({"error": "No message provided"}), 400

        print(f"💬 Text RAG Chat: {prompt_text}")

        system_context = """
                You are an expert agricultural assistant. 
                Answer the user's question accurately. 
                If the question is about plant diseases, ask them to upload a photo for a better diagnosis.

                Question: 
                """

        message = HumanMessage(content=system_context + prompt_text)

        llm = AVAILABLE_MODEL[model_id]["loader"]()
        response = llm.invoke([message])

        return jsonify({
            "response": response.content.strip(),
            "diagnosis": "None (Text Only)"
        })

    except Exception as e:
        print(f"Text RAG Error: {e}")
        return jsonify({"error": str(e)}), 500



def handle_text_request():
    """Handle text-only requests."""
    try:
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({"error": "Message is required."}), 400

        prompt = data['message']
        model_id = data.get('model', 'gemini-2.5-flash')

        # Validation
        if model_id not in AVAILABLE_MODEL:
            available_models = [k for k, v in AVAILABLE_MODEL.items() if v["type"] in ["text", "multimodal"]]
            return jsonify({
                "error": f"Model '{model_id}' not found. Available models: {available_models}"
            }), 400

        # Allow both text and multimodal models for text-only requests
        if AVAILABLE_MODEL[model_id]["type"] not in ["text", "multimodal"]:
            return jsonify({
                "error": f"Model '{model_id}' cannot handle text requests."
            }), 400

        # Create and invoke the model
        llm_text = AVAILABLE_MODEL[model_id]["loader"]()

        message_txt = [
            (
                "system",
                "You are a helpful assistant that answers based on user questions. If you can't understand or are not sure, just say 'I don't know'. "
                "Our user is normally an unprofessional farmer."
            ),
            ("human", prompt)
        ]
        response = llm_text.invoke(message_txt)

        # Process response - MOVED INSIDE TRY BLOCK
        response_content = response if isinstance(response, str) else response.content
        return jsonify({"response": response_content.strip()})

    except Exception as error:
        import traceback
        print(f"Error processing text request: {error}")
        traceback.print_exc()
        return jsonify({
            "error": f"Failed to process text with model '{model_id}': {str(error)}"
        }), 500


@app.route("/api/conversation/<conversation_id>", methods=["DELETE"])
def delete_conversation(conversation_id):
    """
    Clears the conversation history for a given conversation ID.
    """
    if conversation_id in conversation_history:
        del conversation_history[conversation_id]
        return jsonify({"message": f"Conversation {conversation_id} cleared."}), 200
    return jsonify({"error": "Conversation not found"}), 404

# -------------------------- version 3-----------------------------

# Hugging Face transformers for local multimodal processing
try:
    from transformers import pipeline
    TRANSFORMERS_AVAILABLE = True
except Exception:
    TRANSFORMERS_AVAILABLE = False

# Configuration fron env
LOCAL_MULTIMODAL_MODEL = os.environ.get("LOCAL_MULTIMODAL_MODEL", "Salesforce/blip-image-captioning-base")
DEFAULT_LLM = os.environ.get("DEFAULT_LLM", "huggingface-inference/gpt2")  # or small flan model
ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "bmp", "gif"}

# Simple in-memory conversation store (production: use DB)
CONVERSATIONS: Dict[str, list] = {}
CONVERSATION_LOCK = threading.Lock()

# Model Manager
class ModelManager:
    """
       Simple router for models.
       - multimodal_models: handled locally via transformers pipelines (image captioning)
       - text_models_remote: handled via Hugging Face Inference API or LangChain HuggingFaceHub
       """

    def __init__(self):
        self.multimodal_models = {
            # keys that frontend might send -> pipeline model name
            "blip-vqa": LOCAL_MULTIMODAL_MODEL,
            "blip-image-captioning": LOCAL_MULTIMODAL_MODEL,
            "blip": LOCAL_MULTIMODAL_MODEL,
            "llava-1.5-7b": "openai/llava-placeholder",  # placeholder if you later load local LLaVA
            "blip-vqa-base": "Salesforce/blip-vqa-base",
            "blip-image-captioning-base": "Salesforce/blip-image-captioning-base",
        }

        # textual models that we expect to call remotely (Hugging Face Inference or LangChain)
        self.remote_text_models = {
            "gpt2": "gpt2",
            "flan-t5-small": "google/flan-t5-small",
            "vicuna-7b": "meta/vicuna-placeholder",  # placeholder
            "default": DEFAULT_LLM,
        }

        def is_multimodal(self, model_key: Optional[str]) -> bool:
            if not model_key:
                return False
            return model_key in self.multimodal_models

        def get_multimodal_pipeline(self, model_key: Optional[str]):
            if not TRANSFORMERS_AVAILABLE:
                raise RuntimeError(
                    "transformers library not available. Install `transformers` to use local multimodal models.")
            model_name = self.multimodal_models.get(model_key, LOCAL_MULTIMODAL_MODEL)
            cache_key = f"image_to_text::{model_name}"

            if cache_key not in self._pipelines:
                # Use 'image-to-text' pipeline for captioning. This will download model if not present.
                # For small setups consider using smaller captioning models. Adjust model_name accordingly.
                pipe = pipeline("image-to-text", model=model_name)
                self._pipelines[cache_key] = pipe
            return self._pipelines[cache_key]


# -------------------------- Version 3 End  -----------------------------

# --------------- Start camera control example ----------------

def allowed_file(filename):
    return '.' in filename and filename.rsplit



# ---------------------- End camera control or arm code


# ------------------------ Start TurtleBot control code --------------------

# ROS Bridge connection
TURTLEBOT_IP = '10.74.33.238'
ROSBRIDGE_PORT = 9090
# turtlebot_client = roslibpy.Ros(host= TURTLEBOT_IP, port = 9090)
# turtlebot_client.run()
#
# # RIS Topics
# # ROS Topics
# cmd_vel_topic = roslibpy.Topic(turtlebot_client, '/cmd_vel', 'geometry_msgs/Twist')
# goal_topic = roslibpy.Topic(turtlebot_client, '/move_base_simple/goal', 'geometry_msgs/PoseStamped')



# SPEED LIMITS
MAX_LINEAR_SPEED = 0.7
MAX_ANGULAR_SPEED = 1.5

# Farm boundaries (adjust for your farm)
FARM_BOUNDS = {
    'x_min': -10.0,
    'x_max': 10.0,
    'y_min': -10.0,
    'y_max': 10.0
}



# ============ ROS Connection ============
ros_client = None
ros_connected = False

# ROS Topics (will be initialized after connection)
cmd_vel_topic = None
goal_topic = None
cancel_topic = None

# Storage
command_history = []
robot_state = {
    'battery': {'percentage': 0, 'voltage': 0, 'current': 0},
    'odometry': {'x': 0, 'y': 0, 'theta': 0},
    'velocity': {'linear': 0, 'angular': 0},
    'mode': 'idle',
    'patrol_active': False
}
 # =================== ROS Connection Function =======================

def init_ros_connection():
    """Initialize ROS connection"""
    global ros_client, ros_connected, cmd_vel_topic, goal_topic, cancel_topic

    try:
        logger.info(f"Connecting to ROS at {TURTLEBOT_IP}:{ROSBRIDGE_PORT}")
        ros_client = roslibpy.Ros(host=TURTLEBOT_IP, port=ROSBRIDGE_PORT)
        ros_client.run()

        if ros_client.is_connected:
            ros_connected = True
            logger.info("Successfully connected to ROS")

            # Initialize publishers
            cmd_vel_topic = roslibpy.Topic(
                ros_client,
                '/mobile_base/commands/velocity',
                'geometry_msgs/Twist'
            )
            logger.info("✅ Created /cmd_vel publisher")

            goal_topic = roslibpy.Topic(
                ros_client,
                '/move_base_simple/goal',
                'geometry_msgs/PoseStamped'
            )

            cancel_topic = roslibpy.Topic(
                ros_client,
                '/move_base/cancel',
                'actionlib_msgs/GoalID'
            )

            # Subscribe to robot status topics
            setup_ros_subscribers()

            return True
        else:
            logger.error("Failed to connect to ROS")
            ros_connected = False
            return False

    except Exception as e:
        logger.error(f"ROS connection error: {e}")
        ros_connected = False
        return False


def setup_ros_subscribers():
    """Setup subscribers for robot status"""
    try:
        # Battery status
        battery_sub = roslibpy.Topic(
            ros_client,
            '/mobile_base/sensors/core',
            'kobuki_msgs/SensorState'
        )
        battery_sub.subscribe(lambda msg: handle_battery_update(msg))

        # Odometry
        odom_sub = roslibpy.Topic(
            ros_client,
            '/odom',
            'nav_msgs/Odometry'
        )
        odom_sub.subscribe(lambda msg: handle_odom_update(msg))

        # Velocity feedback
        vel_sub = roslibpy.Topic(
            ros_client,
            '/cmd_vel',
            'geometry_msgs/Twist'
        )
        vel_sub.subscribe(lambda msg: handle_velocity_update(msg))

        # Move base result - for navigation feedback
        result_sub = roslibpy.Topic(
            ros_client,
            '/move_base/result',
            'move_base_msgs/MoveBaseActionResult'
        )
        result_sub.subscribe(lambda msg: handle_navigation_result(msg))

        logger.info("ROS subscribers setup complete")

    except Exception as e:
        logger.error(f"Error setting up subscribers: {e}")


def handle_battery_update(message):
    """Handle battery status updates"""
    robot_state['battery'] = {
        'percentage': message.get('battery', 0),
        'voltage': message.get('voltage', 0),
        'current': message.get('current', 0)
    }
    # Broadcast to connected clients
    socketio.emit('battery_update', robot_state['battery'])


def handle_odom_update(message):
    """Handle odometry updates"""
    try:
        pose = message.get('pose', {}).get('pose', {})
        position = pose.get('position', {})
        orientation = pose.get('orientation', {})

        robot_state['odometry'] = {
            'x': position.get('x', 0),
            'y': position.get('y', 0),
            'theta': orientation.get('z', 0)
        }
        # Broadcast to connected clients
        socketio.emit('odometry_update', robot_state['odometry'])
    except Exception as e:
        logger.error(f"Error processing odometry: {e}")


def handle_velocity_update(message):
    """Handle velocity updates"""
    try:
        linear = message.get('linear', {})
        angular = message.get('angular', {})

        robot_state['velocity'] = {
            'linear': linear.get('x', 0),
            'angular': angular.get('z', 0)
        }
        # Broadcast to connected clients
        socketio.emit('velocity_update', robot_state['velocity'])
    except Exception as e:
        logger.error(f"Error processing velocity: {e}")


# ============ Utility Functions ============

def log_command(command_type, data, user_id='anonymous', success=True):
    """Log all commands for audit trail"""
    log_entry = {
        'timestamp': datetime.datetime.now(nz),
        'user': user_id,
        'command': command_type,
        'data': data,
        'success': success
    }
    command_history.append(log_entry)

    # Keep only last 1000 commands
    if len(command_history) > 1000:
        command_history.pop(0)

    logger.info(f"Command: {command_type} by {user_id} - Success: {success}")


def validate_speed(linear, angular):
    """Validate speed limits"""
    if abs(linear) > MAX_LINEAR_SPEED:
        raise ValueError(f"Linear speed {linear} exceeds limit {MAX_LINEAR_SPEED}")
    if abs(angular) > MAX_ANGULAR_SPEED:
        raise ValueError(f"Angular speed {angular} exceeds limit {MAX_ANGULAR_SPEED}")


def validate_position(x, y):
    """Validate if position is within farm boundaries"""
    if not (FARM_BOUNDS['x_min'] <= x <= FARM_BOUNDS['x_max']):
        raise ValueError(f"X position {x} outside boundaries")
    if not (FARM_BOUNDS['y_min'] <= y <= FARM_BOUNDS['y_max']):
        raise ValueError(f"Y position {y} outside boundaries")


def require_ros_connection(f):
    """Decorator to check ROS connection"""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not ros_connected or not ros_client or not ros_client.is_connected:
            return jsonify({
                'success': False,
                'error': 'Not connected to robot'
            }), 503
        return f(*args, **kwargs)

    return decorated_function

def handle_request_body(f):
    @wraps(f)
    def decorated_functions(*args, **kwargs):
        # Make request.json always safe to access
        if not request.is_json:
            request.json = {}
        return f(*args, **kwargs)
    return decorated_functions

# ============ REST API Endpoints ============

# # Store robot state
# robot_state = {
#     'connected': False,
#     'battery': 0,
#     'mode': 'idle',
#     'current_waypoint': None,
#     'patrol_active': False
# }

@app.route('/api/robot/health', methods=['GET'])
def health_check_robot():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'ros_connected': ros_connected,
        'timestamp': datetime.datetime.now(nz)
    })


@app.route('/api/robot/connect', methods=['POST'])
def connect_robot():
    global TURTLEBOT_IP
    try:
        data = request.json or {}
        robot_ip = data.get('robot_ip', TURTLEBOT_IP)
        # global TURTLEBOT_IP
        TURTLEBOT_IP = robot_ip
        success = init_ros_connection()

        if success:
            return jsonify(
                {'success': True, 'message': f'Connected to robot at {robot_ip}', 'ros_connected': ros_connected})
        else:
            return jsonify({'success': False,
                            'error': 'Failed to connect to rosbridge. Make sure rosbridge_server is running on the robot.'}), 500
    except Exception as e:
        logger.error(f"Connection error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500



# def disconnect_robot():
#     """Disconnect from robot"""
#     global ros_connected, ros_client
#
#     try:
#         if ros_client:
#             try:
#                 # Just set connected flag to False, don't terminate
#                 ros_connected = False
#                 ros_client = None
#             except Exception as e:
#                 logger.warning(f"Error during disconnect: {e}")
#
#         ros_connected = False
#
#         return jsonify({
#             'success': True,
#             'message': 'Disconnected from robot'
#         })
#     except Exception as e:
#         logger.error(f"Disconnect error: {e}")
#         return jsonify({
#             'success': False,
#             'error': str(e)
#         }), 500
@app.route('/api/robot/disconnect', methods=['POST'])
def disconnect_robot():
    global ros_connected, ros_client, cmd_vel_topic, goal_topic, cancel_topic
    try:
        if cmd_vel_topic:
            try:
                stop_msg = roslibpy.Message({'linear': {'x': 0, 'y': 0, 'z': 0}, 'angular': {'x': 0, 'y': 0, 'z': 0}})
                cmd_vel_topic.publish(stop_msg)
                logger.info("Sent stop command before disconnect")
            except:
                pass
        cmd_vel_topic = None
        goal_topic = None
        cancel_topic = None
        ros_client = None
        ros_connected = False
        logger.info("Disconnected from robot")
        return jsonify({'success': True, 'message': 'Disconnected from robot'})
    except Exception as e:
        logger.error(f"Disconnect error: {e}")
        ros_connected = False
        ros_client = None
        return jsonify({'success': True, 'message': 'Disconnected from robot'})


@app.route('/api/robot/status', methods=['GET'])
def get_robot_status():
    """Get current robot status"""
    return jsonify({
        'connected': ros_connected,
        'battery': robot_state['battery'],
        'odometry': robot_state['odometry'],
        'velocity': robot_state['velocity'],
        'mode': robot_state['mode'],
        'patrol_active': robot_state['patrol_active']
    })


@app.route('/api/control/move', methods=['POST'])
@require_ros_connection
def move_robot():
    try:
        data = request.json
        linear = float(data.get('linear', 0))
        angular = float(data.get('angular', 0))
        user_id = data.get('user_id', 'anonymous')

        logger.info(f"📥 Received move command: linear={linear}, angular={angular}")
        validate_speed(linear, angular)
        logger.info("✅ Speed validation passed")

        message = roslibpy.Message({
            'linear': {'x': linear, 'y': 0, 'z': 0},
            'angular': {'x': 0, 'y': 0, 'z': angular}
        })

        logger.info(f"📤 Publishing to /cmd_vel: linear.x={linear}, angular.z={angular}")
        cmd_vel_topic.publish(message)
        logger.info("✅ Message published successfully to /cmd_vel")

        log_command('move', {'linear': linear, 'angular': angular}, user_id)

        return jsonify({'success': True, 'linear': linear, 'angular': angular, 'timestamp': datetime.datetime.now(nz)})

    except ValueError as e:
        logger.error(f"❌ Validation error: {e}")
        log_command('move', request.json, 'anonymous', success=False)
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        logger.error(f"❌ Error in move_robot: {e}", exc_info=True)
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@app.route('/api/control/stop', methods=['POST'])
@require_ros_connection
def stop_robot():
    try:
        user_id = request.json.get('user_id', 'anonymous') if request.json else 'anonymous'
        logger.info("🛑 Stop command received")
        message = roslibpy.Message({'linear': {'x': 0, 'y': 0, 'z': 0}, 'angular': {'x': 0, 'y': 0, 'z': 0}})
        cmd_vel_topic.publish(message)
        logger.info("✅ Stop command sent to /cmd_vel")
        log_command('stop', {}, user_id)
        return jsonify({'success': True, 'message': 'Robot stopped'})
    except Exception as e:
        logger.error(f"❌ Error in stop_robot: {e}", exc_info=True)
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/navigation/goal', methods=['POST'])
@require_ros_connection
def send_navigation_goal():
    """Send navigation goal with validation"""
    try:
        data = request.json
        position = data.get('position', {})
        orientation = data.get('orientation', {})
        user_id = data.get('user_id', 'anonymous')

        x = float(position.get('x', 0))
        y = float(position.get('y', 0))
        z = float(position.get('z', 0))

        validate_position(x, y)

        message = roslibpy.Message({
            'header': {
                'frame_id': 'map',
                'stamp': {
                    'secs': int(time.time()),
                    'nsecs': int((time.time() % 1) * 1e9)
                }
            },
            'pose': {
                'position': {'x': x, 'y': y, 'z': z},
                'orientation': {
                    'x': orientation.get('x', 0),
                    'y': orientation.get('y', 0),
                    'z': orientation.get('z', 0),
                    'w': orientation.get('w', 1)
                }
            }
        })

        goal_topic.publish(message)
        log_command('navigation_goal', {'position': position, 'orientation': orientation}, user_id)

        return jsonify({
            'success': True,
            'message': 'Navigation goal sent',
            'position': position
        })

    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error in send_navigation_goal: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/navigation/cancel', methods=['POST'])
@require_ros_connection
def cancel_navigation():
    """Cancel current navigation goal"""
    try:
        data = request.get_json(silent=True) or {}
        user_id = data.get('user_id', 'anonymous')

        if cancel_topic:
            message = roslibpy.Message({})
            cancel_topic.publish(message)

        robot_state['patrol_active'] = False
        robot_state['mode'] = 'idle'

        log_command('cancel_navigation', {}, user_id)

        return jsonify({
            'success': True,
            'message': 'Navigation cancelled'
        })

    except Exception as e:
        logger.error(f"Error in cancel_navigation: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ========================= Turtlebot patrol code ==================
# Add to global variables section
patrol_thread = None
patrol_waypoints = []
current_waypoint_index = 0
patrol_running = False


# Add this new function for patrol management
def patrol_loop():
    """Background thread that manages patrol waypoint execution"""
    global patrol_running, current_waypoint_index, patrol_waypoints

    logger.info("🚁 Patrol loop started")

    while patrol_running and patrol_waypoints:
        try:
            waypoint = patrol_waypoints[current_waypoint_index]
            logger.info(f"📍 Going to waypoint {current_waypoint_index + 1}/{len(patrol_waypoints)}: {waypoint['name']}")

            # Update state
            robot_state['mode'] = 'navigating'
            socketio.emit('navigation_update', {
                'status': 'navigating',
                'current_waypoint': waypoint['name'],
                'waypoint_index': current_waypoint_index,
                'total_waypoints': len(patrol_waypoints)
            })

            # Send goal
            position = waypoint['position']
            orientation = waypoint['orientation']

            message = roslibpy.Message({
                'header': {
                    'frame_id': 'map',
                    'stamp': {
                        'secs': int(time.time()),
                        'nsecs': int((time.time() % 1) * 1e9)
                    }
                },
                'pose': {
                    'position': {
                        'x': position['x'],
                        'y': position['y'],
                        'z': position['z']
                    },
                    'orientation': {
                        'x': orientation['x'],
                        'y': orientation['y'],
                        'z': orientation['z'],
                        'w': orientation['w']
                    }
                }
            })

            goal_topic.publish(message)

            # Wait for goal to complete (timeout after 60 seconds)
            # In a real implementation, you'd subscribe to move_base/result
            # For now, we'll use a simple timeout
            wait_time = 0
            max_wait = 60  # seconds

            while patrol_running and wait_time < max_wait:
                time.sleep(1)
                wait_time += 1

            if not patrol_running:
                logger.info("🛑 Patrol stopped by user")
                break

            logger.info(f"✅ Reached waypoint {current_waypoint_index + 1}")

            # Emit waypoint reached event
            socketio.emit('waypoint_reached', {
                'waypoint_index': current_waypoint_index,
                'waypoint_name': waypoint['name']
            })

            # Move to next waypoint (loop back to start)
            current_waypoint_index = (current_waypoint_index + 1) % len(patrol_waypoints)

            # Small pause between waypoints
            time.sleep(2)

        except Exception as e:
            logger.error(f"❌ Error in patrol loop: {e}", exc_info=True)
            robot_state['mode'] = 'error'
            socketio.emit('navigation_error', {'error': str(e)})
            break

    # Cleanup
    robot_state['patrol_active'] = False
    robot_state['mode'] = 'idle'
    logger.info("🏁 Patrol loop ended")


# Replace your existing start_patrol function with this:
@app.route('/api/patrol/start', methods=['POST'])
@require_ros_connection
def start_patrol():
    """Start autonomous patrol with sequential waypoint navigation"""
    global patrol_thread, patrol_waypoints, current_waypoint_index, patrol_running

    try:
        data = request.json
        waypoints = data.get('waypoints', [])
        user_id = data.get('user_id', 'anonymous')

        if not waypoints:
            return jsonify({'success': False, 'error': 'No waypoints provided'}), 400

        # Validate all waypoints
        for wp in waypoints:
            pos = wp.get('position', {})
            validate_position(pos.get('x', 0), pos.get('y', 0))

        # Stop any existing patrol
        if patrol_running:
            logger.info("Stopping existing patrol...")
            patrol_running = False
            if patrol_thread and patrol_thread.is_alive():
                patrol_thread.join(timeout=5)

        # Initialize patrol
        patrol_waypoints = waypoints
        current_waypoint_index = 0
        patrol_running = True
        robot_state['patrol_active'] = True
        robot_state['mode'] = 'patrol'

        # Start patrol thread
        patrol_thread = threading.Thread(target=patrol_loop, daemon=True)
        patrol_thread.start()

        log_command('patrol_start', {'waypoints_count': len(waypoints)}, user_id)

        logger.info(f"✅ Patrol started with {len(waypoints)} waypoints")

        return jsonify({
            'success': True,
            'message': 'Patrol started',
            'waypoints_count': len(waypoints)
        })

    except ValueError as e:
        logger.error(f"Validation error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error in start_patrol: {e}", exc_info=True)
        return jsonify({'success': False, 'error': str(e)}), 500


# Replace your existing stop_patrol function with this:
@app.route('/api/patrol/stop', methods=['POST'])
@require_ros_connection
# @handle_request_body
def stop_patrol():
    """Stop autonomous patrol"""
    global patrol_running, patrol_thread

    try:
        # FIX: Use get_json(silent=True) instead of request.json
        data = request.get_json(silent=True) or {}
        user_id = data.get('user_id', 'anonymous')

        logger.info("🛑 Stopping patrol...")

        patrol_running = False

        if patrol_thread and patrol_thread.is_alive():
            patrol_thread.join(timeout=5)

        if cancel_topic:
            cancel_topic.publish(roslibpy.Message({}))

        if cmd_vel_topic:
            stop_msg = roslibpy.Message({
                'linear': {'x': 0, 'y': 0, 'z': 0},
                'angular': {'x': 0, 'y': 0, 'z': 0}
            })
            cmd_vel_topic.publish(stop_msg)

        robot_state['patrol_active'] = False
        robot_state['mode'] = 'idle'

        log_command('patrol_stop', {}, user_id)

        logger.info("✅ Patrol stopped successfully")

        return jsonify({
            'success': True,
            'message': 'Patrol stopped'
        })

    except Exception as e:
        logger.error(f"Error in stop_patrol: {e}", exc_info=True)
        return jsonify({'success': False, 'error': str(e)}), 500


# Add this endpoint to get current patrol status
@app.route('/api/patrol/status', methods=['GET'])
def get_patrol_status():
    """Get current patrol status"""
    return jsonify({
        'patrol_active': patrol_running,
        'current_waypoint_index': current_waypoint_index if patrol_running else None,
        'total_waypoints': len(patrol_waypoints) if patrol_waypoints else 0,
        'current_waypoint_name': patrol_waypoints[current_waypoint_index]['name'] if patrol_running and patrol_waypoints else None
    })


def handle_navigation_result(message):
    """Handle navigation result feedback"""
    try:
        status = message.get('status', {}).get('status', 0)

        # Status codes from actionlib
        # 3 = SUCCEEDED, 4 = ABORTED, 5 = REJECTED

        if status == 3:
            logger.info("✅ Navigation goal reached")
            socketio.emit('navigation_status', {
                'status': 'reached',
                'message': 'Goal reached successfully'
            })
        elif status == 4:
            logger.warning("⚠️ Navigation aborted")
            socketio.emit('navigation_status', {
                'status': 'aborted',
                'message': 'Navigation was aborted'
            })
        elif status == 5:
            logger.warning("⚠️ Navigation rejected")
            socketio.emit('navigation_status', {
                'status': 'rejected',
                'message': 'Navigation goal was rejected'
            })

    except Exception as e:
        logger.error(f"❌ Error processing navigation result: {e}")

@app.route('/api/logs', methods=['GET'])
def get_command_logs():
    """Get command history for monitoring"""
    try:
        limit = request.args.get('limit', 100, type=int)
        return jsonify({
            'logs': command_history[-limit:],
            'total': len(command_history)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/battery', methods=['GET'])
def get_battery_status():
    """Get battery status"""
    return jsonify(robot_state['battery'])


@app.route('/api/odometry', methods=['GET'])
def get_odometry():
    """Get odometry"""
    return jsonify(robot_state['odometry'])

# ============ WebSocket Events ============

@socketio.on('connect')
def handle_connect():
    """Client connected via WebSocket"""
    logger.info('Client connected via WebSocket')
    emit('connection_status', {
        'ros_connected': ros_connected,
        'timestamp': datetime.datetime.now(nz)
    })

@socketio.on('disconnect')
def handle_disconnect():
    """Client disconnected"""
    logger.info('Client disconnected')

@socketio.on('request_status')
def handle_status_request():
    """Client requests current status"""
    emit('status_update', {
        'battery': robot_state['battery'],
        'odometry': robot_state['odometry'],
        'velocity': robot_state['velocity'],
        'mode': robot_state['mode']
    })

# ============ Startup ============

def initialize():
    """Initialize application"""
    logger.info("Initializing TurtleBot2 Backend...")
    logger.info(f"Target Robot IP: {TURTLEBOT_IP}")
    logger.info("Backend ready. Waiting for connection request...")


# -------------------------- End Turtlebot Control code ------------------------

# -------------------------------  Start control multirobot code -----------------------

robot_manager = MultiRobotManager()


# ============ Robot Management Endpoints ============

@app.route('/api/robots', methods=['GET'])
def list_robots():
    """List all registered robots"""
    return jsonify({
        'robots': robot_manager.get_all_robots()
    })


@app.route('/api/robots/register', methods=['POST'])
def register_robots():
    """Register a new robot"""
    try:
        data = request.json
        config = RobotConfig(
            robot_id=data['robot_id'],
            robot_type=data.get('robot_type', 'custom'),
            ip_address=data['ip_address'],
            rosbridge_port=data.get('rosbridge_port', 9090),
            capabilities=data.get('capabilities', ['navigation', 'camera'])
        )

        success = robot_manager.register_robot(config)

        if success:
            return jsonify({
                'success': True,
                'message': f'Robot {config.robot_id} registered',
                'robot': {
                    'robot_id': config.robot_id,
                    'type': config.robot_type,
                    'ip': config.ip_address
                }
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Robot already registered'
            }), 400

    except Exception as e:
        logger.error(f"Error registering robot: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/robots/<robot_id>/connect', methods=['POST'])
def connect_robots(robot_id):
    """Connect to a specific robot"""
    try:
        success = robot_manager.connect_robots(robot_id)

        if success:
            # Emit connection status to all clients
            socketio.emit('robot_connected', {
                'robot_id': robot_id,
                'timestamp': datetime.datetime.now().isoformat()
            })

            return jsonify({
                'success': True,
                'message': f'Connected to {robot_id}'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to connect'
            }), 500

    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 404
    except Exception as e:
        logger.error(f"Error connecting to {robot_id}: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/robots/<robot_id>/disconnect', methods=['POST'])
def disconnect_robots(robot_id):
    """Disconnect from a specific robot"""
    try:
        robot_manager.disconnect_robot(robot_id)

        socketio.emit('robot_disconnected', {
            'robot_id': robot_id,
            'timestamp': datetime.datetime.now().isoformat()
        })

        return jsonify({
            'success': True,
            'message': f'Disconnected from {robot_id}'
        })

    except Exception as e:
        logger.error(f"Error disconnecting from {robot_id}: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/robots/<robot_id>/status', methods=['GET'])
def get_robots_status(robot_id):
    """Get status of a specific robot"""
    robot = robot_manager.get_robot(robot_id)

    if not robot:
        return jsonify({'error': 'Robot not found'}), 404

    return jsonify({
        'robot_id': robot_id,
        'connected': robot.connected,
        'type': robot.config.robot_type,
        'state': robot.state
    })


# ============ Control Endpoints (Robot-Specific) ============

@app.route('/api/robots/<robot_id>/move', methods=['POST'])
def move_robots(robot_id):
    """Move a specific robot"""
    try:
        robot = robot_manager.get_robot(robot_id)
        if not robot:
            return jsonify({'error': 'Robot not found'}), 404

        if not robot.connected:
            return jsonify({'error': 'Robot not connected'}), 503

        data = request.json
        linear = float(data.get('linear', 0))
        angular = float(data.get('angular', 0))

        robot.move(linear, angular)

        return jsonify({
            'success': True,
            'robot_id': robot_id,
            'linear': linear,
            'angular': angular
        })

    except Exception as e:
        logger.error(f"Error moving {robot_id}: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/robots/<robot_id>/stop', methods=['POST'])
def stop_robots(robot_id):
    """Stop a specific robot"""
    try:
        robot = robot_manager.get_robot(robot_id)
        if not robot:
            return jsonify({'error': 'Robot not found'}), 404

        robot.stop()

        return jsonify({
            'success': True,
            'robot_id': robot_id,
            'message': 'Robot stopped'
        })

    except Exception as e:
        logger.error(f"Error stopping {robot_id}: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/robots/<robot_id>/navigation/goal', methods=['POST'])
def send_navigation_goals(robot_id):
    """Send navigation goal to a specific robot"""
    try:
        robot = robot_manager.get_robot(robot_id)
        if not robot:
            return jsonify({'error': 'Robot not found'}), 404

        if not robot.connected:
            return jsonify({'error': 'Robot not connected'}), 503

        data = request.json
        position = data.get('position', {})
        orientation = data.get('orientation', {})

        robot.send_goal(position, orientation)

        return jsonify({
            'success': True,
            'robot_id': robot_id,
            'message': 'Navigation goal sent'
        })

    except Exception as e:
        logger.error(f"Error sending goal to {robot_id}: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/robots/<robot_id>/navigation/cancel', methods=['POST'])
def cancel_robots_navigation(robot_id):
    """Cancel navigation for a specific robot"""
    try:
        robot = robot_manager.get_robot(robot_id)
        if not robot:
            return jsonify({'error': 'Robot not found'}), 404

        robot.cancel_goal()

        return jsonify({
            'success': True,
            'robot_id': robot_id,
            'message': 'Navigation cancelled'
        })

    except Exception as e:
        logger.error(f"Error cancelling navigation for {robot_id}: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ============ WebSocket Events ============

@socketio.on('subscribe_robot')
def handle_subscribe_robot(data):
    """Client subscribes to specific robot updates"""
    robot_id = data.get('robot_id')
    logger.info(f"Client subscribed to {robot_id}")
    # Add client to robot-specific room
    from flask_socketio import join_room
    join_room(robot_id)


@socketio.on('unsubscribe_robot')
def handle_unsubscribe_robot(data):
    """Client unsubscribes from robot updates"""
    robot_id = data.get('robot_id')
    logger.info(f"Client unsubscribed from {robot_id}")
    from flask_socketio import leave_room
    leave_room(robot_id)


# Background task to emit robot status updates
def broadcast_robot_status():
    """Periodically broadcast robot status"""
    while True:
        for robot_id, robot_info in robot_manager.get_all_robots().items():
            if robot_info['connected']:
                socketio.emit(f'status_update', {
                    'robot_id': robot_id,
                    'state': robot_info['state']
                }, room=robot_id)

        socketio.sleep(1)  # Update every second


# Start background task
socketio.start_background_task(broadcast_robot_status)


# ======================== Control multirobot code end =====================


# --------------------------- Turtlebot controlling test code ---------------
#
# # --- CONFIGURATION ---
# # !!! CRITICAL: Change this to your ROS Laptop's IP Address !!!
# ROS_LAPTOP_IP = '10.74.33.238'
# ROS_BRIDGE_PORT = 9090
#
# # --- roslibpy Setup ---
# client = roslibpy.Ros(host=ROS_LAPTOP_IP, port=ROS_BRIDGE_PORT)
# cmd_vel_pub = None  # Will be initialized after connection
#
#
# def connect_to_ros():
#     """
#     Tries to connect to rosbridge and sets up the publisher.
#     """
#     global cmd_vel_pub
#     try:
#         print(f"Connecting to rosbridge at ws://{ROS_LAPTOP_IP}:{ROS_BRIDGE_PORT}...")
#         # .run() starts a background thread for connection.
#         client.run()
#
#         # Manually wait for connection to avoid 'wait_for_connection' attribute error
#         timeout = 10  # 10-second timeout
#         start_time = time.time()
#         while not client.is_connected and time.time() - start_time < timeout:
#             print("  Waiting for connection... ({}s)".format(int(time.time() - start_time)))
#             time.sleep(0.2)  # Wait 200ms before checking again
#
#         # Check if the connection was successful after the loop
#         if not client.is_connected:
#             raise roslibpy.core.RosTimeoutError("Manual connection timeout.")
#
#         print("Successfully connected to rosbridge.")
#
#         # Setup the publisher *after* connection is confirmed
#         cmd_vel_pub = roslibpy.Topic(client, '/cmd_vel', 'geometry_msgs/Twist')
#
#     except roslibpy.core.RosTimeoutError as e:
#         print(f"Connection to rosbridge timed out: {e}")
#         print("Please ensure:")
#         print(f"  1. rosbridge is running on {ROS_LAPTOP_IP}")
#         print("  2. The IP address is correct.")
#         print("  3. The machines are on the same network.")
#         client.terminate()  # Stop the connection thread
#         exit()  # Exit the Flask app
#     except AttributeError as e:
#         print(f"\n--- ERROR ---")
#         print(f"An AttributeError occurred: {e}")
#         print("This likely means your 'roslibpy' version is different from what was expected.")
#         print("The script will exit. Please check the code for compatibility.")
#         print(f"-------------\n")
#         client.terminate()
#         exit()
#     except Exception as e:
#         print(f"An error occurred during connection: {e}")
#         exit()
#
#
# # --- Control Logic ---
# def send_ros_command(direction):
#     """
#     Creates and publishes a roslibpy Message based on the direction.
#     """
#     if not client.is_connected or cmd_vel_pub is None:
#         print("ROS is not connected. Cannot send command.")
#         return False
#
#     # Create the message as a Python dictionary
#     linear = {'x': 0.0, 'y': 0.0, 'z': 0.0}
#     angular = {'x': 0.0, 'y': 0.0, 'z': 0.0}
#
#     if direction == 'forward':
#         linear['x'] = 0.2
#     elif direction == 'backward':
#         linear['x'] = -0.2
#     elif direction == 'left':
#         angular['z'] = 0.5
#     elif direction == 'right':
#         angular['z'] = -0.5
#     # 'stop' is handled by the default 0.0 values
#
#     # roslibpy uses dictionaries for messages
#     twist_msg_dict = {'linear': linear, 'angular': angular}
#
#     # Create a roslibpy Message and publish
#     try:
#         message = roslibpy.Message(twist_msg_dict)
#         cmd_vel_pub.publish(message)
#         print(f"Published command: {direction}")
#         return True
#     except Exception as e:
#         print(f"Failed to publish to /cmd_vel: {e}")
#         return False
#
#
# # --- API Endpoint ---
# @app.route('/control', methods=['POST'])
# def control_robot():
#     """
#     Flask endpoint to receive control commands from the web.
#     """
#     data = request.json
#     direction = data.get('direction')
#
#     if not direction:
#         return jsonify({"status": "error", "message": "No direction provided"}), 400
#
#     if direction not in ['forward', 'backward', 'left', 'right', 'stop']:
#         return jsonify({"status": "error", "message": "Invalid direction"}), 400
#
#     # Send the command to ROS
#     success = send_ros_command(direction)
#
#     if success:
#         return jsonify({"status": "success", "command": direction})
#     else:
#         return jsonify({"status": "error", "message": "Failed to publish ROS command"}), 500
#
# ======================================= turtlebot test code end =====================

# def generate_text(prompt):
#     """
#     Generate text using the LLM.
#     """
#     chain = LLMChain(llm=llm, prompt=PromptTemplate(template=prompt))
#     response = chain.run(prompt)
#     return response


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
    initialize()
    robot_manager.register_robot(RobotConfig(
        robot_id='turtlebot2_farm',
        robot_type='turtlebot2',
        ip_address='10.74.33.238',
        capabilities=['navigation', 'camera', 'patrol']
    ))
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)
