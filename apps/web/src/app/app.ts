import { Component, inject, signal } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { FormsModule } from '@angular/forms';
import { injectMutation } from '@tanstack/angular-query-experimental';
import { RoastCardComponent } from './roast-card/roast-card.component';

interface RoastRequest {
  username: string;
  personality: string;
  intensity: number;
}

@Component({
  imports: [FormsModule, RoastCardComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  functions = inject(Functions);
  isRoastCardOpen = signal(false);
  username = signal('');
  selectedPersonality = signal('default');
  intensity = signal(3);

  personalities = [
    {
      value: 'default',
      label: '🎃 Default Ripper',
      emoji: '🎃',
      description: 'Classic witty roasting',
    },
    {
      value: 'gordon-ramsay',
      label: '👨‍🍳 Gordon Ramsay',
      emoji: '👨‍🍳',
      description: 'Kitchen nightmare style',
    },
    {
      value: 'pirate',
      label: '🏴‍☠️ Pirate Captain',
      emoji: '🏴‍☠️',
      description: 'Arrr, matey!',
    },
    {
      value: 'shakespeare',
      label: '🎭 Shakespeare',
      emoji: '🎭',
      description: 'To code or not to code',
    },
    {
      value: 'gen-z',
      label: '😎 Gen Z',
      emoji: '😎',
      description: 'No cap, fr fr',
    },
    {
      value: 'nice-guy',
      label: '😊 Nice Guy',
      emoji: '😊',
      description: 'Backhanded compliments',
    },
    {
      value: 'master-yoda',
      label: '🧙 Master Yoda',
      emoji: '🧙',
      description: 'Backwards speak, I will',
    },
    {
      value: 'kenyan-sheng',
      label: '🇰🇪 Kenyan Sheng',
      emoji: '🇰🇪',
      description: 'Mbaya sana!',
    },
  ];

  intensityLabels: Record<
    number,
    { label: string; emoji: string; color: string }
  > = {
    1: { label: 'Gentle Ribbing', emoji: '😊', color: 'text-green-400' },
    2: { label: 'Medium Rare', emoji: '😏', color: 'text-yellow-400' },
    3: { label: 'Well Done', emoji: '🔥', color: 'text-orange-400' },
    4: { label: 'Extra Crispy', emoji: '💥', color: 'text-red-400' },
    5: { label: 'Absolutely Charred', emoji: '☠️', color: 'text-purple-400' },
  };

  roastMutations = injectMutation(() => ({
    mutationFn: async (request: RoastRequest) => {
      const callable = httpsCallable<RoastRequest, string>(
        this.functions,
        'githubGrillerFunction',
      );
      const result = await callable(request);
      console.log('Roast result:', result);
      return result.data;
    },
    onSuccess: (data: string) => {
      console.log('Roast successful:', data);
      this.isRoastCardOpen.set(true);
    },
    onError: (error: unknown) => {
      console.error('Roast failed:', error);
      alert('Failed to roast the user. Please try again.');
    },
  }));

  submitRoast(): void {
    if (this.username().trim()) {
      this.roastMutations.mutate({
        username: this.username(),
        personality: this.selectedPersonality(),
        intensity: this.intensity(),
      });
    }
  }

  closeRoastCard(): void {
    this.isRoastCardOpen.set(false);
  }

  getIntensityInfo() {
    return this.intensityLabels[this.intensity()] || this.intensityLabels[3];
  }

  getSelectedPersonality() {
    return (
      this.personalities.find((p) => p.value === this.selectedPersonality()) ||
      this.personalities[0]
    );
  }
}
