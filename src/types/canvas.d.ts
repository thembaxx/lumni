declare module "canvas" {
  export class Canvas {
    constructor(width: number, height: number);
    width: number;
    height: number;
    getContext(type: "2d"): CanvasRenderingContext2D;
    toBuffer(type: "image/png"): Buffer;
  }
}
