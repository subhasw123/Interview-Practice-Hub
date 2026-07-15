from flask import json
from flask import Flask, jsonify, redirect, render_template, request, session, url_for
from markupsafe import Markup
from sqlalchemy import text
from question_bank import QUESTION_BANK, get_interview_questions

from utils.question_loader import get_available_domains, get_random_questions, load_questions
import random
import pdfplumber
import re
import requests
import ollama
from datetime import datetime, timedelta, timezone
from werkzeug.security import generate_password_hash
from werkzeug.security import check_password_hash
from flask import request, redirect, url_for, flash
from database import db
from models import User, Profile, QuizHistory, InterviewHistory, ResumeHistory
import os
from werkzeug.utils import secure_filename
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from utils.admin import admin_required

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///users.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)

app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
   

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"
login_manager.login_message_category = "info"

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

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


def _build_line_chart_svg(labels, values):
    width, height = 320, 150
    padding = 24
    max_value = max(values) if values else 1
    if max_value <= 0:
        max_value = 1
    points = []
    for index, value in enumerate(values):
        x = padding + (index / max(len(values) - 1, 1)) * (width - padding * 2)
        y = height - padding - (value / max_value) * (height - padding * 2)
        points.append((x, y))

    path = " ".join(f"L{x:.1f},{y:.1f}" if i else f"M{x:.1f},{y:.1f}" for i, (x, y) in enumerate(points))
    area = f"{path} L{points[-1][0]:.1f},{height - padding} L{points[0][0]:.1f},{height - padding} Z"

    label_markup = "".join(
        f'<text x="{padding + (i / max(len(values) - 1, 1)) * (width - padding * 2):.1f}" y="{height - 6}" text-anchor="middle" fill="var(--muted)" font-size="10">{label}</text>'
        for i, label in enumerate(labels)
    )

    return f"""
    <svg viewBox="0 0 {width} {height}" width="100%" height="100%" preserveAspectRatio="none">
      <path d="{area}" fill="url(#lineArea)" />
      <path d="{path}" fill="none" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      {label_markup}
      <defs>
        <linearGradient id="lineArea" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#6366f1" stop-opacity="0.25" />
          <stop offset="100%" stop-color="#6366f1" stop-opacity="0" />
        </linearGradient>
      </defs>
    </svg>
    """


def _build_bar_chart_svg(labels, values):
    width, height = 320, 150
    padding = 24
    max_value = max(values) if values else 1
    if max_value <= 0:
        max_value = 1
    bar_width = max((width - padding * 2) / max(len(values), 1) * 0.6, 16)
    gap = (width - padding * 2) / max(len(values), 1)

    bars = []
    for index, (label, value) in enumerate(zip(labels, values)):
        x = padding + index * gap + (gap - bar_width) / 2
        bar_height = (value / max_value) * (height - padding * 2)
        y = height - padding - bar_height
        bars.append(
            f'<rect x="{x:.1f}" y="{y:.1f}" width="{bar_width:.1f}" height="{bar_height:.1f}" rx="6" fill="#6366f1"></rect>'
            f'<text x="{(x + bar_width / 2):.1f}" y="{height - 8}" text-anchor="middle" fill="var(--muted)" font-size="10">{label}</text>'
        )

    return f"""
    <svg viewBox="0 0 {width} {height}" width="100%" height="100%" preserveAspectRatio="none">
      {''.join(bars)}
    </svg>
    """


def _build_pie_chart_svg(labels, values):
    width, height = 320, 160
    radius = 46
    center_x = 96
    center_y = 80
    total = sum(values) or 1
    start_angle = -90
    segments = []
    colors = ["#6366f1", "#8b5cf6", "#f59e0b"]

    for index, (label, value) in enumerate(zip(labels, values)):
        angle = (value / total) * 360
        end_angle = start_angle + angle
        x1 = center_x + radius * __import__('math').cos(__import__('math').radians(start_angle))
        y1 = center_y + radius * __import__('math').sin(__import__('math').radians(start_angle))
        x2 = center_x + radius * __import__('math').cos(__import__('math').radians(end_angle))
        y2 = center_y + radius * __import__('math').sin(__import__('math').radians(end_angle))
        segments.append(
            f'<path d="M{center_x},{center_y} L{x1:.1f},{y1:.1f} A{radius},{radius} 0 0 1 {x2:.1f},{y2:.1f} Z" fill="{colors[index % len(colors)]}" opacity="0.9"></path>'
        )
        start_angle = end_angle

    legend = "".join(
        f'<g><rect x="{center_x + 110}" y="{30 + i * 20}" width="10" height="10" rx="3" fill="{colors[i % len(colors)]}"></rect><text x="{center_x + 125}" y="{38 + i * 20}" fill="var(--muted)" font-size="11">{label}</text></g>'
        for i, label in enumerate(labels)
    )

    return f"""
    <svg viewBox="0 0 {width} {height}" width="100%" height="100%" preserveAspectRatio="none">
      {''.join(segments)}
      <circle cx="{center_x}" cy="{center_y}" r="24" fill="var(--surface)"></circle>
      <text x="{center_x}" y="{center_y - 4}" text-anchor="middle" font-size="16" font-weight="700" fill="var(--color-text-primary)">{total}</text>
      <text x="{center_x}" y="{center_y + 12}" text-anchor="middle" font-size="10" fill="var(--muted)">sessions</text>
      {legend}
    </svg>
    """


