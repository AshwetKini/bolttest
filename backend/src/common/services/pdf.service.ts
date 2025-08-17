import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { Order } from '../../orders/schemas/order.schema';

@Injectable()
export class PdfService {
  async generateInvoice(order: Order): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Header
      doc
        .fontSize(20)
        .text('INVOICE', 50, 50, { align: 'center' })
        .fontSize(12)
        .text(`Invoice #: ${order.orderNumber}`, 50, 120)
        .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 50, 140)
        .text(`Status: ${order.status}`, 50, 160);

      // Store Info
      doc
        .text('Store Information:', 50, 200)
        .text(`Store: ${order.store.name}`, 50, 220)
        .text(`Phone: ${order.store.phone}`, 50, 240);

      // Customer Info
      doc
        .text('Customer Information:', 300, 200)
        .text(`Name: ${order.customer.name}`, 300, 220)
        .text(`Phone: ${order.customer.phone}`, 300, 240);

      // Items table
      let yPosition = 300;
      doc
        .text('Items:', 50, yPosition)
        .text('Item', 50, yPosition + 20)
        .text('Qty', 200, yPosition + 20)
        .text('Price', 250, yPosition + 20)
        .text('Total', 350, yPosition + 20);

      yPosition += 40;
      let subtotal = 0;

      order.items.forEach((item) => {
        const itemTotal = item.quantity * item.price;
        subtotal += itemTotal;

        doc
          .text(item.productName, 50, yPosition)
          .text(item.quantity.toString(), 200, yPosition)
          .text(`$${item.price.toFixed(2)}`, 250, yPosition)
          .text(`$${itemTotal.toFixed(2)}`, 350, yPosition);

        yPosition += 20;
      });

      // Totals
      yPosition += 20;
      doc
        .text(`Subtotal: $${subtotal.toFixed(2)}`, 250, yPosition)
        .text(`Tax: $${order.tax.toFixed(2)}`, 250, yPosition + 20)
        .text(`Total: $${order.totalAmount.toFixed(2)}`, 250, yPosition + 40, {
          fontSize: 14,
          fontWeight: 'bold',
        });

      // Payment Status
      doc
        .text(`Payment Status: ${order.paymentStatus}`, 50, yPosition + 80)
        .fontSize(10)
        .text('Thank you for your business!', 50, yPosition + 120);

      doc.end();
    });
  }
}