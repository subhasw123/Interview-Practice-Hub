from flask import Flask, jsonify, redirect, render_template, request, session, url_for
from question_bank import QUESTION_BANK, get_interview_questions

from utils.question_loader import get_available_domains, get_random_questions
import pdfplumber
import re
import requests
import ollama

app = Flask(__name__)
app.secret_key = "interview_practice_secret"

SKILLS = [
    "python",
    "sql",
    "flask",
    "django",
    "tensorflow",
    "pytorch",
    "machine learning",
    "deep learning",
    "docker",
    "aws",
    "kubernetes",
    "pandas",
    "numpy",
    "scikit-learn"
]

CURRENT_QUIZ = None


@app.route("/")
@app.route("/index.html")
@app.route("/home.html")
def home():
    domains = get_available_domains()
    return render_template("home.html", domains=domains)


@app.route("/about.html")
def about():
    return render_template("about.html")

@app.route("/history")
@app.route("/history.html")
def history():
    return render_template("history.html")

@app.route("/resume")
def resume():
    return render_template("resume.html")


@app.route("/analyze_resume", methods=["POST"])
def analyze_resume():

    file = request.files.get("resume")

    if not file:
        return jsonify({
            "success": False,
            "message": "No file uploaded"
        })

    text = ""

    with pdfplumber.open(file) as pdf:
        for page in pdf.pages:
            text += page.extract_text() or ""

    text = text.lower()

    found_skills = []

    for skill in SKILLS:
        if skill.lower() in text:
            found_skills.append(skill)

    missing_skills = [
        skill for skill in SKILLS
        if skill not in found_skills
    ]

    score = int(
        (len(found_skills) / len(SKILLS)) * 100
    )

    recommendations = []

    if len(missing_skills) > 0:
        recommendations.append({
            "title": "Add Missing Skills",
            "body": f"Consider adding: {', '.join(missing_skills[:5])}"
        })

    recommendations.append({
        "title": "Quantify Achievements",
        "body": "Use measurable numbers in project and experience descriptions."
    })

    return jsonify({
        "success": True,
        "score": score,
        "role": "Software Engineer",
        "skillsFound": found_skills,
        "skillsMissing": missing_skills,
        "recommendations": recommendations,
        "sections": [
            {"name": "Contact Info", "ok": True},
            {"name": "Skills", "ok": True},
            {"name": "Projects", "ok": True},
            {"name": "Education", "ok": True}
        ]
    })

@app.route("/interview")
def interview():
    return render_template("interview.html")

@app.route("/api/interview/start", methods=["POST"])
def start_interview():

    data = request.get_json()

    domain = data["domain"].lower()

    if domain not in QUESTION_BANK:
        return jsonify({
            "error": f"Domain {domain} not found"
        }), 400

    # Randomly pick 2 HR + 2 technical questions, always starts with intro
    questions = get_interview_questions(domain, num_hr=2, num_tech=2)

    session["domain"] = domain
    session["current_question"] = 0
    session["scores"] = {
        "technical": [],
        "communication": [],
        "confidence": []
    }

    return jsonify({
        "success": True,
        "questions": questions
    })

@app.route("/api/interview/chat", methods=["POST"])
def interview_chat():

    data = request.get_json()

    answer = data["answer"]

    domain = session["domain"]

    q_index = session["current_question"]

    question = QUESTION_BANK[domain][q_index]

@app.route("/api/interview/evaluate", methods=["POST"])
def evaluate_interview_answer():

    data = request.get_json()

    question = data.get("question")
    answer = data.get("answer")
    domain = data.get("domain")

    prompt = f"""
You are a concise technical interviewer. Evaluate this answer briefly.

Domain: {domain}
Question: {question}
Candidate Answer: {answer}

Return ONLY valid JSON with scores (0-100) and a SHORT one-line feedback (max 10 words, like "Good answer!" or "Nice — could mention trade-offs.").

Example:
{{
    "technical": 85,
    "communication": 80,
    "confidence": 75,
    "feedback": "Good answer! Be more specific next time."
}}
"""

    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "phi3",
            "prompt": prompt,
            "stream": False
        }
    )

    ai_response = response.json()["response"]

    try:
        result = json.loads(ai_response)

    except:
        result = {
            "technical": 70,
            "communication": 70,
            "confidence": 70,
            "feedback": ai_response
        }

    return jsonify(result)


