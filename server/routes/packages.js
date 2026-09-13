const express = require('express');
const router = express.Router();
const { getAllPackages } = require('../services/packageService');

router.get('/', async (req, res) => {
  try {
    const packages = await getAllPackages();
    res.json(packages);
  } catch (err) {
    console.error('POST /api/purchase failed:', err);
    res.status(500).json({error: 'Something went wrong. Please try again.'});
  }
});

module.exports = router;