// src/utils/generateBillPDF.js
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';

// Load the template from public folder
async function loadFile(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch file: ${url}`);
  return await response.arrayBuffer();
}

// Main PDF generation function
export async function generateBillPDF(data) {
  try {
    const content = await loadFile('/Drishti_Invoice_Template.docx');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true
    });

    // Format items for loop
    const itemsFormatted = data.items.map((item, index) => {
      const qty = Number(item.qty || 0);
      const rate = Number(item.rate || 0);
      const amount = qty * rate;

      return {
        srno: index + 1,
        description: item.description || '',
        qty: qty.toFixed(2),
        rate: rate.toFixed(2),
        amount: amount.toFixed(2)
      };
    });

    const total = itemsFormatted.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    const discount = Number(data.discount || 0);
    const grandTotal = total + discount;

    const billData = {
      name: data.name,
      address: data.address,
      phone: data.phone,
      invoice_no: data.invoice_no,
      date: data.date,
      bank: data.bank || '',
      cheque_no: data.cheque_no || '',
      items: itemsFormatted,
      total: total.toFixed(2),
      discount: discount.toFixed(2),
      grand_total: grandTotal.toFixed(2)
    };

    await doc.resolveData(billData);
    doc.render();

    const out = doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    saveAs(out, `Invoice_${data.invoice_no || Date.now()}.docx`);
  } catch (error) {
    console.error('⚠️ Error generating bill:', error);
    if (error.properties && error.properties.errors) {
      error.properties.errors.forEach(err =>
        console.error('❌ Template error:', err.properties.explanation, '| Tag:', err.properties.tag)
      );
    }
    alert('❌ Failed to generate bill. Check console for details.');
  }
}
