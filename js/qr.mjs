import qrcode from '../vendor/qrcode.mjs';

/**
 * Local, static SVG QR. The size includes the white quiet zone (4 modules).
 * The URL is encoded locally; this module never fetches or opens it.
 * @param {string|URL} url Absolute final HTTP(S) passport URL.
 * @param {20|25} mm Total printed width/height in millimetres.
 * @returns {string} Safe SVG markup suitable for a container's innerHTML.
 */
export function createQrSvg(url, mm = 25) {
  if (mm !== 20 && mm !== 25) {
    throw new RangeError('El tamaño del QR debe ser 20 o 25 mm.');
  }
  let destination;
  try {
    destination = new URL(String(url));
  } catch {
    throw new TypeError('El QR necesita una URL absoluta http:// o https://.');
  }
  if (!['https:', 'http:'].includes(destination.protocol)) {
    throw new TypeError('El QR solo admite direcciones http:// o https://.');
  }
  if (destination.username || destination.password) {
    throw new TypeError('La URL del QR no debe incluir credenciales.');
  }
  // URL.href uses ASCII IDNA/percent encoding, so the library byte encoder is exact.
  const encodedUrl = destination.href;
  const qr = qrcode(0, 'M');
  qr.addData(encodedUrl, 'Byte');
  try {
    qr.make();
  } catch {
    throw new RangeError('La URL es demasiado larga para generar este QR.');
  }
  const count = qr.getModuleCount();
  const quiet = 4;
  const size = count + quiet * 2;
  const commands = [];
  for (let row = 0; row < count; row += 1) {
    for (let column = 0; column < count; column += 1) {
      if (!qr.isDark(row, column)) continue;
      const first = column;
      while (column + 1 < count && qr.isDark(row, column + 1)) column += 1;
      const length = column - first + 1;
      commands.push(`M${first + quiet} ${row + quiet}h${length}v1h-${length}z`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${mm}mm" height="${mm}mm" viewBox="0 0 ${size} ${size}" role="img" aria-label="Abrir el pasaporte M-14" shape-rendering="crispEdges" data-qr-modules="${count}" data-qr-level="M" data-qr-quiet-zone="4" data-qr-size-mm="${mm}"><rect width="${size}" height="${size}" fill="#fff"/><path d="${commands.join('')}" fill="#000"/></svg>`;
}
