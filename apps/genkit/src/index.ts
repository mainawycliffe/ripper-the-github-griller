import { enableFirebaseTelemetry } from '@genkit-ai/firebase';
import { vertexAI } from '@genkit-ai/vertexai';
import { defineSecret } from 'firebase-functions/params';
import { onCallGenkit } from 'firebase-functions/v2/https';
import { genkit, z } from 'genkit';

enableFirebaseTelemetry();

const githubToken = defineSecret('GITHUB_TOKEN');

const ai = genkit({
  plugins: [vertexAI()],
  model: vertexAI.model('gemini-2.5-flash'),
});

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

const fetchLanguageStats = ai.defineTool(
  {
    name: 'fetchLanguageStats',
    description:
      'Analyzes programming languages used across all repositories to calculate usage statistics.',
    inputSchema: z.object({ username: z.string() }),
    outputSchema: z.object({
      languages: z.record(z.string(), z.number()),
      totalRepos: z.number(),
      topLanguages: z.array(
        z.object({
          name: z.string(),
          count: z.number(),
          percentage: z.number(),
        }),
      ),
    }),
  },
  async ({ username }) => {
    console.log(`Analyzing language stats for ${username}`);

    // First get all repos (up to 100)
    const response = await fetch(
      `https://api.github.com/users/${username}/repos?per_page=100&type=all`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Genkit-Repo-Roaster-Agent',
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch repos: ${response.statusText}`);
    }

    const repos = await response.json();
    const languages: Record<string, number> = {};
    let totalRepos = 0;

    // Count languages
    for (const repo of repos) {
      if (repo.language) {
        languages[repo.language] = (languages[repo.language] || 0) + 1;
        totalRepos++;
      }
    }

    // Calculate top languages with percentages
    const topLanguages = Object.entries(languages)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / totalRepos) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      languages,
      totalRepos,
      topLanguages,
    };
  },
);

const fetchStarredRepos = ai.defineTool(
  {
    name: 'fetchStarredRepos',
    description:
      'Fetches repositories that the user has starred to analyze their interests vs their own work.',
    inputSchema: z.object({ username: z.string() }),
    outputSchema: z.object({
      totalStarred: z.number(),
      topStarredLanguages: z.array(z.string()),
      recentStars: z.array(
        z.object({
          name: z.string(),
          language: z.string().nullable(),
          description: z.string().nullable(),
          stargazers_count: z.number(),
        }),
      ),
    }),
  },
  async ({ username }) => {
    console.log(`Fetching starred repos for ${username}`);

    const response = await fetch(
      `https://api.github.com/users/${username}/starred?per_page=20&sort=created`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Genkit-Repo-Roaster-Agent',
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch starred repos: ${response.statusText}`);
    }

    const starred = await response.json();

    const languageCount: Record<string, number> = {};
    const recentStars = starred
      .slice(0, 10)
      .map(
        (repo: {
          name: string;
          language: string | null;
          description: string | null;
          stargazers_count: number;
        }) => {
          if (repo.language) {
            languageCount[repo.language] =
              (languageCount[repo.language] || 0) + 1;
          }
          return {
            name: repo.name,
            language: repo.language,
            description: repo.description,
            stargazers_count: repo.stargazers_count,
          };
        },
      );

    const topStarredLanguages = Object.entries(languageCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([lang]) => lang);

    return {
      totalStarred: starred.length,
      topStarredLanguages,
      recentStars,
    };
  },
);

const fetchCommitMessages = ai.defineTool(
  {
    name: 'fetchCommitMessages',
    description:
      'Fetches commit messages from the last 100 events of a GitHub user.',
    inputSchema: z.object({
      username: z.string(),
    }),
    outputSchema: z.array(z.string()),
  },
  async ({ username }) => {
    const response = await fetch(
      // https://api.github.com/users/mainawycliffe/events
      `https://api.github.com/users/${username}/events?per_page=100`, // Fetch the last 100 events
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
        .filter(
          (event) => event.payload.commits && event.payload.commits.length > 0,
        )
        .flatMap(
          (commit) => commit.payload.commits?.map((c) => c.message) || [],
        )
    );
  },
);

