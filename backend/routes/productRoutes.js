const express = require('express');
const router = express.Router();
const {
  getProducts,
  getLowStockProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateStock,
  deleteProduct,
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');

router.use(protect);

// Note: /low-stock must be declared before /:id so it isn't swallowed by the id route
router.get('/low-stock', getLowStockProducts);
router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.patch('/:id/stock', updateStock);
router.delete('/:id', deleteProduct);

module.exports = router;
