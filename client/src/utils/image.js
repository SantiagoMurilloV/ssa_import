// Comprime la foto del comprobante en el navegador antes de subirla:
// las funciones de Vercel aceptan cuerpos de ~4.5 MB y el admin 5 MB.
const MAX_DIMENSION = 1400;
const TARGET_BYTES = 1_500_000;

export async function compressImage(file) {
  if (!file.type.startsWith('image/')) return file;
  if (file.size <= TARGET_BYTES) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}
