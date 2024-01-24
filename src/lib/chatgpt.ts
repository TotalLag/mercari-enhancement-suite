import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import OpenAI from 'openai';
import { Octokit } from '@octokit/rest';
import { Buffer } from 'buffer';

interface Arguments {
  openaiApiKey: string;
  githubToken: string;
  githubRepo: string;
  prId: number;
  extractCodeBlock: string;
  model: string;
}

async function main() {
  const argv = yargs(hideBin(process.argv)).options({
    openaiApiKey: { type: 'string', demandOption: true },
    githubToken: { type: 'string', demandOption: true },
    githubRepo: { type: 'string', demandOption: true },
    prId: { type: 'number', demandOption: true },
    extractCodeBlock: { type: 'string', demandOption: true },
    model: { type: 'string', default: 'gpt-4' },
  }).argv as Arguments;

  try {
    console.log('Initializing OpenAI and Octokit clients...');
    const openai = new OpenAI({ apiKey: argv.openaiApiKey });
    const octokit = new Octokit({ auth: argv.githubToken });

    const filePath = 'src/__tests__/app.ts';
    const repo = argv.githubRepo.split('/');
    if (repo.length !== 2) {
      throw new Error('Invalid GitHub repository format. Expected format: owner/repo');
    }
    const owner = repo[0];
    const repoName = repo[1];
    const branchName = 'hotfix-update-regex';
    const baseBranch = 'chatgpt-test';

    console.log(`Fetching file content from GitHub for ${filePath}`);
    const fileResponse = await octokit.repos.getContent({
      owner,
      repo: repoName,
      path: filePath,
      ref: baseBranch,
    });

    const fileData = fileResponse.data as { sha: string; content: string; }
    const fileSha: string = fileData.sha;
    const fileContent: string = Buffer.from(fileData.content, 'base64').toString('utf-8');

    const prompt = `
    Given this incomplete code block:
    ${argv.extractCodeBlock}

    I need to update the function for fixing blurry images for matching this code. The original file is:
    ${fileContent}

    Your task is to replace variables in the regex to match those in the code block. Keep the format as 'from: [regex]' and 'to: [code]'. Do not update any other code that isn't part of the function.
    
    You do not need to explain yourself, just return full code. If no change is required, simply return the original file without saying anything more or less.`

    console.log('Requesting new code from OpenAI...');
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a batch processing bot. Your job is to update variables in the provided function only while maintaining the format. No other explanation, no quotes, only code. You will output the entire updated file so it can be checked into git.`,
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0,
      model: argv.model,
    });

    const newFileContent = completion.choices[0].message.content;
    if (!newFileContent) {
      throw new Error('No content received from OpenAI completion.');
    }

    console.log('Creating a new branch for the pull request...');
    const latestCommitSha = (await octokit.repos.getBranch({
      owner,
      repo: repoName,
      branch: baseBranch,
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
      content: Buffer.from(newFileContent, 'utf-8').toString('base64'),
      branch: branchName,
      sha: fileSha,
    });

    console.log('Creating a pull request...');
    await octokit.pulls.create({
      owner,
      repo: repoName,
      title: 'Update Regex in app.ts',
      head: branchName,
      base: baseBranch,
      body: 'This pull request updates the regex in app.ts based on ChatGPT suggestions.',
    });

    console.log('Pull request created successfully.');
  } catch (error) {
    console.error('Error during execution:', error);
  }
}

main().catch(console.error);
