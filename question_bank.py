import random

# Each domain has:
#   "intro"     → always Q1 (Tell me about yourself)
#   "hr"        → pool of HR questions (randomly pick from these)
#   "technical" → pool of technical questions (randomly pick from these)

QUESTION_POOL = {
    "python": {
        "intro": {"type": "hr", "question": "Tell me about yourself."},
        "hr": [
            {"type": "hr", "question": "Describe a challenging project you worked on."},
            {"type": "hr", "question": "Where do you see yourself in 5 years?"},
            {"type": "hr", "question": "How do you handle tight deadlines?"},
            {"type": "hr", "question": "Tell me about a time you had to learn something quickly."},
            {"type": "hr", "question": "How do you prioritize tasks when working on multiple projects?"},
            {"type": "hr", "question": "Describe a situation where you disagreed with a teammate and how you resolved it."},
            {"type": "hr", "question": "What motivates you to write clean, maintainable code?"},
        ],
        "technical": [
            {"type": "technical", "question": "What is the difference between a list and a tuple in Python?"},
            {"type": "technical", "question": "Explain decorators in Python with an example."},
            {"type": "technical", "question": "What are Python generators and when would you use them?"},
            {"type": "technical", "question": "How does Python's GIL affect multi-threaded programs?"},
            {"type": "technical", "question": "Explain the difference between *args and **kwargs."},
            {"type": "technical", "question": "What is list comprehension and how does it differ from map/filter?"},
            {"type": "technical", "question": "How do you manage dependencies in a Python project?"},
            {"type": "technical", "question": "What is the difference between shallow copy and deep copy?"},
            {"type": "technical", "question": "Explain how Python's garbage collection works."},
            {"type": "technical", "question": "What are context managers and how do you implement one?"},
        ],
    },
    "aiml": {
        "intro": {"type": "hr", "question": "Tell me about yourself."},
        "hr": [
            {"type": "hr", "question": "Why are you interested in the AI/ML field?"},
            {"type": "hr", "question": "Describe a project where you applied machine learning concepts."},
            {"type": "hr", "question": "How do you stay up to date with advancements in AI?"},
            {"type": "hr", "question": "Tell me about a failure in an ML project and what you learned."},
            {"type": "hr", "question": "How do you explain complex ML concepts to a non-technical audience?"},
            {"type": "hr", "question": "What datasets have you worked with and how did you handle them?"},
        ],
        "technical": [
            {"type": "technical", "question": "What is the difference between supervised and unsupervised learning?"},
            {"type": "technical", "question": "Explain overfitting and how you would prevent it."},
            {"type": "technical", "question": "What is gradient descent and how does it work?"},
            {"type": "technical", "question": "What is the bias-variance tradeoff?"},
            {"type": "technical", "question": "Explain the difference between bagging and boosting."},
            {"type": "technical", "question": "What is cross-validation and why is it important?"},
            {"type": "technical", "question": "Describe how a neural network learns during training."},
            {"type": "technical", "question": "What is the vanishing gradient problem and how can it be solved?"},
            {"type": "technical", "question": "Explain precision, recall, and F1-score."},
            {"type": "technical", "question": "What is the difference between a CNN and an RNN?"},
        ],
    },
    "dsa": {
        "intro": {"type": "hr", "question": "Tell me about yourself."},
        "hr": [
            {"type": "hr", "question": "How do you approach solving a problem you have never seen before?"},
            {"type": "hr", "question": "Tell me about a time you optimized a slow piece of code."},
            {"type": "hr", "question": "How do you handle pressure during a coding interview or hackathon?"},
            {"type": "hr", "question": "Describe a time when your solution failed and what you did next."},
            {"type": "hr", "question": "How do you decide between two algorithms that solve the same problem?"},
        ],
        "technical": [
            {"type": "technical", "question": "What is the difference between a stack and a queue? Give real-world examples."},
            {"type": "technical", "question": "Explain the time and space complexity of binary search."},
            {"type": "technical", "question": "What is dynamic programming? When would you use it over recursion?"},
            {"type": "technical", "question": "Explain the difference between BFS and DFS."},
            {"type": "technical", "question": "What is a hash table and how does it handle collisions?"},
            {"type": "technical", "question": "How does merge sort work? What is its time complexity?"},
            {"type": "technical", "question": "What is a balanced binary search tree and why is it useful?"},
            {"type": "technical", "question": "Explain Dijkstra's algorithm and when you would use it."},
            {"type": "technical", "question": "What is the sliding window technique and when should you use it?"},
            {"type": "technical", "question": "Explain the two-pointer technique with an example."},
        ],
    },
    "sql": {
        "intro": {"type": "hr", "question": "Tell me about yourself."},
        "hr": [
            {"type": "hr", "question": "Have you worked with databases in any of your projects? Walk me through it."},
            {"type": "hr", "question": "How do you ensure data integrity when writing database queries?"},
            {"type": "hr", "question": "Describe a time you had to debug a complex SQL query."},
            {"type": "hr", "question": "How do you collaborate with backend developers on database design?"},
            {"type": "hr", "question": "Have you ever worked with large datasets? How did you optimize queries?"},
        ],
        "technical": [
            {"type": "technical", "question": "What is the difference between INNER JOIN, LEFT JOIN, and RIGHT JOIN?"},
            {"type": "technical", "question": "What are indexes in SQL and how do they improve query performance?"},
            {"type": "technical", "question": "Explain the difference between WHERE and HAVING clauses."},
            {"type": "technical", "question": "What is normalization? Explain 1NF, 2NF, and 3NF."},
            {"type": "technical", "question": "What is a stored procedure and when would you use one?"},
            {"type": "technical", "question": "Explain the difference between DELETE, TRUNCATE, and DROP."},
            {"type": "technical", "question": "What are window functions in SQL? Give an example."},
            {"type": "technical", "question": "How does a subquery differ from a CTE (Common Table Expression)?"},
            {"type": "technical", "question": "What is an ACID transaction in databases?"},
            {"type": "technical", "question": "Explain query execution plans and how you use them to optimize SQL."},
        ],
    },
    "java": {
        "intro": {"type": "hr", "question": "Tell me about yourself."},
        "hr": [
            {"type": "hr", "question": "Why did you choose Java as one of your primary languages?"},
            {"type": "hr", "question": "Describe a situation where you debugged a complex Java application."},
            {"type": "hr", "question": "Tell me about a Java project you are most proud of."},
            {"type": "hr", "question": "How do you keep your Java skills up to date?"},
            {"type": "hr", "question": "Describe a time you had to refactor legacy Java code."},
        ],
        "technical": [
            {"type": "technical", "question": "What is the difference between an abstract class and an interface in Java?"},
            {"type": "technical", "question": "Explain the concept of multithreading and synchronization in Java."},
            {"type": "technical", "question": "What is the Java Collections Framework? Name some commonly used classes."},
            {"type": "technical", "question": "What is the difference between == and .equals() in Java?"},
            {"type": "technical", "question": "Explain Java's memory model: heap vs stack."},
            {"type": "technical", "question": "What are Java Streams and how do they work?"},
            {"type": "technical", "question": "What is the difference between checked and unchecked exceptions?"},
            {"type": "technical", "question": "Explain polymorphism in Java with an example."},
            {"type": "technical", "question": "What is the volatile keyword in Java and when do you use it?"},
            {"type": "technical", "question": "How does garbage collection work in the JVM?"},
        ],
    },
    "mern": {
        "intro": {"type": "hr", "question": "Tell me about yourself."},
        "hr": [
            {"type": "hr", "question": "Have you built any full-stack web applications? Describe one."},
            {"type": "hr", "question": "How do you handle version control and collaboration in a web development project?"},
            {"type": "hr", "question": "Describe a time you had to debug a critical production issue in a web app."},
            {"type": "hr", "question": "How do you approach performance optimization in a web application?"},
            {"type": "hr", "question": "Tell me about a feature you built end-to-end in a MERN project."},
        ],
        "technical": [
            {"type": "technical", "question": "What is the role of each component in the MERN stack?"},
            {"type": "technical", "question": "What is the virtual DOM in React and why is it important?"},
            {"type": "technical", "question": "How does REST API communication work between React and Express?"},
            {"type": "technical", "question": "What are React hooks? Explain useState and useEffect."},
            {"type": "technical", "question": "How does MongoDB store data differently from a relational database?"},
            {"type": "technical", "question": "What is middleware in Express.js and how do you use it?"},
            {"type": "technical", "question": "Explain the concept of JWT authentication in a MERN app."},
            {"type": "technical", "question": "What is the difference between controlled and uncontrolled components in React?"},
            {"type": "technical", "question": "How do you handle state management in a large React application?"},
            {"type": "technical", "question": "What is CORS and how do you handle it in an Express server?"},
        ],
    },
    "genai": {
        "intro": {"type": "hr", "question": "Tell me about yourself."},
        "hr": [
            {"type": "hr", "question": "Why are you interested in Generative AI?"},
            {"type": "hr", "question": "Describe a project where you used or explored Gen AI tools."},
            {"type": "hr", "question": "How do you keep up with the fast pace of AI advancements?"},
        ],
        "technical": [
            {"type": "technical", "question": "What is a Large Language Model (LLM) and how does it work at a high level?"},
            {"type": "technical", "question": "What is prompt engineering and why does it matter?"},
            {"type": "technical", "question": "Explain Retrieval-Augmented Generation (RAG) and its use cases."},
        ],
    },
}


