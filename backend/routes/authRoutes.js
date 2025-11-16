import express from 'express';
import { register, login, registerCustomer, loginCustomer } from '../controllers/authController.js';

const router = express.Router();

// Main Structura site authentication (for store owners)
router.post('/register', register);
router.post('/login', login);

// Customer authentication (for published store buyers)
router.post('/customer/register', registerCustomer);
router.post('/customer/login', loginCustomer);

export default router;
