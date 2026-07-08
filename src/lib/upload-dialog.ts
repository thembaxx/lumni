let openUploadHandler: ((files: File[], endpoint?: "generalUploader") => void) | null = null;

function openUploadDialog(files: File[], endpoint: "generalUploader" = "generalUploader") {
  openUploadHandler?.(files, endpoint);
}

export function setOpenUploadHandler(handler: typeof openUploadHandler) {
  openUploadHandler = handler;
}
