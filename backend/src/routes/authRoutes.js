const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  updateUserProfile,
  getAdminUsers,
  adminDeleteUser,
} = require('../controllers/authController');

const protectUser = require('../middleware/userAuthMiddleware');
const protectAdmin = require('../middleware/adminAuthMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);

// User Profile routes (100% live MongoDB)
router.get("/me", protectUser, (req, res) => {
  return res.status(200).json({
    message: "User is authenticated.",
    user: {
      id: req.user._id,
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone || "",
      location: req.user.location || "",
      createdAt: req.user.createdAt,
    },
  });
});

router.put('/profile', protectUser, updateUserProfile);

// Admin: User management (100% live MongoDB)
router.get('/admin/users', protectAdmin, getAdminUsers);
router.delete('/admin/users/:id', protectAdmin, adminDeleteUser);

module.exports = router;