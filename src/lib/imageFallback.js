/**
 * Fallback images en formato SVG Data-URI 100% locales (Costo 0 KB de red).
 * Garantizan que si una imagen externa (Unsplash, CDN) falla o no hay conexión,
 * la interfaz de MÁNDALO! nunca muestre un cuadro roto ni se caiga.
 */

export const FALLBACK_STORE_BANNER = 
  "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22800%22%20height%3D%22400%22%20viewBox%3D%220%200%20800%20400%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%231A263D%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%230E1526%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22url(%23g)%22%2F%3E%3Ccircle%20cx%3D%22400%22%20cy%3D%22170%22%20r%3D%2256%22%20fill%3D%22rgba(255%2C94%2C54%2C0.18)%22%2F%3E%3Ctext%20x%3D%22400%22%20y%3D%22184%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%2240%22%20text-anchor%3D%22middle%22%20fill%3D%22%23FF5E36%22%3E%F0%9F%8F%AA%3C%2Ftext%3E%3Ctext%20x%3D%22400%22%20y%3D%22260%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2222%22%20text-anchor%3D%22middle%22%20fill%3D%22%23FFFFFF%22%3EM%C3%81NDALO!%3C%2Ftext%3E%3Ctext%20x%3D%22400%22%20y%3D%22290%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-weight%3D%22600%22%20font-size%3D%2214%22%20text-anchor%3D%22middle%22%20fill%3D%22%2394A3B8%22%3EComercio%20Aliado%20Verificado%3C%2Ftext%3E%3C%2Fsvg%3E";

export const FALLBACK_PRODUCT_IMAGE = 
  "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22400%22%20viewBox%3D%220%200%20400%20400%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23162035%22%2F%3E%3Ccircle%20cx%3D%22200%22%20cy%3D%22175%22%20r%3D%2255%22%20fill%3D%22rgba(255%2C94%2C54%2C0.2)%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22192%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%2242%22%20text-anchor%3D%22middle%22%20fill%3D%22%23FF5E36%22%3E%F0%9F%8D%94%3C%2Ftext%3E%3Ctext%20x%3D%22200%22%20y%3D%22265%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-weight%3D%22bold%22%20font-size%3D%2216%22%20text-anchor%3D%22middle%22%20fill%3D%22%2394A3B8%22%3EProducto%20Disponible%3C%2Ftext%3E%3C%2Fsvg%3E";

export const FALLBACK_AVATAR = 
  "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22200%22%20height%3D%22200%22%20viewBox%3D%220%200%20200%20200%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%231E293B%22%2F%3E%3Ccircle%20cx%3D%22100%22%20cy%3D%2280%22%20r%3D%2236%22%20fill%3D%22%23FF5E36%22%20opacity%3D%220.8%22%2F%3E%3Cpath%20d%3D%22M40%20180%20c0%20-35%2030%20-50%2060%20-50%20s60%2015%2060%2050%20Z%22%20fill%3D%22%23FF5E36%22%20opacity%3D%220.8%22%2F%3E%3C%2Fsvg%3E";

/**
 * Aplica el respaldo automático antirrotura a cualquier elemento <img>
 */
export const handleImageError = (e, fallbackType = 'product') => {
  e.currentTarget.onerror = null;
  if (fallbackType === 'store') {
    e.currentTarget.src = FALLBACK_STORE_BANNER;
  } else if (fallbackType === 'avatar') {
    e.currentTarget.src = FALLBACK_AVATAR;
  } else {
    e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
  }
};
