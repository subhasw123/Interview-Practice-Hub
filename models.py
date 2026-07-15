from database import db
from flask_login import UserMixin
from datetime import datetime, timezone

class User(UserMixin, db.Model):

    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)

    username = db.Column(
        db.String(100),
        nullable=False
    )

    email = db.Column(
        db.String(120),
        unique=True,
        nullable=False
    )

    password = db.Column(
        db.String(255),
        nullable=False
    )

    role = db.Column(
        db.String(20),
        nullable=False,
        default="user"
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

class Profile(db.Model):
    __tablename__ = "profiles"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    fullname = db.Column(db.String(120))
    phone = db.Column(db.String(30))
    city = db.Column(db.String(80))
    country = db.Column(db.String(80))
    college = db.Column(db.String(120))
    degree = db.Column(db.String(80))
    branch = db.Column(db.String(80))
    grad_year = db.Column(db.Integer)
    cgpa = db.Column(db.Float)
    target_role = db.Column(db.String(120))
    experience = db.Column(db.String(80))
    worktype = db.Column(db.String(80))
    pref_location = db.Column(db.String(120))
    about = db.Column(db.Text)
    skills = db.Column(db.Text)  # JSON list as string
    resume = db.Column(db.String(200))
    avatar = db.Column(db.String(200))
    social = db.Column(db.Text)  # JSON string
    certifications = db.Column(db.Text)  # JSON string
    languages = db.Column(db.Text)  # JSON string
    user = db.relationship('User', backref=db.backref('profile', uselist=False))

class QuizHistory(db.Model):
    __tablename__ = "quiz_history"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"))

    domain = db.Column(db.String(100))

    score = db.Column(db.Integer)

    total_questions = db.Column(db.Integer)

    percentage = db.Column(db.Float)

    completed_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    user = db.relationship("User", backref="quiz_history")

class InterviewHistory(db.Model):
    __tablename__ = "interview_history"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"))

    domain = db.Column(db.String(100))

    technical_score = db.Column(db.Float)

    communication_score = db.Column(db.Float)

    confidence_score = db.Column(db.Float)

    overall_score = db.Column(db.Float)

    feedback = db.Column(db.Text)

    completed_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    user = db.relationship("User", backref="interview_history")

class ResumeHistory(db.Model):
    __tablename__ = "resume_history"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"))

    filename = db.Column(db.String(255))

    score = db.Column(db.Float)

    uploaded_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    user = db.relationship("User", backref="resume_history")