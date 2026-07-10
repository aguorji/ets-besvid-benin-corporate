import express from 'express';
import { registerConsignment, getConsignments, processGiantBale } from '../controllers/consignmentController.js';

const router = express.Router();

router.route('/')
  .post(registerConsignment)
  .get(getConsignments);

router.route('/:id/process')
  .post(processGiantBale);

export default router;
