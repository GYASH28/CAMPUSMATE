import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';
import { firebaseMissingMessage, storage } from './config';

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([
  'pdf',
  'doc',
  'docx',
  'ppt',
  'pptx',
  'png',
  'jpg',
  'jpeg',
  'webp',
]);

function requireStorage() {
  if (!storage) throw new Error(firebaseMissingMessage);
  return storage;
}

function validateFile(file) {
  if (!file) throw new Error('Select a file before uploading.');
  if (file.size > MAX_UPLOAD_SIZE) {
    throw new Error('File is too large. Please upload a file under 10 MB.');
  }
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    throw new Error('Unsupported file type. Upload PDF, document, presentation, or image files only.');
  }
}

export async function uploadFile(file, folder = 'campusmate', onProgress) {
  const instance = requireStorage();
  validateFile(file);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  const filePath = `${folder}/${Date.now()}-${safeName}`;
  const fileRef = ref(instance, filePath);
  await new Promise((resolve, reject) => {
    const task = uploadBytesResumable(fileRef, file);
    task.on(
      'state_changed',
      (snapshot) => {
        if (typeof onProgress === 'function') {
          onProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
        }
      },
      reject,
      resolve,
    );
  });
  const fileUrl = await getDownloadURL(fileRef);
  return { fileUrl, fileName: file.name, filePath };
}

export async function deleteUploadedFile(filePath) {
  if (!filePath) return;
  const instance = requireStorage();
  try {
    await deleteObject(ref(instance, filePath));
  } catch (error) {
    if (error?.code !== 'storage/object-not-found') {
      throw error;
    }
  }
}
