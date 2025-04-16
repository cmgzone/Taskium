import express from 'express';
import {
  getUserAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  verifyAddress,
  getShippingDetails,
  updateShippingTracking
} from '../routes/addresses';

const router = express.Router();

// User address management routes
router.get('/addresses', getUserAddresses);
router.get('/addresses/:id', getAddressById);
router.post('/addresses', createAddress);
router.put('/addresses/:id', updateAddress);
router.delete('/addresses/:id', deleteAddress);
router.post('/addresses/:id/set-default', setDefaultAddress);
router.get('/addresses/verify/:token', verifyAddress);

// Shipping details routes
router.get('/shipping/:transactionId', getShippingDetails);
router.put('/shipping/:id', updateShippingTracking);

export default router;