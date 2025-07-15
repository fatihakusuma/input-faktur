import React, { useState } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Card, CardContent } from "./components/ui/card";

const supplierOptions = [
  "ANUGRAH ARGON MEDIKA (AAM)", "ANUGRAH PHARMINDO LESTARI (APL)", "apotek", "ASA MULIA",
  "BHARADAH SAKTI", "BSP( BINA SAN PRIMA)", "BUANA AGUNG ABIYAKSA (BAA)", "COMBI PUTERA MANDIRI (CPM)",
  "DLS", "ENSEVAL PUTRA MEGATRADING (EPM)", "gratia jaya farma", "IBOE", "KARYA PAK OLES", "KEBAYORAN",
  "Konsi", "lifree", "MENSA BINA SUKSES (MBS)", "MITRA ABADI SEJAHTERA (MAS)", "MITRA GLOBAL COVERINDO",
  "MITRA SEHATI SEKATA", "MULYA WIBAWA", "ngarang", "PARIT PADANG GLOBAL (PPG)", "PPKH",
  "RAJAWALI NUSINDO", "SABDA BADRANAYA", "SAPTA SARI", "sehat joyo makmur", "SUMBER AGUNG SANTOSA (SAS)",
  "SURYA ALPHA MEDIKA (SAM)", "Surya Prima Perkasa (SPP)", "SURYA SUCCES SEJATI (S3)",
  "tri intan jaya", "United Dico Citas (UDC)", "USD", "VICTORY"
];

const jenisFakturOptions = [
  "Harga Belum Termasuk Pajak",
  "Harga Sudah Termasuk Pajak",
  "Tidak Termasuk Pajak"
];

const jenisPembayaranOptions = ["Tunai", "Kredit"];

export default function UploadFaktur() {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitStatus, setSubmitStatus] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setParsedData(null);
    setError(null);
    setSubmitStatus("");
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setSubmitStatus("");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("https://input-faktur-api.input-faktur.workers.dev/parse-invoice", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Gagal memproses faktur");
      const data = await response.json();
      setParsedData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e, field, index = null, subfield = null) => {
    const updated = { ...parsedData };
    if (index !== null && subfield) {
      updated.produk[index][subfield] = e.target.value;
    } else if (field) {
      updated[field] = e.target.value;
    }
    setParsedData(updated);
  };

  const handleSubmitTo = async (target) => {
    setSubmitStatus(`Mengirim ke ${target}...`);
    try {
      const response = await fetch(`https://${target}.apotekdigital.id/purchase-invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedData),
      });

      if (!response.ok) throw new Error("Gagal submit ke " + target);
      setSubmitStatus(`✅ Berhasil dikirim ke ${target}`);
    } catch (err) {
      setSubmitStatus(`❌ Gagal: ${err.message}`);
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Upload Faktur Pembelian</h1>

      <Input type="file" accept="application/pdf,image/*" onChange={handleFileChange} />
      <Button className="mt-2" onClick={handleUpload} disabled={loading}>
        {loading ? "Memproses..." : "Upload & Proses"}
      </Button>

      {error && <p className="text-red-500 mt-2">{error}</p>}

      {parsedData && (
        <Card className="mt-6">
          <CardContent className="space-y-4">
            <h2 className="text-xl font-semibold">Data Faktur (Dapat Diedit)</h2>

            <select
              className="w-full p-2 border rounded"
              value={parsedData.supplier || ""}
              onChange={(e) => handleChange(e, "supplier")}
            >
              <option value="">-- Pilih Supplier --</option>
              {supplierOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>

            <select
              className="w-full p-2 border rounded"
              value={parsedData.jenis_faktur || ""}
              onChange={(e) => handleChange(e, "jenis_faktur")}
            >
              <option value="">-- Jenis Faktur --</option>
              {jenisFakturOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>

            <select
              className="w-full p-2 border rounded"
              value={parsedData.jenis_pembayaran || ""}
              onChange={(e) => handleChange(e, "jenis_pembayaran")}
            >
              <option value="">-- Jenis Pembayaran --</option>
              {jenisPembayaranOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>

            <Input
              value={parsedData.no_faktur || ""}
              onChange={(e) => handleChange(e, "no_faktur")}
              placeholder="No. Faktur"
            />
            <Input
              value={parsedData.tanggal_faktur || ""}
              onChange={(e) => handleChange(e, "tanggal_faktur")}
              placeholder="Tanggal Faktur"
              type="date"
            />

            <div className="space-y-2">
              <h3 className="text-lg font-medium">Daftar Produk</h3>
              {parsedData.produk?.map((item, index) => (
                <div key={index} className="grid grid-cols-2 gap-2 border rounded p-2">
                  <Input
                    value={item.nama || ""}
                    onChange={(e) => handleChange(e, null, index, "nama")}
                    placeholder="Nama Produk"
                  />
                  <Input
                    value={item.kuantitas || ""}
                    onChange={(e) => handleChange(e, null, index, "kuantitas")}
                    placeholder="Kuantitas"
                    type="number"
                  />
                  <Input
                    value={item.harga_beli || ""}
                    onChange={(e) => handleChange(e, null, index, "harga_beli")}
                    placeholder="Harga Beli"
                    type="number"
                  />
                  <Input
                    value={item.diskon || ""}
                    onChange={(e) => handleChange(e, null, index, "diskon")}
                    placeholder="Diskon (%)"
                  />
                  <Input
                    value={item.expired || ""}
                    onChange={(e) => handleChange(e, null, index, "expired")}
                    placeholder="Expired Date"
                    type="date"
                  />
                  <Input
                    value={item.batch || ""}
                    onChange={(e) => handleChange(e, null, index, "batch")}
                    placeholder="Batch"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <Button className="mt-4" onClick={() => handleSubmitTo("azpyg")}>Submit ke Azpyg</Button>
              <Button className="mt-4" onClick={() => handleSubmitTo("admv1")}>Submit ke Admv1</Button>
            </div>

            {submitStatus && <p className="text-sm mt-2">{submitStatus}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
