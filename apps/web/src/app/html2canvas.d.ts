// This is a type-only module for html2canvas, to avoid TS errors
// when using dynamic import in Angular

declare module 'html2canvas' {
  const html2canvas: (element: HTMLElement) => Promise<HTMLCanvasElement>;
  export default html2canvas;
}
