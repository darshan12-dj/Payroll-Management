const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const uploadPhoto = require('../middleware/upload');
const { ROLES } = require('../config/constants');
const { getUsers, updateUser, updateMyProfile, deleteUser } = require('../controllers/userController');

const router = express.Router();

router.use(protect);

router.put('/me', uploadPhoto.single('profilePhoto'), updateMyProfile);
router.get('/', authorize(ROLES.ADMIN), getUsers);
router.put('/:id', authorize(ROLES.ADMIN), updateUser);
router.delete('/:id', authorize(ROLES.ADMIN), deleteUser);

module.exports = router;
