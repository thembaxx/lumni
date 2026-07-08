let openUploadHandler: ((files: File[], endpoint?: "generalUploader") => void) | null = null;

export function setOpenUploadHandler(handler: typeof openUploadHandler) {
  openUploadHandler = handler;
}
