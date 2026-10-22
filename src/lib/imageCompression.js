import imageCompression from 'browser-image-compression';

/**
 * Compresses an image file in the browser before upload to Supabase Storage.
 * Complies with the 0-cost policy: WebP format, max 120 KB per image.
 *
 * @param {File} imageFile - Original file from input
 * @param {Object} customOptions - Overrides if needed
 * @returns {Promise<{file: File, dataUrl: string, originalKB: number, compressedKB: number, savedPercent: number}>}
 */
export async function compressImageToWebP(imageFile, customOptions = {}) {
  const originalKB = Math.round(imageFile.size / 1024);

  const options = {
    maxSizeMB: 0.12, // Maximum 120 KB limit as mandated by spec
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.82,
    ...customOptions
  };

  try {
    const compressedFile = await imageCompression(imageFile, options);
    const compressedKB = Math.round(compressedFile.size / 1024);
    const savedPercent = originalKB > 0 
      ? Math.max(0, Math.round(((originalKB - compressedKB) / originalKB) * 100))
      : 0;

    const dataUrl = await imageCompression.getDataUrlFromFile(compressedFile);

    console.log(`[Compresión MÁNDALO!] Original: ${originalKB} KB -> WebP: ${compressedKB} KB (${savedPercent}% ahorro)`);

    return {
      file: compressedFile,
      dataUrl,
      originalKB,
      compressedKB,
      savedPercent,
      fileName: imageFile.name.replace(/\.[^/.]+$/, "") + ".webp"
    };
  } catch (error) {
    console.warn('Fallback to canvas compression:', error);
    // Canvas fallback if web worker fails on older devices
    return fallbackCanvasCompress(imageFile);
  }
}

/**
 * Fallback compressor using HTML5 Canvas
 */
async function fallbackCanvasCompress(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1200;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/webp', 0.8);
        const originalKB = Math.round(file.size / 1024);
        const approxCompressedKB = Math.round((dataUrl.length * (3/4)) / 1024);
        const savedPercent = Math.max(0, Math.round(((originalKB - approxCompressedKB) / originalKB) * 100));

        resolve({
          file,
          dataUrl,
          originalKB,
          compressedKB: approxCompressedKB,
          savedPercent,
          fileName: file.name.replace(/\.[^/.]+$/, "") + ".webp"
        });
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
