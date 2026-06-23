import sys
import os

sys.path.append(
    os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            ".."
        )
    )
)

from utils.question_loader import (
    load_questions,
    get_random_questions
)

questions = load_questions("python")

print(f"Total Questions: {len(questions)}")

quiz_questions = get_random_questions(
    "python",
    50
)

print(f"Selected: {len(quiz_questions)}")

print("\nFirst Question:\n")
print(quiz_questions[0])

from utils.question_loader import (
    load_questions,
    get_random_questions,
    get_available_domains
)

print("Available Domains:")
print(get_available_domains())