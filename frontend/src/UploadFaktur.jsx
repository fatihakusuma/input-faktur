import React, { useState } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Card, CardContent } from "./components/ui/card";

export default function UploadFaktur() {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitStatus, setSubmitStatus] = useState("");

  const SUPPLIERS = [
    "ANUGRAH ARGON MEDIKA (AAM)", "ANUGRAH PHARMINDO LESTARI (APL)", "apotek",
    "ASA MULIA", "BHARADAH SAKTI", "BSP( BINA SAN PRIMA)", "BUANA AGUNG ABIYAKSA (BAA)",
    "COMBI PUTERA MANDIRI (CPM)", "DLS", "ENSEVAL PUTRA MEGATRADING (EPM)", "gratia jaya farma",
    "IBOE", "KARYA PAK OLES", "KEBAYORAN", "Konsi", "lifree", "MENSA BINA SUKSES (MBS)",
    "MITRA ABADI SEJAHTERA (MAS)", "MITRA GLOBAL COVERINDO", "MITRA SEHATI SEKATA",
    "MULYA WIBAWA", "ngarang", "PARIT PADANG GLOBAL (PPG)", "PPKH", "RAJAWALI NUSINDO",
    "SABDA BADRANAYA", "SAPTA SARI", "sehat joyo makmur", "SUMBER AGUNG SANTOSA (SAS)",
    "SURYA ALPHA MEDIKA (SAM)", "Surya Prima Perkasa (SPP)", "SURYA SUCCES SEJATI (S3)",
    "tri intan jaya", "United Dico Citas (UDC)", "USD", "VICTORY"
  ];

  const JENIS_FAKTUR = [
    "Harga Belum Termasuk Pajak",
    "Harga Sudah Termasuk Pajak",
    "Tidak Termasuk Pajak"
  ];

  const JENIS_PEMBAYARAN = ["Tunai", "Kredit"];

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

      const response = await fetch("https://your-backend-url/parse-invoice", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Gagal memproses faktur");
      const data = await response.json();

      const today = new Date().toISOString().split("T")[0];
      data.tanggal_penerimaan = new Date().toISOString();
      data.no_faktur = data.no_faktur?.slice(-4);
      data.jenis_pembayaran = /tempo/i.test(data.catatan || "") ? "Kredit" : "Tunai";

      if (data.produk) {
        data.produk = data.produk.map(item => ({
          ...item,
          expired: item.expired || today,
          batch: item.batch || "-"
        }));
      }

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

  const handleSubmitTo = async (url) => {
    setSubmitStatus("Mengirim data faktur...");
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedData),
      });

      if (!response.ok) throw new Error("Gagal submit faktur");
      setSubmitStatus("✅ Berhasil dikirim ke " + url);
    } catch (err) {
      setSubmitStatus(`❌ Gagal: ${err.message}`);
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Upload Faktur Pembelian</h1>

      <Input
        type="file"
        accept="application/pdf,image/*"
        onChange={handleFileChange}
      />
      <Button className="mt-2" onClick={handleUpload} disabled={loading}>
        {loading ? "Memproses..." : "Upload & Proses"}
      </Button>

      {error && <p className="text-red-500 mt-2">{error}</p>}

      {parsedData && (
        <Card className="mt-6">
          <CardContent className="space-y-4">
            <h2 className="text-xl font-semibold">Data Faktur</h2>

            <select
              className="w-full border p-2"
              value={parsedData.supplier || ""}
              onChange={(e) => handleChange(e, "supplier")}
            >
              <option value="">Pilih Supplier</option>
              {SUPPLIERS.map((s, i) => (
                <option key={i} value={s}>{s}</option>
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
              type="date"
              placeholder="Tanggal Faktur"
            />

            <select
              className="w-full border p-2"
              value={parsedData.jenis_faktur || ""}
              onChange={(e) => handleChange(e, "jenis_faktur")}
            >
              <option value="">Pilih Jenis Faktur</option>
              {JENIS_FAKTUR.map((j, i) => (
                <option key={i} value={j}>{j}</option>
              ))}
            </select>

            <select
              className="w-full border p-2"
              value={parsedData.jenis_pembayaran || ""}
              onChange={(e) => handleChange(e, "jenis_pembayaran")}
            >
              {JENIS_PEMBAYARAN.map((j, i) => (
                <option key={i} value={j}>{j}</option>
              ))}
            </select>

            <div className="space-y-2">
              <h3 className="text-lg font-medium">Produk</h3>
              {parsedData.produk?.map((item, index) => (
                <div key={index} className="grid grid-cols-2 gap-2 border p-2">
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
                    value={item.expired || ""}
                    onChange={(e) => handleChange(e, null, index, "expired")}
                    placeholder="Expired"
                    type="date"
                  />
                  <Input
                    value={item.batch || ""}
                    onChange={(e) => handleChange(e, null, index, "batch")}
                    placeholder="Batch"
                  />
                  <Input
                    value={item.pajak || ""}
                    onChange={(e) => handleChange(e, null, index, "pajak")}
                    placeholder="Pajak"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={() => handleSubmitTo("https://azpyg.apotekdigital.id/purchase-invoice")}>Kirim ke Azpyg</Button>
              <Button onClick={() => handleSubmitTo("https://admv1.apotekdigital.id/purchase-invoice")}>Kirim ke Admv1</Button>
            </div>
            {submitStatus && <p className="text-sm mt-2">{submitStatus}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
