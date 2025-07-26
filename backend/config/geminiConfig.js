const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro-latest",
  systemInstruction: "Anda adalah ahli ekstraksi data faktur farmasi. Ekstrak data dari faktur dengan format JSON yang konsisten."
});

module.exports = model;