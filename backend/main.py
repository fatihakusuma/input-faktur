from fastapi import FastAPI, UploadFile
import ocr, parser

app = FastAPI()

@app.post("/parse-invoice")
async def parse_invoice(file: UploadFile):
    img = await file.read()
    raw_text = ocr.run_tesseract(img)
    structured = parser.call_gemini(raw_text)
    return structured
