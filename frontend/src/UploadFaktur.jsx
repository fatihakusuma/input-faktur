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
    "ANUGRAH ARGON MEDIKA (AAM)", "ANUGRAH PHARMINDO LESTARI (APL)", // ...other suppliers
  ];

  const JENIS_FAKTUR = [
    "Harga Belum Termasuk Pajak",
    "Harga Sudah Termasuk Pajak",
    "Tidak Termasuk Pajak",
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
      // defaults & processing
      const now = new Date();
      data.tanggal_penerimaan = now.toISOString();
      data.no_faktur = data.no_faktur ? data.no_faktur.slice(-4) : "";
      data.jenis_pembayaran = /tempo/i.test(data.catatan || "") ? "Kredit" : "Tunai";
      data.jenis_faktur = data.jenis_faktur || "Harga Belum Termasuk Pajak";
      data.produk = data.produk.map(item => {
        // extract discount from name suffix ' DI x%'
        const match = item.nama.match(/ DI (\d+)%$/);
        const discount = match ? parseInt(match[1], 10) : 0;
        const cleanName = match ? item.nama.replace(/ DI \d+%$/, "") : item.nama;
        return {
          nama: cleanName,
          kuantitas: item.kuantitas || 1,
          harga_beli: item.harga_beli || 0,
          expired: item.expired || now.toISOString().split('T')[0],
          batch: item.batch || "-",
          pajak: "11%",
          diskon: discount,
        };
      });
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

  const handleSubmit = async (url) => {
    setSubmitStatus("Mengirim data...");
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedData),
      });
      if (!response.ok) throw new Error("Gagal submit");
      setSubmitStatus("✅ Berhasil submit ke " + url);
    } catch (err) {
      setSubmitStatus("❌ " + err.message);
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
          <CardContent>
            <select value={parsedData.supplier} onChange={(e)=>handleChange(e,'supplier')}>
              <option value="">Pilih Supplier</option>
              {SUPPLIERS.map((s,i)=><option key={i} value={s}>{s}</option>)}
            </select>
            <Input value={parsedData.no_faktur} onChange={(e)=>handleChange(e,'no_faktur')} placeholder="No. Faktur" />
            <Input type="date" value={parsedData.tanggal_faktur} onChange={(e)=>handleChange(e,'tanggal_faktur')} />
            <select value={parsedData.jenis_faktur} onChange={(e)=>handleChange(e,'jenis_faktur')}>
              {JENIS_FAKTUR.map((j,i)=><option key={i} value={j}>{j}</option>)}
            </select>
            <select value={parsedData.jenis_pembayaran} onChange={(e)=>handleChange(e,'jenis_pembayaran')}>
              {JENIS_PEMBAYARAN.map((j,i)=><option key={i} value={j}>{j}</option>)}
            </select>
            <div className="space-y-2 mt-4">
              {parsedData.produk.map((item,index)=>(
                <div key={index} className="border p-2 grid grid-cols-2 gap-2">
                  <Input value={item.nama} onChange={(e)=>handleChange(e,null,index,'nama')} placeholder="Nama Produk" />
                  <Input type="number" value={item.kuantitas} onChange={(e)=>handleChange(e,null,index,'kuantitas')} placeholder="Kuantitas" />
                  <Input type="number" value={item.harga_beli} onChange={(e)=>handleChange(e,null,index,'harga_beli')} placeholder="Harga Beli" />
                  <Input type="date" value={item.expired} onChange={(e)=>handleChange(e,null,index,'expired')} />
                  <Input value={item.batch} onChange={(e)=>handleChange(e,null,index,'batch')} placeholder="Batch" />
                  <Input value={item.pajak} disabled />
                  <Input type="number" value={item.diskon} onChange={(e)=>handleChange(e,null,index,'diskon')} placeholder="Diskon (%)" />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={()=>handleSubmit('https://azpyg.apotekdigital.id/purchase-invoice')}>Kirim ke Azpyg</Button>
              <Button onClick={()=>handleSubmit('https://admv1.apotekdigital.id/purchase-invoice')}>Kirim ke Admv1</Button>
            </div>
            {submitStatus && <p className="mt-2">{submitStatus}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