def _build_area_chart_svg(labels, values):
    width, height = 320, 150
    padding = 24
    max_value = max(values) if values else 1
    if max_value <= 0:
        max_value = 1
    points = []
    for index, value in enumerate(values):
        x = padding + (index / max(len(values) - 1, 1)) * (width - padding * 2)
        y = height - padding - (value / max_value) * (height - padding * 2)
        points.append((x, y))

    path = " ".join(f"L{x:.1f},{y:.1f}" if i else f"M{x:.1f},{y:.1f}" for i, (x, y) in enumerate(points))
    area = f"{path} L{points[-1][0]:.1f},{height - padding} L{points[0][0]:.1f},{height - padding} Z"

    label_markup = "".join(
        f'<text x="{padding + (i / max(len(values) - 1, 1)) * (width - padding * 2):.1f}" y="{height - 6}" text-anchor="middle" fill="var(--muted)" font-size="10">{label}</text>'
        for i, label in enumerate(labels)
    )

    return f"""
    <svg viewBox="0 0 {width} {height}" width="100%" height="100%" preserveAspectRatio="none">
      <path d="{area}" fill="url(#areaGrad)" />
      <path d="{path}" fill="none" stroke="#8b5cf6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      {label_markup}
      <defs>
        <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.25" />
          <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0" />
        </linearGradient>
      </defs>
    </svg>
    """


@app.route("/")
def index():
    from flask import make_response
    if current_user.is_authenticated:
        response = make_response(redirect(url_for('home')))
    else:
        response = make_response(redirect(url_for('register')))
    
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@app.route("/api/user")
def api_user():
    if current_user.is_authenticated:
        return jsonify({"username": current_user.username})
    return jsonify({"username": None})

@app.route("/index.html")
@app.route("/home.html")
@app.route("/home")
@login_required
def home():
    user = current_user if current_user.is_authenticated else None
        
    domains = get_available_domains()
    return render_template("home.html", domains=domains, user=user)


@app.route("/about.html")
def about():
    return render_template("about.html")

@app.route("/history")
@app.route("/history.html")
@app.route("/dashboard")
@login_required
def history():
    return render_template("history.html")


@app.route("/resume")
@login_required
def resume():
    return render_template("resume.html")

@app.route("/profile")
@login_required
def profile():
    return render_template("profile.html", user=current_user)

# -------- Profile API Endpoints --------
from models import Profile

UPLOAD_FOLDER = os.path.join(app.root_path, 'static', 'uploads')
RESUME_FOLDER = os.path.join(UPLOAD_FOLDER, 'resumes')
AVATAR_FOLDER = os.path.join(UPLOAD_FOLDER, 'avatars')
ALLOWED_RESUME_EXTS = {'pdf', 'docx'}
ALLOWED_AVATAR_EXTS = {'png', 'jpg', 'jpeg', 'gif'}

# Ensure upload directories exist
for folder in [RESUME_FOLDER, AVATAR_FOLDER]:
    os.makedirs(folder, exist_ok=True)

def allowed_file(filename, allowed_set):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_set

@app.route('/api/profile', methods=['GET'])
@login_required
def get_profile():
    profile = Profile.query.filter_by(user_id=current_user.id).first()
    if not profile:
        # Return empty profile structure
        return jsonify({
            'fullname': '', 'phone': '', 'city': '', 'country': '', 'college': '',
            'degree': '', 'branch': '', 'grad_year': '', 'cgpa': '', 'target_role': '',
            'experience': '', 'worktype': '', 'pref_location': '', 'about': '',
            'skills': [], 'resume': '', 'avatar': '', 'social': {}, 'certifications': [],
            'languages': []
        })
    # Convert JSON text fields to Python objects if needed
    import json as _json
    return jsonify({
        'fullname': profile.fullname,
        'phone': profile.phone,
        'city': profile.city,
        'country': profile.country,
        'college': profile.college,
        'degree': profile.degree,
        'branch': profile.branch,
        'grad_year': profile.grad_year,
        'cgpa': profile.cgpa,
        'target_role': profile.target_role,
        'experience': profile.experience,
        'worktype': profile.worktype,
        'pref_location': profile.pref_location,
        'about': profile.about,
        'skills': _json.loads(profile.skills) if profile.skills else [],
        'resume': profile.resume,
        'avatar': profile.avatar,
        'social': _json.loads(profile.social) if profile.social else {},
        'certifications': _json.loads(profile.certifications) if profile.certifications else [],
        'languages': _json.loads(profile.languages) if profile.languages else []
    })

