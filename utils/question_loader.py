import json
import random
import os


QUESTION_BANK_PATH = "question_bank"


def _find_domain_file(domain):
    requested = domain.lower()

    for filename in os.listdir(QUESTION_BANK_PATH):
        if filename.lower() == f"{requested}.json":
            return os.path.join(QUESTION_BANK_PATH, filename)

    raise FileNotFoundError(
        f"Question file not found: {requested}.json"
    )


def load_questions(domain):
    """
    Load all questions for a given domain.
    """

    file_path = _find_domain_file(domain)

    with open(file_path, "r", encoding="utf-8") as file:
        questions = json.load(file)

    return questions


def get_random_questions(domain, num_questions=50):
    """
    Return random questions from domain.
    """

    questions = load_questions(domain)

    if len(questions) < num_questions:
        raise ValueError(
            f"Only {len(questions)} questions available."
        )

    return random.sample(
        questions,
        num_questions
    )

def get_available_domains():
    domains = []

    for file in os.listdir(QUESTION_BANK_PATH):
        if file.endswith(".json"):
            domains.append(
                file.replace(".json", "")
            )

    return sorted(domains)