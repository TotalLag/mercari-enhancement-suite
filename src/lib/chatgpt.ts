import yargs from 'yargs/yargs'
import { hideBin } from 'yargs/helpers'
import OpenAI from 'openai'
import { Octokit } from '@octokit/rest'
import { Buffer } from 'buffer'

interface Arguments {
  openaiApiKey: string
  githubToken: string
  githubRepo: string
  prId: number
  extractCodeBlock: string
  model: string
}

async function fetchFileContent(
  octokit: Octokit,
  repoDetails: {
    owner: string
    repo: string
    filePath: string
    baseBranch: string
  }
) {
  console.log(`Fetching content for file: ${repoDetails.filePath}`)
  const response = await octokit.repos.getContent({
    owner: repoDetails.owner,
    repo: repoDetails.repo,
    path: repoDetails.filePath,
    ref: repoDetails.baseBranch,
  })
  const fileData = response.data as { sha: string; content: string }
  return {
    content: Buffer.from(fileData.content, 'base64').toString('utf-8'),
    sha: fileData.sha,
  }
}

async function getOpenAIResponse(
  openai: OpenAI,
  prompt: string,
  model: string
) {
  console.log('Requesting response from OpenAI...')
  let retryCount = 0 // Initialize retry counter

  while (retryCount < 6) {
    // Limit retries to 6
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a JSON bot. Your job is to write code as request and not do more. Return the response as a JSON object with 'code' and 'explanation' keys.`,
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0,
      model,
    })

    const responseContent = completion.choices[0].message.content
    if (!responseContent) {
      console.log('No content received, retrying...')
      retryCount++
      continue
    }

    try {
      const responseJson = JSON.parse(responseContent)
      if (responseJson.code && responseJson.explanation) {
        console.log('Valid response received from OpenAI.')
        return responseJson
      }
      console.log('Response did not meet expectations, retrying...')
      retryCount++
    } catch {
      console.log('Failed to parse JSON, retrying...')
      retryCount++
    }
  }
}

async function createOrUpdateBranch(
  octokit: Octokit,
  repoDetails: {
    owner: string
    repo: string
    branchName: string
    baseBranch: string
  }
) {
  console.log(`Creating or updating branch: ${repoDetails.branchName}`)
  const latestCommitSha = (
    await octokit.repos.getBranch({
      owner: repoDetails.owner,
      repo: repoDetails.repo,
      branch: repoDetails.baseBranch,
    })
  ).data.commit.sha

  try {
    await octokit.git.createRef({
      owner: repoDetails.owner,
      repo: repoDetails.repo,
      ref: `refs/heads/${repoDetails.branchName}`,
      sha: latestCommitSha,
    })
    console.log(`Branch '${repoDetails.branchName}' created.`)
  } catch (error) {
    //@ts-ignore
    if (error.status === 422) {
      console.log(
        `Branch '${repoDetails.branchName}' already exists. Force updating...`
      )
      await octokit.git.updateRef({
        owner: repoDetails.owner,
        repo: repoDetails.repo,
        ref: `heads/${repoDetails.branchName}`,
        sha: latestCommitSha,
        force: true,
      })
      console.log(`Branch '${repoDetails.branchName}' has been force updated.`)
    } else {
      throw error
    }
  }
}

async function commitChanges(
  octokit: Octokit,
  commitDetails: {
    owner: string
    repo: string
    filePath: string
    branchName: string
    fileSha: string
    content: string
    message: string
  }
) {
  console.log(
    `Committing changes to ${commitDetails.filePath} on branch ${commitDetails.branchName}`
  )
  await octokit.repos.createOrUpdateFileContents({
    owner: commitDetails.owner,
    repo: commitDetails.repo,
    path: commitDetails.filePath,
    message: commitDetails.message,
    content: Buffer.from(commitDetails.content, 'utf-8').toString('base64'),
    branch: commitDetails.branchName,
    sha: commitDetails.fileSha,
  })
  console.log('Changes committed successfully.')
}

async function handlePullRequest(
  octokit: Octokit,
  prDetails: {
    owner: string
    repo: string
    branchName: string
    baseBranch: string
    title: string
    body: string
  }
) {
  console.log('Handling pull request...')
  const existingPRs = await octokit.pulls.list({
    owner: prDetails.owner,
    repo: prDetails.repo,
    head: `${prDetails.owner}:${prDetails.branchName}`,
    state: 'open',
  })

  let pr
  if (existingPRs.data.length > 0) {
    const existingPR = existingPRs.data[0]
    pr = await octokit.pulls.update({
      owner: prDetails.owner,
      repo: prDetails.repo,
      pull_number: existingPR.number,
      title: prDetails.title,
      body: prDetails.body,
    })
    console.log(`Updated existing pull request #${pr.data.number}.`)
  } else {
    pr = await octokit.pulls.create({
      owner: prDetails.owner,
      repo: prDetails.repo,
      title: prDetails.title,
      head: prDetails.branchName,
      base: prDetails.baseBranch,
      body: prDetails.body,
    })
    console.log(`Created new pull request #${pr.data.number}.`)
  }

  console.log(`Pull request ${pr.data.number} handled successfully.`)
}

