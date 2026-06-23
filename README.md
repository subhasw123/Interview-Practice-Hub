# Interview Practice Hub

An AI-powered interview preparation platform built with Flask that helps users practice technical interviews, analyze resumes, and receive personalized feedback.

## Features

### 🎯 Domain-Based Mock Tests

* Multiple technical domains
* Randomized questions
* Timed assessments
* Instant scoring

### 🤖 AI Interview Simulator

* Interactive chat-based interview experience
* HR and technical questions
* Real-time conversation flow
* Performance evaluation and feedback

### 📄 Resume Analyzer

* Upload PDF resumes
* ATS-style scoring
* Skill detection
* Missing skill recommendations
* Resume improvement suggestions

### 📊 Performance Tracking

* Quiz history
* Score tracking
* Progress monitoring

## Technologies Used

### Backend

* Python
* Flask

### Frontend

* HTML
* CSS
* JavaScript

### AI

* Ollama (Local LLM)
* Phi-3 Model

### Resume Processing

* pdfplumber

## Project Structure

```text
project/
│
├── app.py
├── question_bank.py
├── requirements.txt
│
├── templates/
│   ├── index.html
│   ├── quiz.html
│   ├── history.html
│   ├── resume.html
│   ├── interview.html
│   └── instructions.html
│
├── static/
│   ├── css/
│   ├── js/
│   └── images/
│
└── uploads/
```

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/interview-practice-hub.git
cd interview-practice-hub
```

### 2. Create Virtual Environment

```bash
python -m venv venv
```

Activate:

Windows

```bash
venv\Scripts\activate
```

Mac/Linux

```bash
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Run Application

```bash
python app.py
```

Application will start at:

```text
http://127.0.0.1:5000
```

## AI Interview Setup (Optional)

Install Ollama:

https://ollama.com

Download Phi-3 model:

```bash
ollama pull phi3
```

Run Ollama:

```bash
ollama serve
```

## Available Domains

* Python
* Java
* SQL
* DSA
* AI/ML
* MERN Stack

## Future Enhancements

* Voice-based interviews
* AI-generated dynamic questions
* Detailed answer evaluation
* Interview analytics dashboard
* User authentication
* Cloud deployment

