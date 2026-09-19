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

// Previously router.use(protectRoute) blanket-protected every route in this
// file, including GET / — meaning even just viewing the public product
// catalog required being logged in. That broke /products entirely for
// actual customers. Auth is now applied individually per route below:
// reading the catalog is public, every write action stays exactly as
// protected as it already was.

// Base Product pathways mapping cleanly to your Master Items view
router.route('/')
  .get(getProducts)
  .post(protectRoute, adminOnly, createProduct);

// Nested route to append new container production batches (e.g. Batch 1, Batch 2)
router.route('/:id/variations')
  .post(protectRoute, addStockVariation);

// Exposes the route to update prices and correct item names
router.route('/:productId')
  .put(protectRoute, adminOnly, updateProductCatalogItem);

// Product photo upload — admin-only, same reasoning as catalog edits
router.post('/:productId/image', protectRoute, adminOnly, upload.single('image'), uploadProductImage);

// Same thing, looked up by item code — used from the Production Ledger,
// which only knows an item's code, not its database ID. Open to staff too
// (not adminOnly) — a photo upload is an operational task, not sensitive
// catalog editing like price/quantity changes.
router.post('/by-code/:itemCode/image', protectRoute, upload.single('image'), uploadProductImageByCode);

export default router;