def get_interview_questions(domain: str, num_hr: int = 2, num_tech: int = 2) -> list:
    """
    Returns a randomized list of interview questions for a domain.
    - Always starts with the intro question (Tell me about yourself)
    - Randomly picks `num_hr` HR questions and `num_tech` technical questions
    - Total = 1 + num_hr + num_tech (default: 5)
    """
    pool = QUESTION_POOL.get(domain.lower())
    if not pool:
        return []

    intro = pool["intro"]
    hr_questions = random.sample(pool["hr"], min(num_hr, len(pool["hr"])))
    tech_questions = random.sample(pool["technical"], min(num_tech, len(pool["technical"])))

    # Interleave: intro → hr1 → tech1 → hr2 → tech2
    questions = [intro]
    pairs = list(zip(hr_questions, tech_questions))
    for hr_q, tech_q in pairs:
        questions.append(hr_q)
        questions.append(tech_q)

    # If hr or tech has leftovers, append them
    for q in hr_questions[len(pairs):]:
        questions.append(q)
    for q in tech_questions[len(pairs):]:
        questions.append(q)

    return questions


# Legacy compatibility — static question bank (used by old code paths)
QUESTION_BANK = {
    domain: QUESTION_POOL[domain]["hr"][:1] + QUESTION_POOL[domain]["technical"][:2]
    for domain in QUESTION_POOL
}