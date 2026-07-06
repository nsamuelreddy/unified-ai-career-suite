import os
from typing import List, Literal

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from google import genai
from google.genai import types


MODEL_NAME = "gemini-2.5-flash"

SYSTEM_INSTRUCTION = """
You are an expert Career Coach for a Unified AI Career Suite.

Your responsibilities:
- Help users build ATS-friendly resumes and tailored cover letters.
- Analyze resumes for clarity, impact, keyword alignment, and structure.
- Conduct realistic mock interviews with concise, actionable feedback.
- Recommend career paths, job search strategies, networking tactics, and salary negotiation guidance.
- Keep advice practical, specific, and tailored to the user's background, goals, and target role.

Behavior rules:
- Be direct, structured, and professional.
- Ask clarifying questions when needed, but do not over-ask.
- Prioritize measurable improvements over generic encouragement.
- Do not invent credentials, outcomes, or experience for the user.
- If the user asks for something outside career support, politely redirect back to career guidance.
""".strip()


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=12000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=12000)
    history: List[ChatMessage] = Field(default_factory=list)


class ChatResponse(BaseModel):
    response: str


class ResumeAnalysisRequest(BaseModel):
    resume_text: str = Field(min_length=50, max_length=50000)


class ResumeAnalysisResponse(BaseModel):
    score: int
    strengths: list[str]
    weaknesses: list[str]
    keywords_found: list[str]
    keywords_missing: list[str]
    recommendations: list[str]


api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise RuntimeError("GEMINI_API_KEY environment variable is required.")

client = genai.Client(api_key=api_key)

app = FastAPI(title="Unified AI Career Suite API", version="1.0.0")

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _to_content(message: ChatMessage) -> types.Content:
    role = "user" if message.role == "user" else "model"
    return types.Content(role=role, parts=[types.Part(text=message.content)])


def _extract_text(response: object) -> str:
    text = getattr(response, "text", None)
    if isinstance(text, str) and text.strip():
        return text.strip()

    candidates = getattr(response, "candidates", None) or []
    for candidate in candidates:
        content = getattr(candidate, "content", None)
        parts = getattr(content, "parts", None) or []
        chunks = []
        for part in parts:
            part_text = getattr(part, "text", None)
            if isinstance(part_text, str) and part_text:
                chunks.append(part_text)
        if chunks:
            joined = "".join(chunks).strip()
            if joined:
                return joined

    return ""


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/analyze-resume", response_model=ResumeAnalysisResponse)
def analyze_resume(payload: ResumeAnalysisRequest) -> ResumeAnalysisResponse:
    analysis_prompt = f"""Analyze this resume and provide structured feedback in JSON format:

{payload.resume_text}

Respond with ONLY valid JSON, no other text:
{{
  "score": <integer 0-100>,
  "strengths": [<list of 3-5 key strengths>],
  "weaknesses": [<list of 3-5 areas to improve>],
  "keywords_found": [<list of 5-10 relevant keywords present>],
  "keywords_missing": [<list of 5-10 important keywords to add>],
  "recommendations": [<list of 3-5 specific, actionable recommendations>]
}}

Be specific and professional. Analyze for ATS compatibility, clarity, impact, and keyword alignment."""

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[types.Content(
                role="user",
                parts=[types.Part(text=analysis_prompt)],
            )],
            config=types.GenerateContentConfig(
                system_instruction="You are an expert resume reviewer specializing in ATS optimization, keyword alignment, and impact. Always respond with valid JSON only.",
                temperature=0.3,
                max_output_tokens=2048,
            ),
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Analysis failed: {exc}") from exc

    text = _extract_text(response)
    if not text:
        raise HTTPException(status_code=502, detail="Resume analysis returned empty.")

    try:
        import json
        text = text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        
        data = json.loads(text)
        
        score = int(data.get("score", 75))
        score = max(0, min(100, score))
        
        strengths = data.get("strengths", [])
        if isinstance(strengths, list):
            strengths = [str(s).strip() for s in strengths if s][:5]
        else:
            strengths = [str(strengths).strip()]
        
        weaknesses = data.get("weaknesses", [])
        if isinstance(weaknesses, list):
            weaknesses = [str(w).strip() for w in weaknesses if w][:5]
        else:
            weaknesses = [str(weaknesses).strip()]
        
        keywords_found = data.get("keywords_found", [])
        if isinstance(keywords_found, list):
            keywords_found = [str(k).strip() for k in keywords_found if k][:10]
        else:
            keywords_found = [str(keywords_found).strip()] if keywords_found else []
        
        keywords_missing = data.get("keywords_missing", [])
        if isinstance(keywords_missing, list):
            keywords_missing = [str(m).strip() for m in keywords_missing if m][:10]
        else:
            keywords_missing = [str(keywords_missing).strip()] if keywords_missing else []
        
        recommendations = data.get("recommendations", [])
        if isinstance(recommendations, list):
            recommendations = [str(r).strip() for r in recommendations if r][:5]
        else:
            recommendations = [str(recommendations).strip()]
        
        return ResumeAnalysisResponse(
            score=score,
            strengths=strengths or ["Strong foundation"],
            weaknesses=weaknesses or ["Continue to improve"],
            keywords_found=keywords_found or [],
            keywords_missing=keywords_missing or [],
            recommendations=recommendations or ["Review and refine"],
        )
    except (json.JSONDecodeError, ValueError, KeyError) as e:
        raise HTTPException(status_code=502, detail=f"Failed to parse analysis: {str(e)}") from e


@app.post("/api/chat", response_model=ChatResponse)
def chat(payload: ChatRequest) -> ChatResponse:
    conversation = [_to_content(item) for item in payload.history]
    conversation.append(
        types.Content(
            role="user",
            parts=[types.Part(text=payload.message.strip())],
        )
    )

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=conversation,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                temperature=0.4,
                top_p=0.9,
                max_output_tokens=1024,
            ),
        )
    except Exception as exc:  # pragma: no cover - returned as API error
        raise HTTPException(status_code=502, detail=f"Gemini request failed: {exc}") from exc

    text = _extract_text(response)
    if not text:
        raise HTTPException(status_code=502, detail="Gemini returned an empty response.")

    return ChatResponse(response=text)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", "8000")), reload=True)