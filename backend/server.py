from flask import Flask, request, jsonify
import fitz  # PyMuPDF
from gemini import extract_invoice_data

app = Flask(__name__)

@app.route("/parse-invoice", methods=["POST"])
def parse_invoice():
    if 'file' not in request.files:
        return jsonify({"error": "No file"}), 400
    file = request.files['file']
    pdf = fitz.open(stream=file.read(), filetype="pdf")
    text = ""
    for page in pdf:
        text += page.get_text()
    parsed = extract_invoice_data(text)
    return jsonify(parsed)

if __name__ == "__main__":
    app.run(debug=True)
