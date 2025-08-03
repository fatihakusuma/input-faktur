const { submitToApotekDigital } = require('../services/puppeteerService');
const { calculatePriceChanges } = require('../services/priceService');
const { getPreviousPrices } = require('../utils/helpers');

exports.submitInvoice = async (req, res) => {
  try {
    const invoiceData = req.body;
    const processedData = {
      status: 'success',
      message: 'Data berhasil diproses',
      timestamp: new Date().toISOString(),
      data: invoiceData
    };
    
    res.status(200).json(processedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.comparePrices = async (req, res) => {
  try {
    const { products } = req.body;
    const previousPrices = await getPreviousPrices();
    const priceChanges = calculatePriceChanges(products, previousPrices);
    res.json(priceChanges);
  } catch (error) {
    console.error('Error comparing prices:', error);
    res.status(500).json({ error: error.message });
  }
};
