import test from 'tape'
import { replaceInFile as replace } from 'replace-in-file'

test('reset version check', async (t) => {
  const options = {
    files: './src/utils.ts',
    from: /(const checkVersion: string = ")(.*)(")/g,
    to: `$10.0.0.0$3`,
  }

  const results = await replace(options)
  t.ok(results[0].hasChanged)
  t.end()
})

test('reset manifest', async (t) => {
  const options = {
    files: ['./public/manifest.json', './package.json'],
    from: /("version": ")(.*)(")/g,
    to: `$10.0.0.0$3`,
  }

  const results = await replace(options)
  t.ok(results[0].hasChanged)
  t.end()
})
