const DATABASE = 'canvas-image-assets';
const STORE = 'images';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Image storage is unavailable.'));
  });
}

async function storeImage(id: string, blob: Blob): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE, 'readwrite');
      transaction.objectStore(STORE).put(blob, id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Could not save the image.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Could not save the image.'));
    });
  } finally {
    db.close();
  }
}

export async function getImageAsset(id: string): Promise<Blob | undefined> {
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(id);
      request.onsuccess = () => resolve(request.result as Blob | undefined);
      request.onerror = () => reject(request.error ?? new Error('Could not open the image.'));
    });
  } finally {
    db.close();
  }
}

export async function importImageAsset(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
    throw new Error('Choose a JPG, PNG, WebP, or GIF image.');
  }
  if (file.size > 20 * 1024 * 1024) {
    throw new Error('Choose an image smaller than 20 MB.');
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('This image could not be opened. Try another JPG, PNG, WebP, or GIF file.');
  }
  try {
    if (!bitmap.width || !bitmap.height) throw new Error('This image has no visible pixels.');
    const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image processing is unavailable in this browser.');
    context.fillStyle = '#f4f1eb';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(value => value ? resolve(value) : reject(new Error('Could not prepare this image.')), 'image/jpeg', 0.9);
    });
    const id = crypto.randomUUID();
    await storeImage(id, blob);
    return id;
  } finally {
    bitmap.close();
  }
}