const fetchGithubUserProfile = ai.defineTool(
  {
    name: 'fetchGithubUserProfile',
    description:
      'Fetches the public profile of a GitHub user including bio, followers, company, etc.',
    inputSchema: z.object({ username: z.string() }),
    outputSchema: z.object({
      login: z.string(),
      id: z.number(),
      avatar_url: z.string(),
      html_url: z.string(),
      name: z.string().nullable(),
      company: z.string().nullable(),
      blog: z.string().nullable(),
      location: z.string().nullable(),
      bio: z.string().nullable(),
      public_repos: z.number(),
      followers: z.number(),
      following: z.number(),
      created_at: z.string(),
      updated_at: z.string(),
    }),
  },
  async ({ username }) => {
    console.log(`Fetching profile for ${username}`);
    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Genkit-Repo-Roaster-Agent',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch GitHub user profile: ${response.statusText}`,
      );
    }

    const profile = await response.json();

    return {
      login: profile.login,
      id: profile.id,
      avatar_url: profile.avatar_url,
      html_url: profile.html_url,
      name: profile.name,
      company: profile.company,
      blog: profile.blog,
      location: profile.location,
      bio: profile.bio,
      public_repos: profile.public_repos,
      followers: profile.followers,
      following: profile.following,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };
  },
);

