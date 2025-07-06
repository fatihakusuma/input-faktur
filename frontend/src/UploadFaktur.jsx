import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

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

      const response = await fetch("https://your-backend-url/parse-invoice", {
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

  const handleSubmitToApotek = async () => {
    setSubmitStatus("Mengirim ke ApotekDigital...");
    try {
      const response = await fetch("https://your-automator-url/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedData),
      });

      if (!response.ok) throw new Error("Gagal submit ke ApotekDigital");
      setSubmitStatus("✅ Berhasil dikirim ke ApotekDigital!");
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
      <Button
        className="mt-2"
        onClick={handleUpload}
        disabled={loading}
      >
        {loading ? "Memproses..." : "Upload & Proses"}
      </Button>

      {error && <p className="text-red-500 mt-2">{error}</p>}

      {parsedData && (
        <Card className="mt-6">
          <CardContent className="space-y-4">
            <h2 className="text-xl font-semibold">Data Faktur (Dapat Diedit)</h2>

            <Input
              value={parsedData.supplier || ""}
              onChange={(e) => handleChange(e, "supplier")}
              placeholder="Supplier"
            />
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
                <div
                  key={index}
                  className="grid grid-cols-2 gap-2 border rounded p-2"
                >
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
                    placeholder="Expired Date"
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

            <Button
              className="mt-4"
              onClick={handleSubmitToApotek}
            >
              Submit ke ApotekDigital
            </Button>
            {submitStatus && (
              <p className="text-sm mt-2">{submitStatus}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
