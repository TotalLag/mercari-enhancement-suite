import cheerio from 'cheerio'

const fetch = require('cross-fetch')

const headers = new fetch.Headers({
    'User-Agent':
      'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; FSL 7.0.6.01001)',
    'Cache-Control': 'no-cache',
  })
  
var appVersion: string

export const versionCheck = async function (): Promise<string> {
    const source = await fetch('https://www.mercari.com/sell/', { headers })
    const html = await source.text()
    const $ = cheerio.load(html)
    const scriptTags = $('script[src*=_app]')
    const appURL = scriptTags.first().attr('src')
    appVersion = (appURL?.match(/\/*(?:^v)?\d+(?:\.\d+)+/) ?? '')[0]
    console.log(">>v" + appVersion)
    return appVersion  
}

versionCheck()