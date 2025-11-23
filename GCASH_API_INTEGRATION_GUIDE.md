# GCash API Integration Guide

## Current Status

Ang current implementation ay gumagamit ng **simple QR code generation** (GCash QRPH format). Hindi pa ito official GCash API integration.

### Current Flow:
1. Store owner nag-set ng GCash number sa Payment Settings
2. System nag-generate ng QR code sa format: `{gcash_number}|{amount}|{description}`
3. Customer nag-scan ng QR code at manually nag-enter ng amount
4. Walang automatic payment verification - manual lang ang confirmation

---

## Official GCash API Integration

Para magamit ang **official GCash API**, kailangan ng:

### Requirements:
1. **GCash Merchant Account** - Kailangan mag-register sa GCash Business
2. **Business Registration** - May BIR documents (dito na papasok ang API Application process)
3. **API Credentials** - Mula sa GCash (API Key, Merchant ID, etc.)
4. **Technical Integration** - Backend code para makipag-usap sa GCash API

---

## Step-by-Step Integration Process

### Step 1: Application Approval (Current System)

1. Store owner nag-apply sa API Applications
2. Super Admin nag-review at nag-approve
3. Super Admin nag-set ng **QR API Key** (eto ay credentials mula sa GCash)
4. QR API Key ay na-save sa `store.content.payment.qrApiKey`

### Step 2: GCash API Setup

Pagkatapos ma-approve ang application at may GCash credentials na:

1. **Get GCash API Credentials:**
   - GCash Merchant ID
   - GCash API Key / Secret Key
   - GCash API Endpoint URL

2. **Store Credentials:**
   - I-save sa database (via Super Admin review modal)
   - O i-save sa environment variables (mas secure)

### Step 3: Backend Integration

Kailangan i-update ang `backend/controllers/paymentController.js`:

```javascript
// Example GCash API Integration
export const processGCashPayment = async (req, res) => {
  try {
    const { orderId, amount } = req.body;
    const store = await Store.findByPk(req.body.storeId);
    
    // Get QR API Key from store content
    const qrApiKey = store.content?.payment?.qrApiKey;
    
    if (!qrApiKey) {
      return res.status(400).json({ 
        message: 'QR API Key not configured. Please contact admin.' 
      });
    }

    // Call GCash API to create payment request
    const gcashResponse = await axios.post('https://api.gcash.com/v1/payments', {
      amount: amount,
      currency: 'PHP',
      merchantId: process.env.GCASH_MERCHANT_ID,
      orderId: orderId,
      callbackUrl: `${process.env.APP_URL}/api/payments/gcash/callback`
    }, {
      headers: {
        'Authorization': `Bearer ${qrApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    // Save payment reference
    await Order.update({
      paymentTransactionId: gcashResponse.data.transactionId,
      paymentStatus: 'pending'
    }, { where: { id: orderId } });

    // Return QR code data or payment URL
    res.json({
      success: true,
      transactionId: gcashResponse.data.transactionId,
      qrCode: gcashResponse.data.qrCode, // GCash-generated QR code
      paymentUrl: gcashResponse.data.paymentUrl,
      status: 'pending'
    });
  } catch (error) {
    console.error('GCash API Error:', error);
    res.status(500).json({ 
      message: 'Failed to process GCash payment',
      error: error.message 
    });
  }
};
```

### Step 4: Payment Verification (Webhook)

Kailangan ng webhook endpoint para sa payment verification:

```javascript
// Webhook endpoint for GCash payment callback
export const gcashPaymentCallback = async (req, res) => {
  try {
    const { transactionId, status, orderId } = req.body;
    
    // Verify webhook signature (important for security)
    const isValid = verifyGcashWebhook(req.body, req.headers);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid webhook signature' });
    }

    // Find order
    const order = await Order.findOne({ 
      where: { paymentTransactionId: transactionId } 
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update order based on payment status
    if (status === 'SUCCESS' || status === 'PAID') {
      await order.update({
        paymentStatus: 'completed',
        status: 'processing'
      });
    } else if (status === 'FAILED' || status === 'CANCELLED') {
      await order.update({
        paymentStatus: 'failed'
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('GCash callback error:', error);
    res.status(500).json({ message: 'Error processing callback' });
  }
};
```

### Step 5: Frontend Integration

Update ang frontend para gumamit ng official GCash API:

```javascript
// In PublishedStore.jsx or payment component
const handleGCashPayment = async () => {
  try {
    // Check if store has QR API approved
    const hasQrApi = store.content?.payment?.qrApiKey;
    
    if (!hasQrApi) {
      // Fallback to simple QR code generation
      return generateSimpleQRCode();
    }

    // Call backend to create GCash payment
    const response = await apiClient.post('/payments/gcash', {
      orderId: order.id,
      amount: totalAmount,
      storeId: store.id
    });

    // Display official GCash QR code
    if (response.data.qrCode) {
      setGcashQRCode(response.data.qrCode);
      setTransactionId(response.data.transactionId);
      
      // Poll for payment status
      pollPaymentStatus(response.data.transactionId);
    }
  } catch (error) {
    console.error('GCash payment error:', error);
    alert('Failed to process GCash payment');
  }
};
```

---

## Important Notes

### Security Considerations:
1. **API Keys** - Dapat secure ang storage (environment variables, encrypted database)
2. **Webhook Verification** - Laging i-verify ang webhook signature
3. **HTTPS Only** - GCash API requires HTTPS
4. **Error Handling** - Proper error handling para sa failed payments

### GCash API Documentation:
- Official GCash Business API documentation
- API endpoints at request/response formats
- Webhook configuration
- Testing credentials (sandbox environment)

### Testing:
1. Gumamit ng GCash sandbox environment para sa testing
2. Test ang payment flow end-to-end
3. Test ang webhook callbacks
4. Test ang error scenarios

---

## Alternative: Third-Party Payment Gateways

Kung mahirap ang direct GCash API integration, puwedeng gumamit ng payment gateway services:

1. **PayMongo** - Supports GCash payments
2. **PayMaya** - May GCash integration
3. **DragonPay** - Multiple payment options including GCash
4. **Coins.ph** - GCash payment gateway

---

## Current Simple QR Code (Temporary Solution)

Habang wala pa ang official GCash API credentials:

1. Generate QR code sa format: `{gcash_number}|{amount}|{description}`
2. Customer nag-scan at manually nagbayad
3. Store owner manually nag-verify ng payment
4. Store owner manually nag-update ng order status

**Limitations:**
- Walang automatic payment verification
- Manual ang confirmation process
- May risk ng fraud (walang verification)

---

## Recommendation

1. **Short-term:** Gamitin ang simple QR code generation (current implementation)
2. **Long-term:** I-integrate ang official GCash API o third-party payment gateway
3. **Documentation:** Keep this guide updated kapag may official GCash API credentials na

---

## Next Steps

1. ✅ API Application system (current)
2. ⏳ Get GCash API credentials from GCash Business
3. ⏳ Implement backend GCash API integration
4. ⏳ Implement webhook for payment verification
5. ⏳ Update frontend to use official QR codes
6. ⏳ Testing at deployment

---

*Note: Ang actual GCash API endpoints at implementation details ay depende sa official GCash Business API documentation.*