@app.route('/api/profile', methods=['POST'])
@login_required
def save_profile():
    import json as _json
    try:
        data = request.get_json(force=True)
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        profile = Profile.query.filter_by(user_id=current_user.id).first()
        if not profile:
            profile = Profile(user_id=current_user.id)
            db.session.add(profile)

        str_fields = ['fullname', 'phone', 'city', 'country', 'college', 'degree', 'branch',
                      'target_role', 'experience', 'worktype', 'pref_location', 'about']
        json_fields = ['skills', 'social', 'certifications', 'languages']

        for field in str_fields:
            if field in data:
                setattr(profile, field, data[field] or None)

        # Type-safe conversions
        if 'grad_year' in data:
            try:
                profile.grad_year = int(data['grad_year']) if data['grad_year'] else None
            except (ValueError, TypeError):
                profile.grad_year = None
        if 'cgpa' in data:
            try:
                profile.cgpa = float(data['cgpa']) if data['cgpa'] else None
            except (ValueError, TypeError):
                profile.cgpa = None

        for field in json_fields:
            if field in data:
                setattr(profile, field, _json.dumps(data[field]))

        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/profile/resume', methods=['POST'])
@login_required
def upload_resume():
    if 'resume' not in request.files:
        return jsonify({'success': False, 'message': 'No file part'}), 400
    file = request.files['resume']
    if file.filename == '' or not allowed_file(file.filename, ALLOWED_RESUME_EXTS):
        return jsonify({'success': False, 'message': 'Invalid file'}), 400
    filename = secure_filename(file.filename)
    filepath = os.path.join(RESUME_FOLDER, filename)
    file.save(filepath)
    profile = Profile.query.filter_by(user_id=current_user.id).first()
    if not profile:
        profile = Profile(user_id=current_user.id)
        db.session.add(profile)
    profile.resume = f'uploads/resumes/{filename}'
    db.session.commit()
    flash('Resume uploaded', 'success')
    return jsonify({'success': True, 'filename': filename})

@app.route('/api/profile/avatar', methods=['POST'])
@login_required
def upload_avatar():
    if 'avatar' not in request.files:
        return jsonify({'success': False, 'message': 'No file part'}), 400
    file = request.files['avatar']
    if file.filename == '' or not allowed_file(file.filename, ALLOWED_AVATAR_EXTS):
        return jsonify({'success': False, 'message': 'Invalid file'}), 400
    filename = secure_filename(file.filename)
    filepath = os.path.join(AVATAR_FOLDER, filename)
    file.save(filepath)
    profile = Profile.query.filter_by(user_id=current_user.id).first()
    if not profile:
        profile = Profile(user_id=current_user.id)
        db.session.add(profile)
    profile.avatar = f'uploads/avatars/{filename}'
    db.session.commit()
    flash('Profile picture uploaded', 'success')
    return jsonify({'success': True, 'filename': filename})



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
@login_required
def interview():
    return render_template("interview.html")

@app.route("/api/interview/start", methods=["POST"])
def start_interview():

    data = request.get_json()

    domain = data["domain"].lower()

    if domain in QUESTION_BANK:
        questions = get_interview_questions(domain, num_hr=2, num_tech=2)
    else:
        try:
            all_questions = load_questions(domain)
            sample = random.sample(all_questions, min(5, len(all_questions)))
            questions = [
                {
                    "type": q.get("type", "technical"),
                    "question": q.get("question", q.get("text", ""))
                }
                for q in sample
            ]
        except Exception:
            return jsonify({
                "error": f"Domain {domain} not found"
            }), 400

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

@app.route("/register", methods=["GET", "POST"])
def register():

    if request.method == "GET":
        return render_template("register.html")

    username = request.form.get("username")
    email = request.form.get("email")
    password = request.form.get("password")
    confirm_password = request.form.get("confirm_password")

    # Basic Validation
    if not username or not email or not password:
        flash("Please fill all fields.", "danger")
        return redirect(url_for("register"))

    if password != confirm_password:
        flash("Passwords do not match.", "danger")
        return redirect(url_for("register"))

    # Check existing email
    existing_user = User.query.filter_by(email=email).first()

    if existing_user:
        flash("Email already registered.", "warning")
        return redirect(url_for("register"))

    # Hash Password
    hashed_password = generate_password_hash(password)

    user = User(
        username=username,
        email=email,
        password=hashed_password,
        role="user"
    )

    db.session.add(user)
    db.session.commit()

    # Automatically log the user in
    login_user(user)
    flash("Registration Successful!", "success")

    return redirect(url_for("home"))

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "GET":
        return render_template("login.html")

    email = request.form.get("email")
    password = request.form.get("password")

    user = User.query.filter_by(email=email).first()

    if user and check_password_hash(user.password, password):
        login_user(user)
        if user.role == "admin":
            return redirect(url_for("admin_dashboard"))
        else:
            return redirect(url_for("home"))
    else:
        flash("Invalid email or password.", "danger")
        return redirect(url_for("login"))

