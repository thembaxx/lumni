declare module "pdfjs-dist" {
  export const GlobalWorkerOptions: { workerSrc: string };
  export const getDocument: (source: any) => { promise: Promise<any> };
  export const version: string;
}