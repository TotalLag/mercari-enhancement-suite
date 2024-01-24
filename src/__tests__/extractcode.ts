import test from 'tape'
import fs from 'fs'

/**
 * Extracts characters around a matched pattern in a file.
 *
 * @param filePath - The path to the file.
 * @param pattern - The regex pattern to match in the file.
 * @param charsAround - The number of characters around the matched pattern to include.
 * @returns The extracted code or undefined if no match is found.
 */
function extractCharactersAround(
  filePath: string,
  pattern: RegExp,
  charsAround: number
): string | undefined {
  try {
    const fileContent: string = fs.readFileSync(filePath, 'utf8')
    const match: RegExpExecArray | null = pattern.exec(fileContent)

    if (!match) {
      console.log('No matching pattern found')
      return undefined
    }

    const matchStart: number = match.index
    const start: number = Math.max(0, matchStart - charsAround)
    const end: number = Math.min(
      fileContent.length,
      matchStart + match[0].length + charsAround
    )

    return fileContent.substring(start, end)
  } catch (error) {
    console.error('Error occurred:', error)
    return undefined
  }
}

test('Check code block', async (t) => {
  const filePath: string = './public/js/app.js'
  const pattern: RegExp = /\.toDataURL\("image\/jpeg"\);/
  const charsAround: number = 100 // Number of characters to extract before and after the pattern

  const result: string | undefined = extractCharactersAround(
    filePath,
    pattern,
    charsAround
  )
  if (result) {
    console.log(result)
  }

  t.end()
})
