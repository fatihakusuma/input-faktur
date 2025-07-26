const express = require('express');
const router = express.Router();
const geminiController = require('../controllers/geminiController');
const apotekController = require('../controllers/apotekController');

router.post('/process-invoice', geminiController.processInvoice);
router.post('/submit-invoice', apotekController.submitInvoice);
router.post('/compare-prices', apotekController.comparePrices);

module.exports = router;