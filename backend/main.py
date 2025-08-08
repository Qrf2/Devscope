from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import pytesseract
from PIL import Image
import io
import openai

app = FastAPI()

# Allow your React Native app to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

openai.api_key = "sk-xxxxxxxxxxxxxxxxxxxxx"  # REPLACE with your key

@app.post("/chat")
async def chat(message: str = Form(...)):
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": message}]
    )
    return {"reply": response['choices'][0]['message']['content']}


@app.post("/image")
async def image(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))
    extracted_code = pytesseract.image_to_string(image)

    prompt = f"Explain this code:\n\n{extracted_code}"

    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    return {
        "reply": response['choices'][0]['message']['content'],
        "extracted_code": extracted_code
    }
