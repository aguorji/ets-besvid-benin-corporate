import express from 'express';
import { logSortingRun } from '../controllers/productionController.js';

const router = express.Router();

// POST route to handle warehouse sorting actions
router.post('/log-sorting', logSortingRun);

// This matches the default import expected by server.js line 17
export default router;