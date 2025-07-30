import { Component, inject, signal } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { FormsModule } from '@angular/forms';
import { injectMutation } from '@tanstack/angular-query-experimental';
import { RoastCardComponent } from './roast-card/roast-card.component';

@Component({
  imports: [FormsModule, RoastCardComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  functions = inject(Functions);
  isRoastCardOpen = signal(false);

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
    onSuccess: (data: string) => {
      console.log('Roast successful:', data);
      this.isRoastCardOpen.set(true);
    },
    onError: (error: any) => {
      console.error('Roast failed:', error);
      alert('Failed to roast the user. Please try again.');
    },
  }));

  closeRoastCard(): void {
    this.isRoastCardOpen.set(false);
  }
}