@app.route("/domain.html")
def domain_page():
    slug = request.args.get("slug", "").upper()

    if not slug:
        return redirect(url_for("home"))

    return render_template("instructions.html", domain=slug, slug=slug)


@app.route("/domain/<domain>")
def domain_instructions(domain):
    slug = domain.upper()
    return render_template("instructions.html", domain=slug, slug=slug)


@app.route("/quiz.html")
def quiz_page():
    slug = request.args.get("slug", "").upper()

    if not slug:
        return redirect(url_for("home"))

    return render_template("quiz.html", domain=slug, slug=slug)


@app.route("/quiz/<domain>")
def start_quiz(domain):
    global CURRENT_QUIZ

    slug = domain.upper()
    CURRENT_QUIZ = get_random_questions(slug, 50)

    session["domain"] = slug
    session["current_question"] = 0
    session["answers"] = {}

    return redirect(url_for("show_question"))


@app.route("/question")
def show_question():
    global CURRENT_QUIZ

    questions = CURRENT_QUIZ

    if not questions:
        return redirect(url_for("home"))

    current = session.get("current_question", 0)

    if current >= len(questions):
        return redirect(url_for("result"))

    question = questions[current]

    return render_template(
        "quiz.html",
        domain=session.get("domain", ""),
        slug=session.get("domain", ""),
        question=question,
        current=current,
        total=len(questions),
    )


@app.route("/answer", methods=["POST"])
def save_answer():
    action = request.form.get("action")
    answer = request.form.get("answer")
    current = session.get("current_question", 0)
    answers = session.get("answers", {})

    if action == "skip":
        answers[str(current)] = ""
    else:
        answers[str(current)] = answer if answer is not None else ""

    session["answers"] = answers
    session["current_question"] = current + 1

    return redirect(url_for("show_question"))


@app.route("/submit_quiz", methods=["GET", "POST"])
@app.route("/submit-quiz", methods=["GET", "POST"])
def submit_quiz():
    if request.method == "POST":
        answer = request.form.get("answer")
        current = session.get("current_question", 0)
        answers = session.get("answers", {})

        if answer is not None:
            answers[str(current)] = answer
        elif str(current) not in answers:
            answers[str(current)] = ""

        session["answers"] = answers

    return redirect(url_for("result"))


@app.route("/result")
@app.route("/result.html")
def result():
    global CURRENT_QUIZ

    questions = CURRENT_QUIZ

    if not questions:
        return render_template("result.html", score=0, total=0, accuracy=0, wrong_answers=[])

    answers = session.get("answers", {})
    wrong_answers = []
    score = 0

    for index, question in enumerate(questions):
        user_answer = answers.get(str(index), "") or ""
        correct_answer = question.get("answer", "") or ""

        if user_answer.strip().lower() == correct_answer.strip().lower():
            score += 1
        else:
            wrong_answers.append({
                "question": question.get("question", ""),
                "your_answer": user_answer if user_answer else "(Skipped)",
                "correct_answer": correct_answer,
                "explanation": question.get("explanation", ""),
            })

    total = len(questions)
    accuracy = int(score / total * 100) if total else 0

    return render_template(
        "result.html",
        score=score,
        total=total,
        accuracy=accuracy,
        wrong_answers=wrong_answers,
    )


@app.route("/api/domains")
def api_domains():
    domains = get_available_domains()
    return jsonify(domains)


@app.route("/api/questions")
def api_questions():
    slug = request.args.get("slug", "").upper()

    if not slug:
        return jsonify({"error": "Missing slug"}), 400

    try:
        questions = get_random_questions(slug, 50)
        formatted_questions = []

        for idx, q in enumerate(questions):
            formatted_q = {
                "id": q.get("id", str(idx + 1)),
                "type": q.get("type", "mcq"),
                "topic": q.get("topic", q.get("difficulty", "General")),
                "difficulty": q.get("difficulty", "medium").title(),
                "text": q.get("question", ""),
                "question": q.get("question", ""),
                "explanation": q.get("explanation", ""),
                "correct": q.get("answer", ""),
                "answer": q.get("answer", ""),
            }

            if q.get("type") == "mcq":
                formatted_q["options"] = q.get("options", [])

            formatted_questions.append(formatted_q)

        return jsonify(formatted_questions)

    except Exception as e:
        print(f"Error loading questions for slug {slug}: {e}")
        return jsonify({"error": "Questions not found"}), 404


if __name__ == "__main__":
    app.run(debug=True)