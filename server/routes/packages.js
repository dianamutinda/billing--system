const express = require('express');
const router = express.Router();
const { getAllPackages } = require('../services/packageService');

router.get('/', (req, res) => {
  res.json(getAllPackages());
});

module.exports = router;