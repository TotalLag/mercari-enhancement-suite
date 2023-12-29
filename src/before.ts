import { checkVersion, getFromStorage, ToastSuccess } from './utils'

// this code will be executed before page load
;(async function () {
  if (chrome.runtime.id == undefined) return
  console.log('before.js executed')

  const storedVersion = (await getFromStorage('app_version')) || '0.0'

  const loaded = window.compareVersions.compare(
    checkVersion,
    storedVersion,
    '>='
  )
  console.log(`load: ${loaded}`)

  if (loaded && !window.location.href.includes('help_center')) {
    const app = document.createElement('script')
    app.src = chrome.runtime.getURL('js/app.js')
    app.defer = true
    app.onload = function () {
      app.remove()
    }
    ;(document.head || document.documentElement).appendChild(app)
  }

  document.addEventListener('ping', async function (e: Event) {
    if (e instanceof CustomEvent && e.detail) {
      switch (e.detail.type) {
        case 'toast':
          await ToastSuccess(e.detail.msg, 2500)
          break
        default:
          // Handle unknown type or do nothing
          break
      }
    }
  })
})()
