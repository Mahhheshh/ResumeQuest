import os
from typing import Any

from dotenv import load_dotenv
from flask import Flask, jsonify, send_from_directory, request, redirect
import google.generativeai as genai

load_dotenv()

class Config:
    API_KEY = os.environ.get("GEMINI_API_KEY")
    ENVIRONMENT = os.environ.get("ENVIRONMENT", "DEV")
    API_PREFIX = "api/" if ENVIRONMENT == "PROD" else ""
    HOST = "0.0.0.0" if ENVIRONMENT == "PROD" else None
    PORT = "10000" if ENVIRONMENT == "PROD" else None # for render io
    
genai.configure(api_key=Config.API_KEY)
model = genai.GenerativeModel("gemini-1.5-flash")

INITIAL_HISTORY = [
    {
        "role": "user",
        "parts": "I am interviewing a candidate and would like help generating interview questions based on their resume. Here's their resume:",
    },
    {
        "role": "model",
        "parts": "Sure, I'd be happy to help. Please provide the resume, and I will assist with generating relevant questions."
    }
]

app = Flask(__name__)

if Config.ENVIRONMENT == "PROD":
    app = Flask(__name__, static_url_path="", static_folder="static")

@app.route("/", methods=["GET"])
def index() -> Any:
    if Config.ENVIRONMENT == "PROD":
        return send_from_directory(app.static_folder, "index.html")

    return redirect("/routes")

@app.route(f"/{Config.API_PREFIX}routes", methods=["GET"])
def root() -> Any:
    return jsonify({
        "routes": {
            "/api/generate": {
                "methods": ["POST"],
                "form_data": {
                    "resume": "string"
                }
            }
        }
    }), 200

@app.route(f"/{Config.API_PREFIX}generate", methods=["POST"])
def generate() -> Any:
    resume = request.form.get("resume")
    if not resume:
        return jsonify({"error": "provide resume"}), 400

    history = INITIAL_HISTORY + [
        {
            "role": "user",
            "parts": resume,
        },
        {
            "role": "model",
            "parts": "Thank you for providing the resume. I’ll now generate a set of interview questions tailored to the candidate's skills and experience."
        }
    ]

    try:
        chat = model.start_chat(history=history)

        mcq_msg = chat.send_message("Based on the candidate's resume, please generate 5 multiple-choice questions (MCQs) that assess their knowledge and experience in key areas.")
        short_answer_msg = chat.send_message("Create 5 short-answer questions that evaluate the candidate's understanding of their past projects, achievements, and overall expertise as outlined in their resume.")
        coding_msg = chat.send_message("Generate 5 coding questions that test the candidate's practical programming skills and problem-solving abilities, related to the technologies mentioned in their resume.")

        return jsonify([
            {
                "type": "mcq_questions",
                "description": mcq_msg.text
            },
            {
                "type": "short_answer_questions",
                "description": short_answer_msg.text
            },
            {
                "type": "coding_questions",
                "description": coding_msg.text
            }
        ])
    except Exception as e:
        app.logger.error(f"Error generating questions: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host=Config.HOST, port=Config.PORT)