@app.route("/logout")
@login_required
def logout():
    logout_user()
    flash("You have been logged out.", "success")
    return redirect(url_for("login"))

@app.route("/admin")
@login_required
@admin_required
def admin_dashboard():

    total_users = User.query.count()
    total_profiles = Profile.query.count()
    total_domains = len(QUESTION_BANK)
    total_quizzes = QuizHistory.query.count()
    total_interviews = InterviewHistory.query.count()
    total_resumes = ResumeHistory.query.count()

    users = User.query.filter(User.created_at.isnot(None)).all()
    signup_series = [0] * 12
    current_date = datetime.now(timezone.utc)
    for user in users:
        if not user.created_at:
            continue
        month_offset = (current_date.year - user.created_at.year) * 12 + (current_date.month - user.created_at.month)
        if 0 <= month_offset < 12:
            signup_series[11 - month_offset] += 1

    month_labels = []
    for index in range(11, -1, -1):
        month_date = current_date.replace(day=1) - timedelta(days=30 * index)
        month_labels.append(month_date.strftime('%b'))

    domain_rows = db.session.query(QuizHistory.domain, db.func.count(QuizHistory.id)).filter(QuizHistory.domain.isnot(None)).group_by(QuizHistory.domain).order_by(db.func.count(QuizHistory.id).desc()).all()
    domain_labels = [row[0] for row in domain_rows[:6]]
    domain_values = [row[1] for row in domain_rows[:6]]
    if not domain_labels:
        domain_labels = ['Python', 'SQL', 'DSA', 'ML', 'Java', 'MERN']
        domain_values = [max(1, total_quizzes), max(1, total_quizzes // 2), max(1, total_quizzes // 3), 3, 2, 1]

    activity_labels = ['Quizzes', 'AI Interviews', 'Resume']
    activity_values = [total_quizzes, total_interviews, total_resumes]

    weekly_labels = []
    weekly_values = []
    for offset in range(6, -1, -1):
        day = (current_date.date() - timedelta(days=offset))
        start = datetime(day.year, day.month, day.day, tzinfo=timezone.utc)
        end = start + timedelta(days=1)
        quiz_count = QuizHistory.query.filter(QuizHistory.completed_at >= start, QuizHistory.completed_at < end).count()
        interview_count = InterviewHistory.query.filter(InterviewHistory.completed_at >= start, InterviewHistory.completed_at < end).count()
        resume_count = ResumeHistory.query.filter(ResumeHistory.uploaded_at >= start, ResumeHistory.uploaded_at < end).count()
        weekly_labels.append(day.strftime('%a'))
        weekly_values.append(quiz_count + interview_count + resume_count)

    line_chart_svg = Markup(_build_line_chart_svg(month_labels, signup_series))
    bar_chart_svg = Markup(_build_bar_chart_svg(domain_labels, domain_values))
    pie_chart_svg = Markup(_build_pie_chart_svg(activity_labels, activity_values))
    area_chart_svg = Markup(_build_area_chart_svg(weekly_labels, weekly_values))

    return render_template(
        "admin/dashboard.html",
        total_users=total_users,
        total_profiles=total_profiles,
        total_domains=total_domains,
        total_quizzes=total_quizzes,
        total_interviews=total_interviews,
        total_resumes=total_resumes,
        line_chart_svg=line_chart_svg,
        bar_chart_svg=bar_chart_svg,
        pie_chart_svg=pie_chart_svg,
        area_chart_svg=area_chart_svg,
    )

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

with app.app_context():
    db.create_all()

    inspector = db.inspect(db.engine)
    if 'users' in inspector.get_table_names():
        columns = [column['name'] for column in inspector.get_columns('users')]
        if 'role' not in columns:
            db.session.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user'"))
            db.session.commit()
        else:
            db.session.execute(text("UPDATE users SET role = 'user' WHERE role IS NULL OR role = ''"))
            db.session.commit()

        if 'created_at' not in columns:
            db.session.execute(text("ALTER TABLE users ADD COLUMN created_at DATETIME"))
            db.session.commit()
            db.session.execute(text("UPDATE users SET created_at = datetime('now') WHERE created_at IS NULL"))
            db.session.commit()

if __name__ == "__main__":
    app.run(debug=True)