import express from 'express';
import multer from 'multer';
import { 
  createProduct, 
  getProducts, 
  addStockVariation, 
  updateProductCatalogItem,
  uploadProductImage,
  uploadProductImageByCode
} from '../controllers/productController.js';
import { protectRoute, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Keeps the uploaded file in memory (not written to disk) since it's
// forwarded straight to Cloudinary and never needs to persist locally.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB cap — plenty for a product photo
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed.'));
  }
});

router.use(protectRoute);

// Base Product pathways mapping cleanly to your Master Items view
router.route('/')
  .get(getProducts)
  .post(adminOnly, createProduct);

// Nested route to append new container production batches (e.g. Batch 1, Batch 2)
router.route('/:id/variations')
  .post(addStockVariation);

// Exposes the route to update prices and correct item names
router.route('/:productId')
  .put(adminOnly, updateProductCatalogItem);

// Product photo upload — admin-only, same reasoning as catalog edits
router.post('/:productId/image', adminOnly, upload.single('image'), uploadProductImage);

// Same thing, looked up by item code — used from the Production Ledger,
// which only knows an item's code, not its database ID
router.post('/by-code/:itemCode/image', adminOnly, upload.single('image'), uploadProductImageByCode);

export default router;
