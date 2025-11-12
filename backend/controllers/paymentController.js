import Order from '../models/order.js';
import Store from '../models/store.js';

// GCash Payment Integration
export const processGCashPayment = async (req, res) => {
  try {
    const { orderId, amount, phoneNumber } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const store = await Store.findOne({ where: { userId } });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const order = await Order.findOne({
      where: { id: orderId, storeId: store.id }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // In a real implementation, you would integrate with GCash API
    // For now, we'll simulate the payment processing
    // GCash API integration would go here:
    // const gcashResponse = await axios.post('https://api.gcash.com/payments', {
    //   amount: amount,
    //   phoneNumber: phoneNumber,
    //   merchantId: process.env.GCASH_MERCHANT_ID,
    //   apiKey: process.env.GCASH_API_KEY
    // });

    // Simulate payment processing
    const transactionId = `GCASH-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Simulate successful payment after 2 seconds
    setTimeout(async () => {
      await order.update({
        paymentStatus: 'completed',
        paymentTransactionId: transactionId
      });

      if (order.status === 'pending') {
        await order.update({ status: 'processing' });
      }
    }, 2000);

    // Return payment request info
    res.json({
      success: true,
      transactionId,
      message: 'GCash payment request created. Please complete payment on your GCash app.',
      paymentUrl: `https://pay.gcash.com/pay/${transactionId}`, // This would be the actual GCash payment URL
      status: 'pending'
    });
  } catch (error) {
    console.error('Error processing GCash payment:', error);
    res.status(500).json({ message: 'Error processing GCash payment', error: error.message });
  }
};

// PayPal Payment Integration
export const processPayPalPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const store = await Store.findOne({ where: { userId } });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const order = await Order.findOne({
      where: { id: orderId, storeId: store.id }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // PayPal API Integration
    // In production, you would use PayPal SDK or REST API
    // const paypal = require('@paypal/checkout-server-sdk');
    
    // For now, we'll create a PayPal payment intent
    const paypalClientId = process.env.PAYPAL_CLIENT_ID;
    const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!paypalClientId || !paypalClientSecret) {
      console.warn('PayPal credentials not configured. Using test mode.');
    }

    // Create PayPal order
    // In real implementation:
    // const request = new paypal.orders.OrdersCreateRequest();
    // request.prefer("return=representation");
    // request.requestBody({
    //   intent: 'CAPTURE',
    //   purchase_units: [{
    //     amount: {
    //       currency_code: 'PHP',
    //       value: order.total.toString()
    //     }
    //   }]
    // });

    // Simulate PayPal payment creation
    const transactionId = `PAYPAL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const approvalUrl = `https://www.paypal.com/checkoutnow?token=${transactionId}`;

    // Update order with PayPal transaction ID
    await order.update({
      paymentTransactionId: transactionId,
      paymentStatus: 'processing'
    });

    res.json({
      success: true,
      transactionId,
      approvalUrl,
      message: 'PayPal payment created. Redirect user to approval URL.',
      status: 'pending'
    });
  } catch (error) {
    console.error('Error processing PayPal payment:', error);
    res.status(500).json({ message: 'Error processing PayPal payment', error: error.message });
  }
};

// Verify PayPal Payment (webhook/callback)
export const verifyPayPalPayment = async (req, res) => {
  try {
    const { transactionId, orderId, status } = req.body;

    const order = await Order.findOne({ where: { id: orderId } });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify payment with PayPal
    // In production, verify the webhook signature
    // const verified = await verifyPayPalWebhook(req.body, req.headers);

    if (status === 'COMPLETED') {
      await order.update({
        paymentStatus: 'completed',
        paymentTransactionId: transactionId
      });

      if (order.status === 'pending') {
        await order.update({ status: 'processing' });
      }

      res.json({ success: true, message: 'Payment verified and order updated' });
    } else {
      await order.update({
        paymentStatus: 'failed'
      });

      res.json({ success: false, message: 'Payment failed' });
    }
  } catch (error) {
    console.error('Error verifying PayPal payment:', error);
    res.status(500).json({ message: 'Error verifying payment', error: error.message });
  }
};

// Card Payment (Stripe-like integration)
export const processCardPayment = async (req, res) => {
  try {
    const { orderId, cardToken, amount } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const store = await Store.findOne({ where: { userId } });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const order = await Order.findOne({
      where: { id: orderId, storeId: store.id }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // In production, integrate with payment processor like Stripe
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: amount * 100, // Convert to cents
    //   currency: 'php',
    //   payment_method: cardToken
    // });

    // Simulate card payment
    const transactionId = `CARD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Simulate payment processing
    await order.update({
      paymentStatus: 'processing',
      paymentTransactionId: transactionId
    });

    // Simulate successful payment
    setTimeout(async () => {
      await order.update({
        paymentStatus: 'completed'
      });

      if (order.status === 'pending') {
        await order.update({ status: 'processing' });
      }
    }, 1000);

    res.json({
      success: true,
      transactionId,
      message: 'Card payment processed successfully',
      status: 'completed'
    });
  } catch (error) {
    console.error('Error processing card payment:', error);
    res.status(500).json({ message: 'Error processing card payment', error: error.message });
  }
};

