import express from 'express';
import { 
  getUsers, 
  updateUserStatus, 
  resetUserPassword 
} from '../controllers/userController.js';
import { protectRoute, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// All user management routes require valid authentication token and Admin role
router.use(protectRoute, adminOnly);

router.get('/', getUsers);
router.patch('/:id/status', updateUserStatus);
router.patch('/:id/password', resetUserPassword);

export default router;