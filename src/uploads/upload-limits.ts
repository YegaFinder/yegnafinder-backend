export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

export const IMAGE_UPLOAD_INTERCEPTOR_OPTIONS = {
  limits: { fileSize: MAX_IMAGE_UPLOAD_BYTES },
};
