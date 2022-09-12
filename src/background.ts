console.log('background.js executed')

const inject_react = () => {
  const vendor = document.createElement('script')
  vendor.src = chrome.runtime.getURL('js/vendor.js')
  vendor.defer = true
  vendor.onload = function () {
    vendor.remove()
  }
  ;(document.head || document.documentElement).appendChild(vendor)

  document
    .querySelectorAll('#client-style')
    ?.forEach((element, index, array) => {
      if (array.length > index + 1) {
        element.remove()
      }
    })
  const stylez = document.createElement('link')
  stylez.id = 'client-style'
  stylez.rel = 'stylesheet'
  stylez.href = chrome.runtime.getURL('css/client.css')
  ;(document.head || document.documentElement).appendChild(stylez)

  const react_entry_point = document.createElement('div')
  react_entry_point.id = 'clientjack'

  const mercari_header = (document.querySelector(
    'div[class*=StickyHeaderContainer]'
  )?.firstChild ||
    document.querySelector('[class*=StickyContainer]')?.firstChild ||
    document.querySelector(
      'div[class*=Flex][class*=Space][class*=Container]'
    ) ||
    document.querySelector('#__next')?.firstChild)!

  mercari_header?.appendChild(react_entry_point)

  const script = document.createElement('script')
  script.src = chrome.runtime.getURL('js/client.js')
  script.defer = true
  script.onload = function () {
    script.remove()
  }
  react_entry_point.appendChild(script)
}

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (tab?.url?.includes('.mercari.') && changeInfo.status === 'complete') {
    chrome.scripting.executeScript(
      {
        target: { tabId },
        function: inject_react,
      } as any,
      (res) => {
        console.log('Locked and loaded')
      }
    )
  }
})
