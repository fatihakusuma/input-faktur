const { extractInvoiceData } = require('../services/geminiService');

exports.processInvoice = async (req, res) => {
  try {
    const { fileData, supplierOptions } = req.body;
    const extractedData = await extractInvoiceData(fileData, supplierOptions);
    res.json(extractedData);
  } catch (error) {
    console.error('Error processing invoice:', error);
    res.status(500).json({ error: error.message });
  }
};