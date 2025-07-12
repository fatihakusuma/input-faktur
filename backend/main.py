from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import os
import re
import fitz  # PyMuPDF
import google.generativeai as genai

app = Flask(__name__)
CORS(app)

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-pro-vision")

def extract_text_from_file(file):
    if file.filename.endswith(".pdf"):
        pdf = fitz.open(stream=file.read(), filetype="pdf")
        return "\n".join([page.get_text() for page in pdf])
    else:
        return ""  # For image handling, use model.generate_content([image]) directly

def detect_discount(nama):
    match = re.search(r"DI (\d{1,2})%", nama, re.IGNORECASE)
    if match:
        return int(match.group(1))
    return 0

@app.route("/parse-invoice", methods=["POST"])
def parse_invoice():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    now = datetime.now().strftime("%Y-%m-%d")

    try:
        if file.filename.endswith(".pdf"):
            text = extract_text_from_file(file)
            prompt = f"""
            Ekstrak data berikut dari faktur pembelian:
            - supplier (nama distributor)
            - no_faktur (cukup 4 digit terakhir saja)
            - tanggal_faktur (format yyyy-mm-dd)
            - produk (daftar barang): nama, kuantitas, harga_beli, expired, batch, pajak, diskon (jika ada)

            Aturan tambahan:
            - Jika tidak ada tanggal expired, isi dengan tanggal hari ini.
            - Jika tidak ada batch, isi dengan "-".
            - Anggap semua pajak 11% jika disebutkan ada PPN.
            - Jika nama produk mengandung 'DI xx%', ambil xx sebagai diskon.
            - Jika diskon punya kolom sendiri, masukkan juga.
            - Jenis_faktur: Harga Sudah Termasuk Pajak, Harga Belum Termasuk Pajak, atau Tidak Termasuk Pajak
            - Pembayaran: Tunai jika tidak ada kata 'tempo', Kredit jika ada

            Format output JSON:
            {{
              "supplier": "",
              "no_faktur": "",
              "tanggal_faktur": "",
              "jenis_faktur": "",
              "pembayaran": "",
              "produk": [
                {{"nama": "", "kuantitas": 0, "harga_beli": 0, "expired": "", "batch": "", "pajak": 11, "diskon": 0}},
                ...
              ]
            }}
            """
            response = model.generate_content([prompt, text])
            raw = response.text
            json_start = raw.find('{')
            json_str = raw[json_start:]
            result = eval(json_str)

            for item in result.get("produk", []):
                if not item.get("expired"):
                    item["expired"] = now
                if not item.get("batch"):
                    item["batch"] = "-"
                if "diskon" not in item:
                    item["diskon"] = detect_discount(item["nama"])
                item["pajak"] = 11

            return jsonify(result)

        else:
            return jsonify({"error": "Only PDF supported for now."}), 400

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
