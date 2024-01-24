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

    const fileData = fileResponse.data as { sha: string; content: string; };
    const fileSha: string = fileData.sha;
    const fileContent: string = Buffer.from(fileData.content, 'base64').toString('utf-8');

    const prompt = `
Given this incomplete code block:
${argv.extractCodeBlock}

I need to update the function for fixing blurry images to match this code. The original file is:
${fileContent}

Please format your response as a JSON object with two keys: 'code' for the updated code and 'explanation' for a brief explanation of the changes made. If no change is required, return the original file in the 'code' key with an explanation that no change is necessary in the 'explanation' key.`

    console.log('Requesting new code and explanation from OpenAI...');
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a batch processing bot. Your job is to update variables in the provided function only while maintaining the format. Return the response as a JSON object with 'code' and 'explanation' keys.`,
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0,
      model: argv.model,
    });

    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error('No content received from OpenAI completion.');
    }

    // Parse the response as JSON
    let responseJson;
    try {
      responseJson = JSON.parse(responseContent);
    } catch (error) {
      throw new Error('Failed to parse the response from OpenAI as JSON.');
    }

    if (!responseJson.code || !responseJson.explanation) {
      throw new Error('The response from OpenAI is incomplete.');
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
      content: Buffer.from(responseJson.code, 'utf-8').toString('base64'),
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
      body: `This pull request updates the regex in app.ts based on ChatGPT suggestions. \n\nExplanation of changes:\n${responseJson.explanation}`,
    });

    console.log('Pull request created successfully.');
  } catch (error) {
    console.error('Error during execution:', error);
  }
}

main().catch(console.error);
