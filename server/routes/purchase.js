const express = require ('express');
const router = express.Router();
const { initiateStkPush } = require('../services/paymentService');
const { getPackageById } = require('../services/packageService');

const PHONE_REGEX = /^254\d{9}$/;

router.post('/', async(req, res) => {
    try {
        const { phone, packageId } = req.body;

        if (!phone || !PHONE_REGEX.test(phone)) {
            return res.status(400).json({ error: 'Invalid phone number.'});
        }
        if (!packageId) {
            return res.status(400).json({ error: 'packageId is required'});
        }

        const pkg = await getPackageById(packageId);
        if (!pkg) {
            return res.status(400).json({ error: 'Invalid packageId.'})
        }


        const result = await initiateStkPush(phone, packageId);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message})
    }
});

module.exports = router;