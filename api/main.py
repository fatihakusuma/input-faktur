from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import os, re
import fitz       # pip install PyMuPDF
import google.generativeai as genai  # pip install google-generativeai
import requests

app = Flask(__name__)
CORS(app)

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-pro-vision")

# — parse-invoice endpoint —
@app.route("/parse-invoice", methods=["POST"])
def parse_invoice():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file"}), 400

    now = datetime.now().strftime("%Y-%m-%d")
    # extract text
    pdf = fitz.open(stream=file.read(), filetype="pdf")
    text = "\n".join(page.get_text() for page in pdf)

    # ask Gemini to extract structured JSON
    prompt = f"""
Ekstrak data dari faktur:
- supplier
- no_faktur (4 digit terakhir)
- tanggal_faktur (YYYY-MM-DD)
- produk: [nama, kuantitas, harga_beli, expired, batch, pajak, diskon]
- jika \"DI xx%\" di nama → diskon=xx
- default pajak=11%
- default expired={now} jika kosong
- default batch=\"-\" jika kosong
- jenis_faktur: Harga Belum Termasuk Pajak / Harga Sudah Termasuk Pajak / Tidak Termasuk Pajak
- jenis_pembayaran: Tunai jika tidak ada kata \"tempo\", Kredit jika ada
Format JSON:
{{"supplier":"","no_faktur":"","tanggal_faktur":"","jenis_faktur":"","jenis_pembayaran":"","produk":[{{"nama":"","kuantitas":0,"harga_beli":0,"expired":"","batch":"","pajak":11,"diskon":0}},…]}}
Teks faktur:\n{text}
"""
    resp = model.generate_content([prompt])
    raw = resp.text
    obj = eval(raw[raw.find("{"):])  # quick parse; sanitize in prod!

    # post‑process defaults
    for item in obj["produk"]:
        if not item.get("expired"):
            item["expired"] = now
        if not item.get("batch"):
            item["batch"] = "-"
        if "diskon" not in item:
            m = re.search(r"DI (\d+)%", item["nama"])
            item["diskon"] = int(m.group(1)) if m else 0
        item["pajak"] = 11

    return jsonify(obj)

# — run automator endpoint —
@app.route("/run", methods=["POST"])
def run_automator():
    data = request.get_json()
    target = request.args.get("target")
    endpoints = {
        "azpyg": "https://azpyg.apotekdigital.id/purchase-invoice",
        "admv1": "https://admv1.apotekdigital.id/purchase-invoice",
    }
    url = endpoints.get(target)
    if not url:
        return jsonify({"error": "Invalid target"}), 400

    payload = data  # assumes front‑end already shaped data
    r = requests.post(url, json=payload)
    if r.ok:
        return jsonify({"status": "success", "target": target})
    return jsonify({"status": "error", "detail": r.text}), 500

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
