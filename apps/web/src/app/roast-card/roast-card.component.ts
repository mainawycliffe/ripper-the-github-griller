import { Component, ElementRef, input, output, viewChild } from '@angular/core';

@Component({
  selector: 'app-roast-card',
  templateUrl: './roast-card.component.html',
})
export class RoastCardComponent {
  results = input.required<string>();
  roastCardRef = viewChild<ElementRef<HTMLDivElement>>('roastCard');

  isModalOpen = input.required<boolean>();

  modalClosed = output<void>();

  closeCard(): void {
    this.modalClosed.emit();
  }

  downloadRoastCard(): void {
    const card = this.roastCardRef()?.nativeElement;
    if (!card) return;
    import('html2canvas').then((html2canvas) => {
      html2canvas.default(card).then((canvas: HTMLCanvasElement) => {
        const link = document.createElement('a');
        link.download = 'github-roast-card.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    });
  }

  shareRoastCard(): void {
    const card = this.roastCardRef()?.nativeElement;
    if (!card) return;
    import('html2canvas').then((html2canvas) => {
      html2canvas.default(card).then((canvas: HTMLCanvasElement) => {
        canvas.toBlob((blob: Blob | null) => {
          if (
            typeof navigator !== 'undefined' &&
            'share' in navigator &&
            blob
          ) {
            const file = new File([blob], 'github-roast-card.png', {
              type: 'image/png',
            });
            (navigator as any).share({
              title: 'GitHub Griller Roast',
              text: 'Check out my roast from GitHub Griller! 🎃',
              files: [file],
            });
          } else {
            alert(
              'Sharing is not supported in this browser. Please download instead.',
            );
          }
        });
      });
    });
  }
}
