import fs from 'fs'

/**
 * Extracts a specific regex line from the 'test' function in a file.
 *
 * @param filePath - The path to the file.
 * @returns The extracted line or null if not found.
 */
export function getLineFromTest(filePath: string): string | null {
  try {
    const fileContent: string = fs.readFileSync(filePath, 'utf8')

    // Regex to match the 'test' function block
    const testFunctionRegex: RegExp =
      /test\('fix blurry images', async \(t\) => {([\s\S]*?).*t.end().*\}\)/

    const matchTestFunction: RegExpMatchArray | null =
      fileContent.match(testFunctionRegex)
    if (!matchTestFunction) return null

    // Extract the content of the test function
    const testFunctionContent: string = matchTestFunction[1]

    // Regex to match the specific line within the test function
    // const regexLineRegex: RegExp = /from: .+\/g,/
    // const regexLineRegex: RegExp = /to: .*,/;


    // const matchRegexLine: RegExpMatchArray | null =
      // testFunctionContent.match(regexLineRegex)
    // return matchRegexLine ? matchRegexLine[0] : null
    return testFunctionContent ? matchTestFunction[0] : null
  } catch (error) {
    console.error('Error occurred:', error)
    return null
  }
}

const filePath: string = './src/__tests__/app.ts'
const regexLine: string | null = getLineFromTest(filePath)
if (regexLine) {
  console.log(regexLine)
} else {
  console.log('Line not found')
}
