import nodemailer from 'nodemailer';

interface OrderDetails {
  orderId: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    telephone: string;
    country: string;
    city: string;
  };
  delivery: {
    type: string;
    notes: string;
  };
  items: Array<{
    id: string | number;
    name: string;
    brand: string;
    model: string;
    color: string;
    size?: string;
    type?: string;
    price: number;
    quantity: number;
    imageUrl: string;
  }>;
  totals: {
    subtotal: number;
    delivery: number;
    total: number;
  };
  orderDate: string;
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.NEXT_PUBLIC_EMAIL,
    pass: process.env.NEXT_PUBLIC_EMAIL_PASS,
  },
});

export async function sendCustomerOrderEmail(orderDetails: OrderDetails): Promise<void> {
  const customerEmailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmation - ${orderDetails.orderId}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
        .order-details { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .item:last-child { border-bottom: none; }
        .total { font-weight: bold; font-size: 18px; color: #667eea; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Thank You for Your Order!</h1>
          <p>Order #${orderDetails.orderId}</p>
        </div>

        <div class="content">
          <p>Dear ${orderDetails.customer.firstName} ${orderDetails.customer.lastName},</p>

          <p>Thank you for shopping with us! Your order has been successfully placed and is being processed.</p>

          <div class="order-details">
            <h3>Order Summary</h3>

            <div style="margin: 20px 0;">
              ${orderDetails.items.map(item => `
                <div class="item">
                  <div>
                    <strong>${item.brand} ${item.model}</strong><br>
                    <small>${item.color}${item.size ? ` • ${item.size}` : ''}${item.type ? ` • ${item.type}` : ''}</small>
                  </div>
                  <div style="text-align: right;">
                    <div>${item.quantity} × €${item.price.toFixed(2)}</div>
                    <div style="font-weight: bold;">€${(item.quantity * item.price).toFixed(2)}</div>
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="item">
              <strong>Subtotal:</strong>
              <span>€${orderDetails.totals.subtotal.toFixed(2)}</span>
            </div>

            <div class="item">
              <strong>Delivery (${orderDetails.delivery.type}):</strong>
              <span>€${orderDetails.totals.delivery.toFixed(2)}</span>
            </div>

            <div class="item total">
              <strong>Total:</strong>
              <span>€${orderDetails.totals.total.toFixed(2)}</span>
            </div>
          </div>

          <div style="margin: 20px 0;">
            <h4>Delivery Information:</h4>
            <p><strong>Method:</strong> ${orderDetails.delivery.type}</p>
            <p><strong>Address:</strong> ${orderDetails.customer.city}, ${orderDetails.customer.country}</p>
            ${orderDetails.delivery.notes ? `<p><strong>Notes:</strong> ${orderDetails.delivery.notes}</p>` : ''}
          </div>

          <div style="margin: 20px 0;">
            <h4>Contact Information:</h4>
            <p><strong>Email:</strong> ${orderDetails.customer.email}</p>
            <p><strong>Phone:</strong> ${orderDetails.customer.telephone}</p>
          </div>

          <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>What happens next?</strong></p>
            <ul>
              <li>You will receive an email confirmation shortly</li>
              <li>Your order will be processed within 1-2 business days</li>
              <li>You will receive tracking information once shipped</li>
            </ul>
          </div>

          <div class="footer">
            <p>If you have any questions, please contact us at contact@storename.com</p>
            <p>Order Date: ${new Date(orderDetails.orderDate).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: process.env.NEXT_PUBLIC_EMAIL,
    to: orderDetails.customer.email,
    subject: `Order Confirmation - #${orderDetails.orderId}`,
    html: customerEmailHtml,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Customer order email sent successfully');
  } catch (error) {
    console.error('Error sending customer order email:', error);
    throw new Error('Failed to send customer confirmation email');
  }
}

export async function sendAdminOrderEmail(orderDetails: OrderDetails): Promise<void> {
  const adminEmailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Order - ${orderDetails.orderId}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
        .order-details { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .item:last-child { border-bottom: none; }
        .customer-info { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .total { font-weight: bold; font-size: 18px; color: #ee5a24; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Order Received!</h1>
          <p>Order #${orderDetails.orderId}</p>
        </div>

        <div class="content">
          <p>A new order has been placed on your store.</p>

          <div class="customer-info">
            <h3>Customer Information</h3>
            <p><strong>Name:</strong> ${orderDetails.customer.firstName} ${orderDetails.customer.lastName}</p>
            <p><strong>Email:</strong> ${orderDetails.customer.email}</p>
            <p><strong>Phone:</strong> ${orderDetails.customer.telephone}</p>
            <p><strong>Address:</strong> ${orderDetails.customer.city}, ${orderDetails.customer.country}</p>
          </div>

          <div class="order-details">
            <h3>Order Details</h3>

            <div style="margin: 20px 0;">
              ${orderDetails.items.map(item => `
                <div class="item">
                  <div>
                    <strong>${item.brand} ${item.model}</strong><br>
                    <small>${item.color}${item.size ? ` • ${item.size}` : ''}${item.type ? ` • ${item.type}` : ''}</small><br>
                    <small>SKU: ${item.id}</small>
                  </div>
                  <div style="text-align: right;">
                    <div>${item.quantity} × €${item.price.toFixed(2)}</div>
                    <div style="font-weight: bold;">€${(item.quantity * item.price).toFixed(2)}</div>
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="item">
              <strong>Subtotal:</strong>
              <span>€${orderDetails.totals.subtotal.toFixed(2)}</span>
            </div>

            <div class="item">
              <strong>Delivery (${orderDetails.delivery.type}):</strong>
              <span>€${orderDetails.totals.delivery.toFixed(2)}</span>
            </div>

            <div class="item total">
              <strong>Total:</strong>
              <span>€${orderDetails.totals.total.toFixed(2)}</span>
            </div>
          </div>

          ${orderDetails.delivery.notes ? `
          <div style="margin: 20px 0;">
            <h4>Order Notes:</h4>
            <p style="background: #f8f9fa; padding: 10px; border-radius: 4px;">${orderDetails.delivery.notes}</p>
          </div>
          ` : ''}

          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Action Required:</strong></p>
            <ul>
              <li>Process the order within 1-2 business days</li>
              <li>Update inventory quantities</li>
              <li>Send tracking information to customer</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
            <p>Order Date: ${new Date(orderDetails.orderDate).toLocaleString()}</p>
            <p>This is an automated notification from your store system.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: process.env.NEXT_PUBLIC_EMAIL,
    to: process.env.NEXT_PUBLIC_EMAIL, // Send to self
    subject: `New Order Received - #${orderDetails.orderId}`,
    html: adminEmailHtml,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Admin order email sent successfully');
  } catch (error) {
    console.error('Error sending admin order email:', error);
    throw new Error('Failed to send admin notification email');
  }
}
