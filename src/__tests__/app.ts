import test from 'tape'
import cheerio from 'cheerio'
import { replaceInFile as replace } from 'replace-in-file'
import { existsSync } from 'fs'
import { writeFile } from 'fs/promises'
import { checkVersion } from '../utils'
const fetch = require('cross-fetch')

const headers = new fetch.Headers({
  'User-Agent':
    'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; FSL 7.0.6.01001)',
  'Cache-Control': 'no-cache',
})

var appVersion: string
var updated: boolean = false

test('loads the page and find script url', async (t) => {
  const source = await fetch('https://www.mercari.com/sell/', { headers })
  const html = await source.text()
  const $ = cheerio.load(html)
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
  const options = {
    files: './public/js/app.js',
    from: /(p\(i,e\);)(let o=await k\(r,e,i\),a=o.toDataURL\("image\/jpeg"\);)/g,
    to: `$1(i.height>2880?(e.height=2880,e.width=Math.floor(2880*i.width/i.height),(i.width>3840??(e.height=Math.floor(3840*i.height/i.width),e.width=3840))):(e.width=i.width,e.height=i.height)),document.dispatchEvent(new CustomEvent("ping", { detail: { type: "toast", msg: "higher resolution captured ✅" } }));$2`,
  }

  const results = await replace(options)
  t.ok(results[0].hasChanged)
  t.end()
})