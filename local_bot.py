import ollama

# Define strict guidelines for your local AI agent
SYSTEM_INSTRUCTION = (
    "You are a strict, helpful customer support agent for our store. "
    "Our hours are Monday-Friday 9AM-6PM. We are closed on weekends. "
    "If the user asks questions completely unrelated to our store, store hours, "
    "or account support (like cooking, code, or generic trivia), politely decline "
    "to answer and redirect them back to our store features."
)

conversation_history = [
    {"role": "system", "content": SYSTEM_INSTRUCTION}
]

print("=============================================================")
print("          LOCAL OLLAMA AGENT ONLINE (Llama 3.2 3B)           ")
print("=============================================================")
print("Agent: Fully localized offline. Ask me anything!\n")

while True:
    user_input = input("You: ")
    if user_input.lower().strip() in ['exit', 'quit']:
        print("Agent: Goodbye!")
        break
        
    conversation_history.append({"role": "user", "content": user_input})
    
    try:
        # We changed the model string here to match your 'llama3.2:latest'
        response = ollama.chat(
            model='llama3.2:latest',
            messages=conversation_history
        )
        
        bot_reply = response['message']['content']
        print(f"\nAgent: {bot_reply}\n")
        
        conversation_history.append({"role": "assistant", "content": bot_reply})
        
    except Exception as e:
        print(f"\nAgent: [Error communicating with Ollama]: {e}\n")