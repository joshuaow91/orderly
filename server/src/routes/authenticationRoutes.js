const express = require('express');
const router = express.Router();

const authenticationController = require('../controllers/authentication');
// for now, only working on active orders, and not orderhistory
router.post("/login", authenticationController.loginUser);
router.post("/logout", authenticationController.logoutUser);

router.get('/token', authenticationController.getToken);
router.get('/authenticateUser', authenticationController.authenticateUser);

module.exports = router;
