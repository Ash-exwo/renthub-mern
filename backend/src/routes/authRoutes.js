const express = require('express');
const router = express.Router();
const { registerUser ,loginUser} = require('../controllers/authController');

const protectUser =  require('../middleware/userAuthMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);

router.get("/me", protectUser, (req, res) => {
    return res.status(200).json({
        message: "User is authenticated.",
        user: req.user,
    })
})

module.exports = router;