const githubGrillerFlow = ai.defineFlow(
  {
    name: 'githubGrillerFlow',
    inputSchema: z.object({
      username: z.string(),
      personality: z
        .enum([
          'default',
          'gordon-ramsay',
          'pirate',
          'shakespeare',
          'gen-z',
          'nice-guy',
          'master-yoda',
          'kenyan-sheng',
        ])
        .default('default'),
      intensity: z.number().min(1).max(5).default(3),
    }),
    outputSchema: z.string(),
  },
  async ({ username, personality, intensity }, streamCallack) => {
    // First, check if the user exists
    const userCheckResponse = await fetch(
      `https://api.github.com/users/${username}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Genkit-Repo-Roaster-Agent',
        },
      },
    );

    // Map intensity to temperature (1=0.3, 2=0.5, 3=0.7, 4=0.9, 5=1.2)
    const temperatureMap: Record<number, number> = {
      1: 0.3,
      2: 0.5,
      3: 0.7,
      4: 0.9,
      5: 1.2,
    };

    const temperature = temperatureMap[intensity] || 0.7;

    // Define personality prompts
    const personalityPrompts: Record<string, string> = {
      default:
        'You are a witty, sarcastic, and expert code reviewer. Your name is "Ripper - The Roast master".',
      'gordon-ramsay':
        'You are Gordon Ramsay in a kitchen, but instead of cooking, you\'re reviewing code. Use cooking metaphors and be brutally honest like Gordon. Call their code "raw", "overcooked", or "an absolute disaster". Use phrases like "What are you doing?!", "This code is so bad, it\'s insulting!", and "Shut it down!"',
      pirate:
        'You are a pirate captain reviewing code on the high seas. Use pirate slang like "Arrr", "Shiver me timbers", "Ye scurvy dog", and nautical metaphors. Talk about their code being "shipwrecked", "walking the plank", or "buried treasure" (if anything is good).',
      shakespeare:
        'You are William Shakespeare reviewing code in the style of his plays. Use eloquent, theatrical language, iambic pentameter when possible, and references to his works. Be dramatic and poetic with phrases like "To code or not to code", "What light through yonder window breaks? \'Tis bugs.", and "O Romeo, Romeo, wherefore art thou Romeo... and why is this code so terrible?"',
      'gen-z':
        'You are a Gen Z developer who speaks in modern slang and memes. Use terms like "no cap", "bussin", "mid", "L code", "ratio", "it\'s giving", "slay" (sarcastically), "touch grass", "main character energy" (negative), and emoji-style descriptions. Be sassy and use internet culture references.',
      'nice-guy':
        'You are overly nice and positive, but every compliment is actually a backhanded insult. Use phrases like "It\'s so brave of you to...", "I love how you don\'t let inexperience stop you", "Your code has so much... personality", "Not everyone needs to follow best practices", and "You\'re definitely making... choices." Be passive-aggressive.',
      'master-yoda':
        'You are Master Yoda reviewing code. Speak in Yoda\'s distinctive backwards syntax. Use Star Wars references and wisdom about the Force. Say things like "Much to learn, you have", "Strong with bugs, this code is", "Do or do not, there is no try... and trying, you were not", "Fear leads to anger, anger leads to hate, hate leads to spaghetti code". Be wise yet brutally honest.',
      'kenyan-sheng':
        'You are a Kenyan developer who roasts in Sheng (Kenyan street slang). Be direct, creative and use Nairobi/Kenya street language humor.',
    };

    const personalityPrompt =
      personalityPrompts[personality] || personalityPrompts['default'];

    // Adjust roast intensity based on level
    const intensityGuidelines: Record<number, string> = {
      1: 'Keep it very gentle and light-hearted. Focus on minor quirks and be mostly encouraging with just a hint of teasing.',
      2: 'Be mildly sarcastic. Point out some issues but keep it friendly and constructive.',
      3: 'Standard roasting - be witty and sarcastic with good-natured burns. This is the sweet spot.',
      4: "Turn up the heat. Be more aggressive and don't hold back, but keep it clever and funny.",
      5: 'Absolutely savage. Go all out with brutal honesty and devastating burns. No mercy.',
    };

    const intensityGuideline =
      intensityGuidelines[intensity] || intensityGuidelines[3];

    // If user not found, have the LLM generate a roast about the non-existent user
    if (userCheckResponse.status === 404) {
      const { response, stream } = ai.generateStream({
        prompt: `
          ${personalityPrompt}
          
          ${intensityGuideline}
          
          The user tried to get roasted but entered a username "${username}" that doesn't exist on GitHub (404 error).
          
          Roast them for this mistake! Make it funny and creative. Consider these angles:
          - They can't even type a username correctly
          - They're trying to roast a ghost/imaginary person
          - The irony of failing at getting roasted
          - Suggest they check their spelling but in a sarcastic way
          
          Keep it short and punchy (2-3 sentences). Stay in character based on your personality! Use emojis like 💀🎃👻🤦🔥 to keep the Halloween theme.
        `,
        config: {
          temperature: temperature,
        },
        model: vertexAI.model('gemini-2.0-flash-exp'),
      });

      for await (const chunk of stream) {
        streamCallack(chunk);
      }

      const { text } = await response;
      return text;
    }

    // Continue with normal roasting flow for valid users
    const { response, stream } = ai.generateStream({
      prompt: `
          ${personalityPrompt}
          
          Your task is to write a short, funny roast of a developer based on their public GitHub profile and activity.

          ${intensityGuideline}

          Be playful and clever, not truly mean (but also, don't hold back). Keep it short and punchy, around 3-5 sentences.

          Here's the Github Username: "${username}". 
          
          You have access to several tools to fetch their GitHub data (profile, repositories, commit messages, language statistics, and starred repositories). Try to use these tools to gather information, but if any tool fails, work with whatever data you successfully retrieved. Even if all tools fail, roast them based on the username alone or the fact that their profile couldn't be accessed!

          Roast them! Consider these angles:
          
          **Profile-based roasts:**
          - Cringe bio or lack thereof
          - Follower-to-following ratio (are they desperately following everyone?)
          - Generic or pretentious company names
          - Blog links that don't work or lead to abandoned WordPress sites
          - Account age vs activity (old account, no contributions?)
          - Location-based stereotypes (if appropriate and not offensive)
          
          **Repository-based roasts:**
          - Too many unfinished projects (look at the 'pushed_at' dates)
          - Weird or unoriginal repository names
          - A graveyard of forked repos with no original work
          - Complete lack of stars or engagement
          - Tutorial follow-alongs disguised as "projects"
          
          **Language Statistics roasts:**
          - Over-reliance on one language (e.g., "99% JavaScript - we get it, you're 'full-stack'")
          - Language choices that don't match their aspirations
          - Trendy language hopping without depth
          
          **Starred Repository roasts:**
          - Stars advanced ML/AI repos but only creates basic CRUD apps
          - Thousands of stars but zero original contributions
          - Starring pattern reveals their unrealistic ambitions vs actual skill level
          - Stars everything but contributes to nothing
          
          **Commit-based roasts:**
          - Terrible commit messages ("fixed stuff", "asdf", ".")
          - Inconsistent coding patterns
          - Too many "fix" commits in a row

          **If data fetching fails:**
          - Roast them for having an inaccessible profile
          - Make jokes about their username
          - Roast them for hiding their terrible code behind private repos
          - Question if they even exist or are just a ghost account

          Return the roast as a single string, no other text or explanation needed. Stay in character based on your personality! Work with whatever data you can get - don't mention that tools failed, just be creative with what you have!
      `,
      tools: [
        fetchGithubRepos,
        // fetchCommitMessages,
        fetchGithubUserProfile,
        fetchLanguageStats,
        fetchStarredRepos,
      ],
      config: {
        temperature: temperature,
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
    secrets: [githubToken],
  },
  githubGrillerFlow,
);
