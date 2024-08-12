import test from 'tape'
import { load } from 'cheerio'
import { replaceInFile as replace } from 'replace-in-file'
import { existsSync } from 'fs'
import { writeFile } from 'fs/promises'
import { checkVersion, sleep } from '../utils'
import { fixBlurryImages } from './fixblurryimages'
const fetch = require('cross-fetch')

const headers = new fetch.Headers({
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36',
  'Cache-Control': 'no-cache',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
})

var appVersion: string
var updated: boolean = false

test('loads the page and find script url', async (t) => {
  await sleep(Math.random() * 5000)
  const source = await fetch('https://www.mercari.com/sell/', { headers })
  const html = await source.text()
  const $ = load(html)
  const scriptTags = $('script[src*=_app]')
  const appURL = scriptTags.first().attr('src')
  appVersion = (appURL?.match(/\/*(?:^v)?\d+(?:\.\d+)+/) ?? '')[0]
  updated = checkVersion !== appVersion

  t.assert(appURL !== undefined, 'Page should have asset URL')
  t.ok(appURL?.includes(appVersion), 'Asset URL should contain version')

  const response = await fetch(appURL)
  const buffer = await response.buffer()
  await writeFile('./public/js/app.js', buffer)

  t.ok(existsSync('./public/js/app.js'), 'Downloaded the asset')
  t.end()

  test('update version check', { skip: !updated }, async (t) => {
    const options = {
      files: './src/utils.ts',
      from: /(const checkVersion: string = ')(.*)(')/g,
      to: `$1${appVersion}$3`,
    }

    const results = await replace(options)
    t.ok(results[0].hasChanged)
    t.end()
  })

  test('update manifest', { skip: !updated }, async (t) => {
    const options = {
      files: ['./public/manifest.json', './package.json'],
      from: /("version": ")(.*)(")/g,
      to: `$1${appVersion}$3`,
    }

    const results = await replace(options)
    t.ok(results[0].hasChanged)
    t.end()
  })
})

test('fix blurry images', async (t) => {
  const results = await fixBlurryImages()
  t.ok(results[0].hasChanged)
  t.end()
})

// test("piggyback ready check", async (t) => {
//   const options = {
//     files: "./public/js/app.js",
//     from: /({"complete"===document.readyState&&\(clearInterval\(readyStateCheckInterval\),searchAnimations\(\))(\)})/g,
//     to: "$1,myCustomFunc()$2",
//   };

//   const results = await replace(options);
//   t.ok(results[0].hasChanged);
//   t.end();
// });

// test("insert our functions", async (t) => {
//   const options = {
//     files: "./public/js/app.js",
//     from: /(return ShapePropertyFactory;case"matrix":return Matrix}})(function checkReady\(\))/g,
//     to: `$1function myCustomFunc(){document.dispatchEvent(new CustomEvent("ping", { detail: { type: "load" } }))}$2`,
//   };

//   const results = await replace(options);
//   t.ok(results[0].hasChanged);
//   t.end();
// });
