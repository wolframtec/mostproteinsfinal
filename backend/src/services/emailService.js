/**
 * Email Service
 * 
 * Handles all email communications using SendGrid.
 * Includes order confirmations, shipping notifications, and support emails.
 */

import sgMail from '@sendgrid/mail';
import { logger } from '../utils/logger.js';

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const FROM_EMAIL = process.env.FROM_EMAIL || 'orders@mostproteins.com';
const FROM_NAME = 'Most Proteins';

/**
 * Check if email service is configured
 * @returns {boolean}
 */
export const isEmailConfigured = () => {
  return !!process.env.SENDGRID_API_KEY;
};

/**
 * Send order confirmation email
 * @param {Object} order - Order details
 * @returns {Promise<Object>} SendGrid response
 */
export const sendOrderConfirmation = async (order) => {
  if (!isEmailConfigured()) {
    logger.warn('Email service not configured. Order confirmation not sent.');
    return { skipped: true };
  }

  try {
    const itemsList = order.items.map(item => 
      `<tr>
        <td style="padding: 10px; border-bottom: 1px solid #333;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #333; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #333; text-align: right;">$${item.price * item.quantity}</td>
      </tr>`
    ).join('');

    const msg = {
      to: order.customer.email,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject: `Order Confirmation - ${order.orderId}`,
      text: `Thank you for your order! Order ID: ${order.orderId}. Total: $${order.total}.`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #0B0C10; color: #F4F6FA;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0B0C10;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #111318; border-radius: 12px; overflow: hidden;">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 30px; text-align: center; background: linear-gradient(135deg, #111318 0%, #1a1d24 100%); border-bottom: 2px solid #2EE9A8;">
                      <h1 style="margin: 0; color: #2EE9A8; font-size: 28px;">Most Proteins</h1>
                      <p style="margin: 10px 0 0; color: #A6ACB8; font-size: 14px;">Research-Grade Peptides</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 30px;">
                      <h2 style="margin: 0 0 20px; color: #F4F6FA; font-size: 22px;">Order Confirmation</h2>
                      <p style="color: #A6ACB8; line-height: 1.6;">Thank you for your order! We've received your payment and are preparing your research materials.</p>
                      
                      <div style="background-color: #0B0C10; border-radius: 8px; padding: 20px; margin: 20px 0;">
                        <p style="margin: 0 0 10px; color: #A6ACB8;"><strong style="color: #F4F6FA;">Order ID:</strong> ${order.orderId}</p>
                        <p style="margin: 0; color: #A6ACB8;"><strong style="color: #F4F6FA;">Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      
                      <h3 style="color: #F4F6FA; font-size: 16px; margin: 25px 0 15px;">Order Summary</h3>
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0B0C10; border-radius: 8px;">
                        <thead>
                          <tr>
                            <th style="padding: 12px 10px; text-align: left; color: #2EE9A8; font-size: 12px; text-transform: uppercase;">Product</th>
                            <th style="padding: 12px 10px; text-align: center; color: #2EE9A8; font-size: 12px; text-transform: uppercase;">Qty</th>
                            <th style="padding: 12px 10px; text-align: right; color: #2EE9A8; font-size: 12px; text-transform: uppercase;">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${itemsList}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colspan="2" style="padding: 15px 10px; text-align: right; color: #A6ACB8;"><strong>Total:</strong></td>
                            <td style="padding: 15px 10px; text-align: right; color: #2EE9A8; font-size: 18px; font-weight: bold;">$${order.total}</td>
                          </tr>
                        </tfoot>
                      </table>
                      
                      <h3 style="color: #F4F6FA; font-size: 16px; margin: 25px 0 15px;">Shipping Address</h3>
                      <div style="background-color: #0B0C10; border-radius: 8px; padding: 15px; color: #A6ACB8; line-height: 1.6;">
                        ${order.customer.firstName} ${order.customer.lastName}<br>
                        ${order.customer.institution}<br>
                        ${order.customer.address}<br>
                        ${order.customer.city}, ${order.customer.state} ${order.customer.zip}
                      </div>
                      
                      <div style="background-color: #2d1f00; border: 1px solid #665200; border-radius: 8px; padding: 15px; margin: 25px 0;">
                        <p style="margin: 0; color: #d4a853; font-size: 13px;">
                          <strong>Important:</strong> These products are for research use only and are not for human consumption. 
                          Please handle all materials according to laboratory safety protocols.
                        </p>
                      </div>
                      
                      <p style="color: #A6ACB8; line-height: 1.6; margin-top: 25px;">
                        We'll send you a shipping notification with tracking information once your order ships. 
                        If you have any questions, please contact us at <a href="mailto:support@mostproteins.com" style="color: #2EE9A8;">support@mostproteins.com</a>.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 20px 30px; text-align: center; border-top: 1px solid #333; background-color: #0B0C10;">
                      <p style="margin: 0; color: #666; font-size: 12px;">
                        © 2026 Most Proteins. All rights reserved.<br>
                        <span style="color: #d4a853;">For Research Use Only • Not FDA Approved</span>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    const response = await sgMail.send(msg);
    
    logger.info('Order confirmation email sent', {
      orderId: order.orderId,
      to: order.customer.email,
    });

    return response;
  } catch (error) {
    logger.error('Failed to send order confirmation email:', {
      orderId: order.orderId,
      error: error.message,
    });
    // Don't throw - email failure shouldn't break the order flow
    return { error: error.message };
  }
};

/**
 * Send shipping notification email
 * @param {Object} order - Order details
 * @param {string} trackingNumber - Shipping tracking number
 * @param {string} carrier - Shipping carrier
 * @returns {Promise<Object>} SendGrid response
 */
export const sendShippingNotification = async (order, trackingNumber, carrier) => {
  if (!isEmailConfigured()) {
    logger.warn('Email service not configured. Shipping notification not sent.');
    return { skipped: true };
  }

  try {
    const msg = {
      to: order.customer.email,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject: `Your Order Has Shipped - ${order.orderId}`,
      text: `Your order ${order.orderId} has shipped! Tracking: ${trackingNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Shipping Notification</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #0B0C10; color: #F4F6FA;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0B0C10;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #111318; border-radius: 12px; overflow: hidden;">
                  <tr>
                    <td style="padding: 30px; text-align: center; background: linear-gradient(135deg, #111318 0%, #1a1d24 100%); border-bottom: 2px solid #2EE9A8;">
                      <h1 style="margin: 0; color: #2EE9A8; font-size: 28px;">Most Proteins</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 30px;">
                      <h2 style="margin: 0 0 20px; color: #F4F6FA; font-size: 22px;">Your Order Has Shipped! 🚚</h2>
                      <p style="color: #A6ACB8; line-height: 1.6;">Great news! Your research materials are on their way.</p>
                      
                      <div style="background-color: #0B0C10; border-radius: 8px; padding: 20px; margin: 20px 0;">
                        <p style="margin: 0 0 10px; color: #A6ACB8;"><strong style="color: #F4F6FA;">Order ID:</strong> ${order.orderId}</p>
                        <p style="margin: 0 0 10px; color: #A6ACB8;"><strong style="color: #F4F6FA;">Carrier:</strong> ${carrier}</p>
                        <p style="margin: 0; color: #A6ACB8;"><strong style="color: #F4F6FA;">Tracking Number:</strong> <span style="color: #2EE9A8; font-family: monospace;">${trackingNumber}</span></p>
                      </div>
                      
                      <div style="text-align: center; margin: 25px 0;">
                        <a href="#" style="display: inline-block; background-color: #2EE9A8; color: #0B0C10; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Track Your Package</a>
                      </div>
                      
                      <p style="color: #A6ACB8; line-height: 1.6;">
                        Please ensure someone is available to receive the package. A signature is required for delivery.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 30px; text-align: center; border-top: 1px solid #333; background-color: #0B0C10;">
                      <p style="margin: 0; color: #666; font-size: 12px;">© 2026 Most Proteins. All rights reserved.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    const response = await sgMail.send(msg);
    
    logger.info('Shipping notification email sent', {
      orderId: order.orderId,
      trackingNumber,
    });

    return response;
  } catch (error) {
    logger.error('Failed to send shipping notification:', {
      orderId: order.orderId,
      error: error.message,
    });
    return { error: error.message };
  }
};

/**
 * Send contact form submission to admin
 * @param {Object} data - Contact form data
 * @returns {Promise<Object>} SendGrid response
 */
export const sendContactForm = async (data) => {
  if (!isEmailConfigured()) {
    logger.warn('Email service not configured. Contact form not sent.');
    return { skipped: true };
  }

  try {
    const msg = {
      to: process.env.ADMIN_EMAIL || 'support@mostproteins.com',
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      replyTo: data.email,
      subject: `Contact Form: ${data.subject}`,
      text: `
Name: ${data.name}
Email: ${data.email}
Subject: ${data.subject}

Message:
${data.message}
      `,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Subject:</strong> ${data.subject}</p>
        <h3>Message:</h3>
        <p>${data.message.replace(/\n/g, '<br>')}</p>
      `,
    };

    const response = await sgMail.send(msg);
    
    logger.info('Contact form email sent', {
      from: data.email,
      subject: data.subject,
    });

    return response;
  } catch (error) {
    logger.error('Failed to send contact form:', {
      error: error.message,
    });
    throw error;
  }
};

export default {
  sendOrderConfirmation,
  sendShippingNotification,
  sendContactForm,
  isEmailConfigured,
};
