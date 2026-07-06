import random
import json
import os
from datetime import datetime
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# 1. THE KNOWLEDGE BASE (Intents, Training Patterns, and Responses)
INTENT_DATA = {
    "greeting": {
        "patterns": ["hello", "hi there", "hey", "good morning", "is anyone there", "whats up", "namaste"],
        "responses": ["Hello! How can I help you today?", "Hey! Glad you reached out. What can I do for you?"]
    },
    "hours": {
        "patterns": ["what time do you open", "your operating hours", "when do you close", "are you open today", "timings"],
        "responses": ["We are open from 9 AM to 6 PM, Monday through Friday!"]
    },
    "support": {
        "patterns": ["i need help with my account", "can someone assist me", "broken link problem", "login is not working", "error code"],
        "responses": ["I can definitely help with that. Please describe the error message or issue in detail.", "Let's get that technical issue sorted out for you."]
    },
    "goodbye": {
        "patterns": ["bye", "see you later", "goodbye", "i am leaving", "quit", "close chat"],
        "responses": ["Goodbye! Have a great day!", "See ya! Take care."]
    }
}

# Friendly labels for the Tier 2 fallback clarifying system
INTENT_LABELS = {
    "greeting": "saying hello",
    "hours": "checking our company operating hours",
    "support": "resolving an account or technical support issue"
}

LOG_FILE = "unhandled_questions.json"

# 2. PRE-PROCESS & TRAIN THE MATHEMATICAL ENGINE
all_patterns = []
pattern_to_intent = []

for intent, data in INTENT_DATA.items():
    for pattern in data["patterns"]:
        all_patterns.append(pattern.lower())
        pattern_to_intent.append(intent)

# Initialize the vectorizer (removes filler words like 'and', 'the', 'is')
vectorizer = TfidfVectorizer(stop_words='english')
trained_vectors = vectorizer.fit_transform(all_patterns)

# 3. LOGGING SUBSYSTEM (For out-of-control questions)
def log_unhandled_question(question, score):
    """Saves out-of-bounds questions locally so you can review them."""
    log_entry = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "question": question,
        "highest_similarity_score": round(float(score), 4)
    }
    
    data = []
    if os.path.exists(LOG_FILE):
        try:
            with open(LOG_FILE, "r") as f:
                data = json.load(f)
        except json.JSONDecodeError:
            data = []

    data.append(log_entry)
    
    with open(LOG_FILE, "w") as f:
        json.dump(data, f, indent=4)

# 4. THE AGENT CORE LOGIC
def process_agent_response(user_text):
    clean_input = user_text.strip()
    
    # Guard clause for empty or very short entries
    if len(clean_input) < 3:
        return "Agent: Please type a complete phrase or sentence so I can map your request."

    # Convert user phrase into matching mathematical vectors
    user_vector = vectorizer.transform([clean_input.lower()])
    similarity_scores = cosine_similarity(user_vector, trained_vectors).flatten()
    
    best_match_idx = similarity_scores.argmax()
    highest_score = similarity_scores[best_match_idx]
    matched_intent = pattern_to_intent[best_match_idx]

    # --- TIERED FALLBACK ENGINE ---
    
    # Tier 3: Completely Out of Bounds
    if highest_score < 0.15:
        log_unhandled_question(clean_input, highest_score)
        return (
            "Agent: 🤖 I am a specialized agent trained to assist with account support and timings. "
            "That request appears to be outside my scope. (This query has been logged for my developer)."
        )
        
    # Tier 2: Weak Match / Needs Clarification
    elif highest_score < 0.35:
        guess_label = INTENT_LABELS.get(matched_intent, "assisting you")
        return (
            f"Agent: It sounds like you might be looking for help with *{guess_label}*.\n"
            f"       Could you rephrase your question with slightly more specific details?"
        )

    # Tier 1: Strong Match -> Clear Execution
    if matched_intent == "goodbye":
        return "EXIT_SIGNAL"
        
    return f"Agent: {random.choice(INTENT_DATA[matched_intent]['responses'])}"

# 5. CONSOLE INTERFACE ENGINE
if __name__ == "__main__":
    print("=============================================================")
    print("          LOCAL INTENT AGENT ONLINE (RAM: < 65MB)            ")
    print("=============================================================")
    print("Agent: Systems fully loaded. How can I help you today? (Type 'exit' to quit)\n")
    
    while True:
        try:
            user_input = input("You: ")
            if user_input.lower().strip() in ['exit', 'quit']:
                print("Agent: Goodbye!")
                break
                
            response = process_agent_response(user_input)
            
            if response == "EXIT_SIGNAL":
                print(f"Agent: {random.choice(INTENT_DATA['goodbye']['responses'])}")
                break
                
            print(response)
            
        except (KeyboardInterrupt, EOFError):
            print("\nAgent: Session safely terminated. Goodbye!")
            break