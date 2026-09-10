const express = require('express');
const router = express.Router();
const { getAllPackages } = require('../services/packageService');

router.get('/', async (req, res) => {
  try {
    const packages = await getAllPackages();
    res.json(packages);
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});

module.exports = router;