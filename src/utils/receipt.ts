// Utility functions for receipt generation

export function calculateReceiptData(formData: any, currentPrices: any, id: string) {
  const pricePerCan = currentPrices.order_price;
  const subtotal = formData.can_qty * pricePerCan;
  const deliveryAmount = Number(formData.delivery_amount) || 0;
  const missingCans = Math.max(0, formData.can_qty - (formData.collected_qty || 0));
  const missingCanCharge = missingCans * 500;
  const totalAmount = subtotal + deliveryAmount + missingCanCharge;
  return {
    pricePerCan,
    subtotal,
    deliveryAmount,
    missingCans,
    missingCanCharge,
    totalAmount,
    orderId: id,
  };
}

export function generateReceiptHTML(formData: any, receiptData: any) {
  const orderDate = new Date(formData.order_date).toLocaleDateString('en-IN');
  const deliveryDate = new Date(formData.delivery_date).toLocaleDateString('en-IN');
  // ... (copy the HTML template from OrdersForm.tsx, replacing inline calculations with receiptData)
  // For brevity, only a placeholder is provided here. Copy the full HTML as needed.
  return `<html><body>Receipt for ${formData.customer_name} (implement full template here)</body></html>`;
} 