import requests
import json
from difflib import get_close_matches
from datetime import datetime

# Data referensi dropdown
SUPPLIER_OPTIONS = [
    "ANUGRAH ARGON MEDIKA (AAM)", "ANUGRAH PHARMINDO LESTARI (APL)", "apotek",
    "ASA MULIA", "BHARADAH SAKTI", "BSP( BINA SAN PRIMA)", "BUANA AGUNG ABIYAKSA (BAA)",
    "COMBI PUTERA MANDIRI (CPM)", "DLS", "ENSEVAL PUTRA MEGATRADING (EPM)", "gratia jaya farma",
    "IBOE", "KARYA PAK OLES", "KEBAYORAN", "Konsi", "lifree", "MENSA BINA SUKSES (MBS)",
    "MITRA ABADI SEJAHTERA (MAS)", "MITRA GLOBAL COVERINDO", "MITRA SEHATI SEKATA", "MULYA WIBAWA",
    "ngarang", "PARIT PADANG GLOBAL (PPG)", "PPKH", "RAJAWALI NUSINDO", "SABDA BADRANAYA", "SAPTA SARI",
    "sehat joyo makmur", "SUMBER AGUNG SANTOSA (SAS)", "SURYA ALPHA MEDIKA (SAM)", "Surya Prima Perkasa (SPP)",
    "SURYA SUCCES SEJATI (S3)", "tri intan jaya", "United Dico Citas (UDC)", "USD", "VICTORY"
]

JENIS_FAKTUR_OPTIONS = [
    "Harga Belum Termasuk Pajak", "Harga Sudah Termasuk Pajak", "Tidak Termasuk Pajak"
]

JENIS_PEMBAYARAN_OPTIONS = ["Tunai", "Kredit"]

UPLOAD_ENDPOINTS = {
    "azpyg": "https://azpyg.apotekdigital.id/purchase-invoice",
    "admv1": "https://admv1.apotekdigital.id/purchase-invoice"
}

def normalisasi_supplier(supplier):
    match = get_close_matches(supplier.upper(), SUPPLIER_OPTIONS, n=1, cutoff=0.6)
    return match[0] if match else supplier

def jenis_faktur(ppn):
    if ppn:
        return "Harga Sudah Termasuk Pajak"
    else:
        return "Tidak Termasuk Pajak"

def jenis_pembayaran(isi_tempo):
    return "Kredit" if isi_tempo else "Tunai"

def parse_batch(batch):
    return batch if batch else "-"

def parse_expired(exp):
    if not exp:
        return datetime.today().strftime("%Y-%m-%d")
    return exp

def parse_diskon_from_nama(nama):
    if " DI " in nama:
        parts = nama.split(" DI ")
        try:
            diskon = float(parts[1].replace("%", ""))
            return parts[0], diskon
        except:
            return nama, 0.0
    return nama, 0.0

def build_payload(data):
    produk_final = []
    for p in data.get("produk", []):
        nama, diskon_dari_nama = parse_diskon_from_nama(p.get("nama", ""))
        produk_final.append({
            "nama": nama,
            "kuantitas": p.get("kuantitas", 0),
            "harga_beli": p.get("harga_beli", 0),
            "expired": parse_expired(p.get("expired")),
            "batch": parse_batch(p.get("batch")),
            "pajak": 11,
            "diskon": p.get("diskon", diskon_dari_nama)
        })

    return {
        "tanggal_penerimaan": datetime.today().strftime("%Y-%m-%dT%H:%M:%S"),
        "supplier": normalisasi_supplier(data.get("supplier", "")),
        "no_faktur": data.get("no_faktur", "")[-4:],
        "tanggal_faktur": data.get("tanggal_faktur", datetime.today().strftime("%Y-%m-%d")),
        "jenis_faktur": jenis_faktur(data.get("ppn", False)),
        "jenis_pembayaran": jenis_pembayaran(data.get("tempo", False)),
        "produk": produk_final
    }

def upload_faktur(data, tujuan="azpyg"):
    payload = build_payload(data)
    endpoint = UPLOAD_ENDPOINTS.get(tujuan)

    print(f"Mengirim ke {endpoint}...")
    res = requests.post(endpoint, json=payload)

    if res.status_code == 200:
        print(f"✅ Faktur berhasil dikirim ke {tujuan}.")
    else:
        print(f"❌ Gagal mengirim ke {tujuan}: {res.status_code} - {res.text}")

# Contoh pemakaian manual
if __name__ == "__main__":
    with open("parsed_data.json", "r") as f:
        parsed = json.load(f)

    upload_faktur(parsed, "azpyg")
