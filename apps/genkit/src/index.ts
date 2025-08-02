import { enableFirebaseTelemetry } from '@genkit-ai/firebase';
import { gemini20Flash, googleAI } from '@genkit-ai/googleai';
import { defineSecret } from 'firebase-functions/params';
import { onCallGenkit } from 'firebase-functions/v2/https';
import { genkit, z } from 'genkit';

enableFirebaseTelemetry();

const githubToken = defineSecret('GITHUB_TOKEN');
const geminiApiKey = defineSecret('GEMINI_API_KEY');

const ai = genkit({ plugins: [googleAI()], model: gemini20Flash });

const repoSchema = z.object({
  name: z.string(),
  language: z.string().nullable(),
  pushed_at: z.string(),
  stargazers_count: z.number(),
  forks: z.number(),
});

const githubEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  repo: z.object({
    id: z.number(),
    name: z.string(),
    url: z.string(),
  }),
  payload: z.object({
    commits: z
      .array(
        z.object({
          sha: z.string(),
          author: z.object({
            email: z.string(),
            name: z.string(),
          }),
          message: z.string(),
          distinct: z.boolean(),
          url: z.string(),
        }),
      )
      .optional(),
  }),
});

const githubEventsArraySchema = z.array(githubEventSchema);

const fetchGithubRepos = ai.defineTool(
  {
    name: 'fetchGithubRepos',
    description:
      'Fetches a list of public repositories for a given GitHub username sorted by pushed date (recently updated).',
    // Input validation using Zod
    inputSchema: z.object({ username: z.string() }),
    // Output validation using Zod
    outputSchema: z.array(repoSchema),
  },
  async ({ username }) => {
    console.log(`Fetching repos for ${username}`);
    const response = await fetch(
      // Fetch the last 15 repos sorted by pushed date
      `https://api.github.com/users/${username}/repos?sort=pushed&per_page=15`,
      {
        headers: {
          // Use the GitHub token from your .env file
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Genkit-Repo-Roaster-Agent', // GitHub requires a User-Agent
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch repos from GitHub: ${response.statusText}`,
      );
    }

    const repos = await response.json();
    const reposParsed = z.array(repoSchema).parse(repos);

    // We only care about a few properties, so we map the response
    // to match our repoSchema. This keeps the data clean.
    return reposParsed.map((repo) => ({
      name: repo.name,
      language: repo.language,
      pushed_at: repo.pushed_at,
      stargazers_count: repo.stargazers_count,
      forks: repo.forks,
    }));
  },
);

const fetchCommitMessages = ai.defineTool(
  {
    name: 'fetchCommitMessages',
    description:
      'Fetches commit messages from the last 100 events of a GitHub user.',
    inputSchema: z.object({
      owner: z.string(),
    }),
    outputSchema: z.array(z.string()),
  },
  async ({ owner }) => {
    const response = await fetch(
      // https://api.github.com/users/mainawycliffe/events
      `https://api.github.com/users/${owner}/events?per_page=100`, // Fetch the last 100 events
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Genkit-Repo-Roaster-Agent',
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch commit messages from GitHub: ${response.statusText}`,
      );
    }

    const commits = await response.json();
    const commitsParsed = githubEventsArraySchema.parse(commits);
    console.log({ commitsParsed });
    return (
      commitsParsed
        // Filter for PushEvent type and extract commit messages
        .filter((event) => event.type === 'PushEvent')
        .map((commit) => commit.payload.commits.map((c) => c.message))
        .flat()
    );
  },
);

const githubGrillerFlow = ai.defineFlow(
  {
    name: 'githubGrillerFlow',
    inputSchema: z.object({
      username: z.string(),
    }),
    outputSchema: z.string(),
  },
  async ({ username }, streamCallack) => {
    const { response, stream } = ai.generateStream({
      prompt: `
          You are a witty, sarcastic, and expert code reviewer. Your name is "Ripper - The Roast master".
          
          Your task is to write a short, funny roast of a developer based on their public GitHub repositories.

          Be playful and clever, not truly mean (but also, don't hold back).

          Here's the data for the user "${username}". 
          
          Using the provided tools, you will fetch their GitHub repositories and commit messages, and then roast them based on their activity.

          Roast them! Consider these angles:
          - Too many unfinished projects (look at the 'pushed_at' dates).
          - Sticking to only one language (e.g., "Ah, another JavaScript connoisseur").
          - Weird or unoriginal repository names.
          - A graveyard of forked repos with no original work.
          - A complete lack of stars.

          You only have one task: roast the developer based on their GitHub activity and nothing else.

          Return the roast as a single string, no other text or explanation needed.
      `,
      tools: [fetchGithubRepos, fetchCommitMessages],
      config: {
        temperature: 0.8,
      },
    });

    for await (const chunk of stream) {
      streamCallack(chunk);
    }

    const { text } = await response;
    console.log({ text });

    return text;
  },
);

export const githubGrillerFunction = onCallGenkit(
  {
    secrets: [githubToken, geminiApiKey],
  },
  githubGrillerFlow,
);