async function main() {
  const argv: Arguments = yargs(hideBin(process.argv)).options({
    openaiApiKey: { type: 'string', demandOption: true },
    githubToken: { type: 'string', demandOption: true },
    githubRepo: { type: 'string', demandOption: true },
    prId: { type: 'number', demandOption: true },
    extractCodeBlock: { type: 'string', demandOption: true },
    model: { type: 'string', default: 'gpt-4' },
  }).argv as Arguments

  try {
    console.log('Initializing OpenAI and GitHub clients...')
    const openai = new OpenAI({ apiKey: argv.openaiApiKey })
    const octokit = new Octokit({ auth: argv.githubToken })

    const filePath = 'src/__tests__/fixblurryimages.ts'
    const repo = argv.githubRepo.split('/')
    if (repo.length !== 2) {
      throw new Error(
        'Invalid GitHub repository format. Expected format: owner/repo'
      )
    }
    const [owner, repoName] = repo
    const baseBranch = 'chatgpt-test'

    const { content: fileContent, sha: fileSha } = await fetchFileContent(
      octokit,
      { owner, repo: repoName, filePath, baseBranch }
    )

    const prompt = `
      Given this incomplete code block:
      ${argv.extractCodeBlock}

      And the following code containing a function for fixing blurry images:
      ${fileContent}

      Your task is to locate the 'fix blurry images' function in the provided code above and replace variables in the regex within this function to match those in the incomplete code block. Keep the original format of 'from: [regex]' and 'to: [code]'.

      Return the result as a JSON object with two keys:
      1. 'code': containing the entire updated file's code including the changes made to the 'fix blurry images' function.
      2. 'explanation': a brief explanation of the changes made or why no change was necessary.

      Note: Do not alter or remove backslashes in comments, keep all comments as they are. Do not make changes outside of the function.

      Do not provide any direct response outside this JSON object format. Batch your generation.`

    const responseJson = await getOpenAIResponse(openai, prompt, argv.model)

    const branchName = 'hotfix-update-regex'
    const message = 'Update regex in app.ts based on ChatGPT suggestion'

    await createOrUpdateBranch(octokit, {
      owner,
      repo: repoName,
      branchName,
      baseBranch,
    })
    await commitChanges(octokit, {
      owner,
      repo: repoName,
      filePath,
      branchName,
      fileSha,
      content: responseJson.code,
      message,
    })
    await handlePullRequest(octokit, {
      owner,
      repo: repoName,
      branchName,
      baseBranch,
      title: message,
      body: `This pull request updates the regex in app.ts based on ChatGPT suggestions. \n\n### Explanation of changes:\n\n${responseJson.explanation}`,
    })
  } catch (error) {
    console.error('Error during execution:', error)
  }
}

main().catch(console.error)
