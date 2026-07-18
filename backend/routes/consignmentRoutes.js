import express from 'express';
import { 
  registerConsignment, 
  getConsignments, 
  processGiantBale,
  updateProcessedGiantBale // 1. Added the new admin update controller here
} from '../controllers/consignmentController.js';

const router = express.Router();

router.route('/')
  .post(registerConsignment)
  .get(getConsignments);

router.route('/:id/process')
  .post(processGiantBale)
  .put(updateProcessedGiantBale); // 2. Chained the PUT route right here for clean consistency

export default router;