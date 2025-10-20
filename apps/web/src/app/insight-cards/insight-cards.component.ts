// apps/web/src/app/insight-cards/insight-cards.component.ts
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface InsightResponse {
  ok: boolean;
  profile: any;
  insights?: {
    strengths?: string;
    trend?: string;
    recommendation?: string;
  };
  rawAI?: string;
}

@Component({
  selector: 'app-insight-cards',
  templateUrl: './insight-cards.component.html',
})
export class InsightCardsComponent {
  username = '';
  loading = false;
  error = '';
  result: InsightResponse | null = null;

  // Update this to your deployed cloud function URL when deployed
  private ANALYZE_URL = 'https://us-central1-YOUR_FIREBASE_PROJECT.cloudfunctions.net/analyzeGithubProfile';

  constructor(private http: HttpClient) {}

  analyze() {
    this.error = '';
    if (!this.username) { this.error = 'Enter a GitHub username'; return; }
    this.loading = true;
    this.result = null;

    this.http.post<InsightResponse>(this.ANALYZE_URL, { username: this.username })
      .subscribe({
        next: (res) => { this.result = res; this.loading = false; },
        error: (err) => { this.error = (err?.error?.error||err.message||'Failed'); this.loading = false; }
      });
  }

  copySummary() {
    const text = this.result?.insights ? 
      `Ripper Pro insights for ${this.result.profile.username}:\n\nStrengths: ${this.result.insights.strengths}\nTrend: ${this.result.insights.trend}\nRecommendation: ${this.result.insights.recommendation}` :
      this.result?.rawAI || 'No insights';
    navigator.clipboard.writeText(text);
  }
}
