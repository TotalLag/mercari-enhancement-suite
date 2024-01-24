import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import OpenAI from 'openai';
import { Octokit } from '@octokit/rest';
import { getLineFromTest } from './getlinefromtest';

interface Arguments {
  openaiApiKey: string;
  githubToken: string;
  githubRepo: string;
  prId: number;
  extractCodeBlock: string;
  model: string;
}

interface GitHubFileContent {
  content?: string;
  sha?: string;
}

async function main() {
  const argv = yargs(hideBin(process.argv)).options({
    openaiApiKey: { type: 'string', demandOption: true },
    githubToken: { type: 'string', demandOption: true },
    githubRepo: { type: 'string', demandOption: true },
    prId: { type: 'number', demandOption: true },
    extractCodeBlock: { type: 'string', demandOption: true },
    model: { type: 'string', default: 'gpt-4' },
  }).argv as Arguments

  console.log('Initializing OpenAI and Octokit clients...');
  const openai = new OpenAI({ apiKey: argv.openaiApiKey });
  const octokit = new Octokit({ auth: argv.githubToken });

  const filePath = 'src/__tests__/app.ts';
  console.log(`Extracting regex line from ${filePath}`);
  const replaceLine = getLineFromTest(filePath);

  if (replaceLine === null) {
    throw new Error('Failed to extract regex line from the test file.');
  }

  console.log(`Original regex to be replaced: ${replaceLine}`);
  const prompt = `
  Given this incomplete code block:
  ${argv.extractCodeBlock}

  I need to update a regex for matching this code. The original regex is:
  ${replaceLine}

  Your task is to replace variables in the regex to match those in the code block. Keep the format as 'from: [regex]'. Do not change 'from:' to 'to:' or anything else. Just update the variables inside the regex.
  
  If no change is required, simply return the original regex without saying anything more or less.`

  console.log('Requesting new regex from OpenAI...');
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `You are to update variables in the regex pattern only. Maintain the format as 'from: [updated regex]'. Do not change any other part of the format. Be concise.`,
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0,
    model: argv.model,
  })

  const newRegex = completion.choices[0].message.content;
  if (newRegex === null) {
    throw new Error('No content received from OpenAI completion.');
  }

  console.log(`Received new regex: ${newRegex}`);

  const repo = argv.githubRepo.split('/');
  const owner = repo[0];
  const repoName = repo[1];
  const branchName = 'hotfix-update-regex';

  console.log(`Fetching file content from GitHub for ${filePath}`);
  const fileResponse = await octokit.repos.getContent({
    owner,
    repo: repoName,
    path: filePath,
    ref: 'chatgpt-test',
  });

  const contentData: GitHubFileContent = fileResponse.data as GitHubFileContent;
  //@ts-ignore
  let fileContent = Buffer.from(contentData.content, 'base64').toString('utf-8');
  fileContent = fileContent.replace(new RegExp(replaceLine, 'g'), newRegex);
  console.log(fileContent)

  console.log('Creating a new branch for the pull request...');
  const latestCommitSha = (await octokit.repos.getBranch({
    owner,
    repo: repoName,
    branch: 'chatgpt-test',
  })).data.commit.sha;
  await octokit.git.createRef({
    owner,
    repo: repoName,
    ref: `refs/heads/${branchName}`,
    sha: latestCommitSha,
  });

  console.log(`Committing updated content to branch ${branchName}`);
  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo: repoName,
    path: filePath,
    message: 'Update regex in app.ts based on ChatGPT suggestion',
    content: Buffer.from(fileContent).toString('base64'),
    branch: branchName,
    sha: contentData.sha,
  });

  console.log('Creating a pull request...');
  await octokit.pulls.create({
    owner,
    repo: repoName,
    title: 'Update Regex in app.ts',
    head: branchName,
    base: 'chatgpt-test',
    body: 'This pull request updates the regex in app.ts based on ChatGPT suggestions.',
  });

  console.log('Pull request created successfully.');
}

main().catch(console.error);
