import QRCode from 'qrcode';

export const generateItemQR = async (itemId, baseUrl) => {
  const url = `${baseUrl}/items/${itemId}`;
  const dataUrl = await QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: { dark: '#1e40af', light: '#ffffff' },
  });
  return { qrCode: url, qrCodeDataUrl: dataUrl };
};

export const generateQRBuffer = async (data) => {
  return QRCode.toBuffer(data, { width: 400, margin: 2 });
};
