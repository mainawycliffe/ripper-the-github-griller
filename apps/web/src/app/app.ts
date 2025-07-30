import { Component, ElementRef, inject, viewChild } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { FormsModule } from '@angular/forms';
import { injectMutation } from '@tanstack/angular-query-experimental';

@Component({
  imports: [FormsModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  functions = inject(Functions);
  roastCardRef = viewChild<ElementRef<HTMLDivElement>>('roastCard');

  roastMutations = injectMutation(() => ({
    mutationFn: async (username: string) => {
      const callable = httpsCallable<{ username: string }, string>(
        this.functions,
        'githubGrillerFunction',
      );
      const result = await callable({ username });
      console.log('Roast result:', result);
      return result.data;
    },
  }));

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
