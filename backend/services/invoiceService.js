/**
 * Invoice Service - Generate EU-Compliant Invoices
 * 
 * Invoice requirements:
 * - Platform legal name
 * - Seller/company name
 * - Client name and country
 * - Base price, VAT rate, VAT amount, total
 * - Invoice ID and date
 * - Reverse-charge note if applicable
 */

const crypto = require('crypto');
const Order = require('../models/Order');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const Job = require('../models/Job');

const PLATFORM_INFO = {
  name: 'Noretmy Platform',
  legalName: 'Noretmy Ltd.',
  address: 'Platform Address, EU',
  vatNumber: 'EU-00000000', // Platform's VAT number
  email: 'invoices@noretmy.com'
};

/**
 * Generate unique invoice ID
 */
const generateInvoiceId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `INV-${timestamp}-${random}`;
};

/**
 * Generate invoice data for an order
 */
const generateInvoice = async (orderId) => {
  try {
    const order = await Order.findById(orderId);
    
    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    if (!order.isPaid) {
      return { success: false, error: 'Invoice can only be generated for paid orders' };
    }

    const buyer = await User.findById(order.buyerId);
    const buyerProfile = await UserProfile.findOne({ userId: order.buyerId });

    const seller = await User.findById(order.sellerId);
    const sellerProfile = await UserProfile.findOne({ userId: order.sellerId });

    const gig = await Job.findById(order.gigId);

    const invoiceId = order.invoiceId || generateInvoiceId();

    const invoiceData = {
      invoiceId,
      invoiceDate: new Date(),
      orderId: order._id,
      
      platform: PLATFORM_INFO,
      
      seller: {
        id: seller?._id,
        name: seller?.fullName || seller?.username || 'Unknown Seller',
        email: seller?.email,
        country: sellerProfile?.countryCode || sellerProfile?.country,
        vatId: sellerProfile?.vatId || null,
        isCompany: seller?.role === 'company'
      },
      
      buyer: {
        id: buyer?._id,
        name: buyer?.fullName || buyer?.username || 'Unknown Buyer',
        email: buyer?.email,
        country: order.clientCountry || buyerProfile?.countryCode,
        vatId: order.clientVatId || buyerProfile?.vatId || null,
        isCompany: buyer?.role === 'company' || buyerProfile?.isCompany
      },
      
      service: {
        description: gig?.title || 'Digital Service',
        category: gig?.category || 'Service'
      },
      
      pricing: {
        baseAmount: order.baseAmount || order.price,
        currency: order.currency || 'EUR',
        vatRate: order.vatRate || 0,
        vatRatePercentage: Math.round((order.vatRate || 0) * 100),
        vatAmount: order.vatAmount || 0,
        platformFee: order.platformFee || 0,
        totalAmount: order.totalAmount || order.price,
        vatCollected: order.vatCollected || false
      },
      
      reverseCharge: {
        applied: order.reverseChargeApplied || false,
        note: order.reverseChargeApplied 
          ? 'VAT reverse-charged under Article 44 and 196 of EU VAT Directive'
          : null
      },
      
      payment: {
        status: order.paymentStatus || 'completed',
        provider: order.paymentProvider || 'stripe',
        paidAt: order.updatedAt,
        paymentIntent: order.payment_intent
      }
    };

    if (!order.invoiceId) {
      order.invoiceId = invoiceId;
      order.invoiceGenerated = true;
      order.invoiceGeneratedAt = new Date();
      await order.save();
    }

    return {
      success: true,
      invoice: invoiceData
    };

  } catch (error) {
    console.error('Invoice generation error:', error);
    return { success: false, error: 'Failed to generate invoice' };
  }
};

/**
 * Format invoice as HTML for PDF generation or display
 */
const formatInvoiceHTML = (invoice) => {
  const { platform, seller, buyer, service, pricing, reverseCharge, payment } = invoice;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoiceId}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .logo { font-size: 24px; font-weight: bold; color: #ea580c; }
    .invoice-title { font-size: 28px; color: #666; }
    .invoice-meta { text-align: right; }
    .parties { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .party { width: 45%; }
    .party-title { font-weight: bold; color: #ea580c; margin-bottom: 10px; }
    .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    .table th { background: #f7f7f7; }
    .totals { margin-top: 30px; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .grand-total { font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; }
    .reverse-charge { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .footer { margin-top: 50px; font-size: 12px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">${platform.name}</div>
      <p>${platform.legalName}<br>${platform.address}<br>VAT: ${platform.vatNumber}</p>
    </div>
    <div class="invoice-meta">
      <div class="invoice-title">INVOICE</div>
      <p>Invoice #: <strong>${invoice.invoiceId}</strong><br>
         Date: ${new Date(invoice.invoiceDate).toLocaleDateString('en-GB')}<br>
         Order: ${invoice.orderId}</p>
    </div>
  </div>
  
  <div class="parties">
    <div class="party">
      <div class="party-title">From (Seller)</div>
      <p>${seller.name}<br>
         ${seller.email}<br>
         Country: ${seller.country || 'N/A'}
         ${seller.vatId ? `<br>VAT ID: ${seller.vatId}` : ''}</p>
    </div>
    <div class="party">
      <div class="party-title">To (Client)</div>
      <p>${buyer.name}<br>
         ${buyer.email}<br>
         Country: ${buyer.country || 'N/A'}
         ${buyer.vatId ? `<br>VAT ID: ${buyer.vatId}` : ''}</p>
    </div>
  </div>
  
  <table class="table">
    <thead>
      <tr>
        <th>Description</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${service.description}</td>
        <td>${pricing.currency} ${pricing.baseAmount.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>
  
  <div class="totals">
    <div class="total-row">
      <span>Subtotal</span>
      <span>${pricing.currency} ${pricing.baseAmount.toFixed(2)}</span>
    </div>
    <div class="total-row">
      <span>VAT (${pricing.vatRatePercentage}%)</span>
      <span>${pricing.currency} ${pricing.vatAmount.toFixed(2)}</span>
    </div>
    <div class="total-row grand-total">
      <span>Total</span>
      <span>${pricing.currency} ${pricing.totalAmount.toFixed(2)}</span>
    </div>
  </div>
  
  ${reverseCharge.applied ? `
  <div class="reverse-charge">
    <strong>⚠️ Reverse Charge:</strong> ${reverseCharge.note}
  </div>
  ` : ''}
  
  <div class="footer">
    <p>Thank you for your business!</p>
    <p>${platform.legalName} • ${platform.email}</p>
    <p>Payment received via ${payment.provider} on ${new Date(payment.paidAt).toLocaleDateString('en-GB')}</p>
  </div>
</body>
</html>
  `;
};

/**
 * Get invoice for an order (generate if not exists)
 */
const getOrderInvoice = async (orderId) => {
  return await generateInvoice(orderId);
};

module.exports = {
  generateInvoiceId,
  generateInvoice,
  formatInvoiceHTML,
  getOrderInvoice,
  PLATFORM_INFO
};
