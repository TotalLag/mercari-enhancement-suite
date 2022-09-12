import test from 'tape'
import { getFromStorage, setToStorage } from '../utils'

const chromeMock = require('chrome-api-mock')
global.chrome = chromeMock.getChromeInstance()

test('mock set to storage', async (t) => {
  t.ok(await setToStorage({ test: "this doesn't actually set anything" }))
  t.end()
})

test('mock get from storage', async (t) => {
  t.ok(await getFromStorage('test'))
  t.end()
})
