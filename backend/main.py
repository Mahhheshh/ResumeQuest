import os

from dotenv import load_dotenv
from flask import Flask, jsonify, request
import google.generativeai as genai

load_dotenv()
genai.configure(api_key=os.environ["GEMINI_API_KEY"])

app = Flask(__name__)
model = genai.GenerativeModel("gemini-1.5-flash")

initial_history = [
    {
        "role": "user",
        "parts": "I am interviewing a candidate and would like help generating interview questions based on their resume. Here's their resume:",
    },
    {
        "role": "model",
        "parts": "Sure, I'd be happy to help. Please provide the resume, and I will assist with generating relevant questions."
    }
]

@app.route("/", methods=["GET"])
def root():
    return jsonify({
        "routes": {
            "generate": {
                "methods": ["POST"],
                "form_data": {
                    "resume": "string"
                }
            }
        }
    }), 200

@app.route("/generate", methods=["POST"])
def generate():
    resume = request.form.get("resume", None)
    if resume is None:
        return jsonify({"error": "provide resume"}), 400

    history = [
        *initial_history,
        *[
            {
                "role": "user",
                "parts": resume,
            },
            {
                "role": "model",
                "parts": "Thank you for providing the resume. I’ll now generate a set of interview questions tailored to the candidate's skills and experience."
            }    
        ]
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
            {   "type": "short_answer_questions", 
                "description":short_answer_msg.text
            },
            {   "type":"coding_questions", 
                "description":coding_msg.text
            }
        ])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run()
