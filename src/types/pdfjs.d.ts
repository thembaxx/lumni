declare module "pdfjs-dist" {
  export const GlobalWorkerOptions: { workerSrc: string };
  export const getDocument: (source: unknown) => { promise: Promise<unknown> };
  export const version: string;
}
