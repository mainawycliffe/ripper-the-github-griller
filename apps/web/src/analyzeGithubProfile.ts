// functions/src/analyzeGithubProfile.ts
import * as functions from 'firebase-functions';
import fetch from 'node-fetch';

// Import genkit - adjust import path to your installed Genkit SDK
import { genkit, runFlow } from '@genkit-ai/core';
import { gemini15Pro } from '@genkit-ai/google';

// Initialize genkit/AI client (adjust based on SDK docs)
const ai = genkit({
  plugins: [gemini15Pro()],
  // If SDK requires API key, get it via functions.config()
  // key: functions.config().genkit.key
});

type Repo = {
  name: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
};

function summarizeRepoStats(repos: Repo[]) {
  const totalStars = repos.reduce((s, r) => s + (r.stargazers_count || 0), 0);
  const totalForks = repos.reduce((s, r) => s + (r.forks_count || 0), 0);

  const languageCounts: Record<string, number> = {};
  repos.forEach(r => {
    const l = r.language || 'Unknown';
    languageCounts[l] = (languageCounts[l] || 0) + 1;
  });
  const topLanguages = Object.entries(languageCounts)
    .sort((a,b) => b[1] - a[1])
    .slice(0,3)
    .map(([lang,c]) => `${lang} (${c} repo${c>1?'s':''})`);

  // Very small trend heuristic: recent commit density by updated_at
  const recentCount = repos.filter(r => {
    const updated = new Date(r.updated_at);
    const days = (Date.now() - updated.getTime()) / (1000*60*60*24);
    return days <= 30;
  }).length;

  return { totalStars, totalForks, topLanguages, recentCount };
}

export const analyzeGithubProfile = functions.https.onRequest(async (req, res) => {
  try {
    const username = (req.query.username || req.body.username) as string;
    if (!username) return res.status(400).json({ error: 'username required' });

    // Fetch GitHub user + repos (public only)
    const userResp = await fetch(`https://api.github.com/users/${username}`);
    if (!userResp.ok) return res.status(404).json({ error: 'github user not found' });
    const user = await userResp.json();

    // Fetch repos (could paginate; sample fetch grabs first page)
    const reposResp = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`);
    const repos: Repo[] = await reposResp.json();

    const repoSummary = summarizeRepoStats(repos);

    // Build structured data to send to AI
    const aiInput = {
      username: user.login,
      name: user.name,
      bio: user.bio,
      followers: user.followers,
      public_repos: user.public_repos,
      totalStars: repoSummary.totalStars,
      totalForks: repoSummary.totalForks,
      topLanguages: repoSummary.topLanguages,
      reposAnalyzed: repos.length,
      recentActiveReposLast30Days: repoSummary.recentCount
    };

    // Compose AI prompt
    const prompt = `
You are "Ripper Pro" — an AI that converts GitHub profile data into three short,
professional insight cards tailored for engineering managers and recruiters.
Produce:
1) Strengths: short (1-2 sentences) - what the dev is strongest at technically.
2) Productivity Trend: short (1-2 sentences) - activity and consistency comment.
3) Recommendation: short action or suggestion for manager/recruiter.

Keep output as a JSON object:
{
  "strengths": "text",
  "trend": "text",
  "recommendation": "text"
}

Here is the input data:
${JSON.stringify(aiInput, null, 2)}
    `;

    // Call Genkit/Gemini - adjust runFlow usage to the actual SDK
    // Example generic call (replace with actual SDK usage if different)
    const aiResponse = await runFlow(ai, {
      model: 'gemini-1.5-pro',
      prompt,
      max_output_tokens: 350
    });

    // Assume aiResponse.output_text contains the assistant's reply
    let aiText = (aiResponse as any).output_text || aiResponse.text || aiResponse;

    // Try to parse JSON from AI output robustly
    let aiJson: any = null;
    try {
      // sometimes the model returns JSON embedded in text
      const firstJson = aiText.match(/\{[\s\S]*\}$/m);
      aiJson = firstJson ? JSON.parse(firstJson[0]) : JSON.parse(aiText);
    } catch (e) {
      // fallback: return raw text
      return res.json({ ok: true, profile: aiInput, rawAI: aiText });
    }

    // (Optional) store to Firestore: omitted here (add if you want logs)

    return res.json({ ok: true, profile: aiInput, insights: aiJson });

  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'server error' });
  }
});
