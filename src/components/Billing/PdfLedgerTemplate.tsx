// src/components/Billing/PdfLedgerTemplate.tsx
import React from 'react';

// Define props interface for clarity
interface PdfLedgerTemplateProps {
  bill: any; // Use a more specific type if you have one
  ledgerData: any[]; // Use a more specific type if you have one
  currentPrice: any; // Use a more specific type if you have one
  selectedMonth: string; // "YYYY-MM"
}

const PdfLedgerTemplate: React.FC<PdfLedgerTemplateTemplateProps> = ({
  bill,
  ledgerData,
  currentPrice,
  selectedMonth,
}) => {
  if (!bill || !currentPrice) {
    return null; // Or a loading/error state for safety
  }

  const [year, monthNum] = selectedMonth.split('-');
  const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleString('default', { month: 'long' });

  const pricePerCan = bill.customer_type === 'shop' ? currentPrice.shop_price :
                       bill.customer_type === 'monthly' ? currentPrice.monthly_price :
                       currentPrice.order_price;

  const totalCans = ledgerData.reduce((sum: number, d: { delivered_qty: any; }) => sum + Number(d.delivered_qty), 0);
  const totalAmount = totalCans * pricePerCan;

  return (
    // The content for your PDF goes directly into this JSX structure
    // All styles are now direct CSS, mimicking your Tailwind classes for html2canvas
    <div className="pdf-container" style={{
      width: '190mm', // Calculated for A4 with 10mm padding on each side (210mm - 2*10mm)
      // height: 'auto', // Let content define height
      border: '1px solid black', // Mimics border border-black
      padding: '1rem', // Mimics p-4 (16px)
      backgroundColor: 'white', // bg-white
      margin: '0 auto', // mx-auto (for centering if not absolutely positioned)
      fontFamily: 'sans-serif', // Default font
      fontSize: '10px', // Default font size
      lineHeight: '1.4', // Default line height
      boxSizing: 'border-box' // Ensures padding/border are inside width/height
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', // flex
        justifyContent: 'space-between', // justify-between
        alignItems: 'flex-start', // For top alignment of content, was items-center
        borderBottom: '1px solid black', // border-b border-black
        paddingBottom: '0.5rem', // pb-2
        marginBottom: '0.5rem' // mb-2
      }}>
        <div style={{ textAlign: 'left', fontSize: '0.75rem', width: '48%' }}> {/* text-xs, half width */}
          <div style={{ fontWeight: 'bold', color: '#1e3a8a', fontSize: '1.125rem' }}>कंचन मिनरल वाटर</div> {/* font-bold text-blue-900 text-lg */}
          <div>5, लेबर कॉलोनी, नई आबादी, मंदसौर</div>
          <div>Ph.: 07422-408555 Mob.: 9425033995</div>
        </div>
        <div style={{ textAlign: 'center', fontSize: '0.75rem', width: '48%' }}> {/* text-xs, half width */}
          <div style={{ fontWeight: 'bold', color: '#1e3a8a', fontSize: '1.125rem' }}>कंचन चिल्ड वाटर</div> {/* font-bold text-blue-900 text-lg */}
          <div>साई मंदिर के पास, अभिनन्दन नगर, मंदसौर</div>
          <div>Mob.: 9685753343, 9516784779</div>
        </div>
      </div>

      {/* Customer Info */}
      <div style={{
        display: 'grid', // grid
        gridTemplateColumns: '1fr 1fr', // grid-cols-2
        fontSize: '0.875rem', // text-sm
        borderBottom: '1px solid black', // border-b border-black
        paddingBottom: '0.25rem', // pb-1
        marginBottom: '0.5rem' // mb-2
      }}>
        <div>मो.: {bill.phone_number}</div>
        <div style={{ textAlign: 'right' }}>दिनांक: {monthName} {year}</div>
        <div style={{ gridColumn: 'span 2' }}>श्रीमान: {bill.name}</div> {/* col-span-2 */}
      </div>

      {/* Delivery Record Table */}
      <table style={{
        width: '100%', // w-full
        borderCollapse: 'collapse', // border-collapse
        border: '1px solid black', // border border-black for the table itself
        fontSize: '0.75rem', // text-xs
        marginTop: '1rem' // mt-2
      }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid black', padding: '0.25rem', textAlign: 'center' }}>क्र.</th> {/* border border-black p-1 */}
            <th style={{ border: '1px solid black', padding: '0.25rem', textAlign: 'center' }}>संख्या</th>
            <th style={{ border: '1px solid black', padding: '0.25rem', textAlign: 'center' }}>केन वापसी</th>
            <th style={{ border: '1px solid black', padding: '0.25rem', textAlign: 'center' }}>क्र.</th>
            <th style={{ border: '1px solid black', padding: '0.25rem', textAlign: 'center' }}>संख्या</th>
            <th style={{ border: '1px solid black', padding: '0.25rem', textAlign: 'center' }}>केन वापसी</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 16 }, (_, i) => {
            const left = ledgerData[i];
            const right = ledgerData[i + 16];
            return (
              <tr key={i}>
                <td style={{ border: '1px solid black', padding: '0.25rem', textAlign: 'center' }}>{i + 1}</td>
                <td style={{ border: '1px solid black', padding: '0.25rem', textAlign: 'center' }}>{left ? left.delivered_qty : ''}</td>
                <td style={{ border: '1px solid black', padding: '0.25rem' }}></td>
                <td style={{ border: '1px solid black', padding: '0.25rem', textAlign: 'center' }}>{i + 17}</td>
                <td style={{ border: '1px solid black', padding: '0.25rem', textAlign: 'center' }}>{right ? right.delivered_qty : ''}</td>
                <td style={{ border: '1px solid black', padding: '0.25rem' }}></td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Total and Notes */}
      <div style={{
        display: 'flex', // flex
        justifyContent: 'space-between', // justify-between
        alignItems: 'center', // items-center
        borderTop: '1px solid black', // border-t border-black
        marginTop: '0.5rem', // mt-2
        paddingTop: '0.25rem', // pt-1
        fontSize: '0.875rem' // text-sm
      }}>
        <div style={{ fontSize: '0.75rem' }}> {/* text-xs */}
          <div>नोट: प्रति माह 12 केन लेना अनिवार्य है।</div>
          <div>* अगर कार्ड के पोस्ट मान्य नहीं होगा।</div>
          <div>* केन 1 दिन से अधिक रखने पर प्रति दिन 10 रुपये चार्ज लगेगा।</div>
        </div>
        <div style={{
          textAlign: 'right', // text-right
          fontWeight: 'bold', // font-bold
          border: '1px solid black', // border border-black
          padding: '0.25rem 0.5rem', // px-2 py-1
          fontSize: '0.75rem' // text-xs
        }}>
          <div>कुल केन: {totalCans}</div>
          <div>कुल राशि: ₹{totalAmount}</div>
          <div>स्टेटस: <span style={{ color: bill.paid_status ? 'green' : 'red', fontWeight: 'bold' }}>{bill.paid_status ? 'भुगतान किया गया' : 'अदा नहीं किया गया'}</span></div>
        </div>
      </div>
    </div>
  );
};

export default PdfLedgerTemplate;