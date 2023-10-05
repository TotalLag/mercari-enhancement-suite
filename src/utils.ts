export const checkVersion: string = '1.26.285'

export const sleep = (delay: number) =>
  new Promise((resolve) => setTimeout(resolve, delay))

export const getFromStorage = async function (key: string): Promise<string> {
  return new Promise((resolve) => {
    chrome.storage.sync.get([key], resolve)
  }).then((result: any) => {
    if (typeof result === 'string') return result
    else if (typeof result === 'object' && result !== null) return result[key]
  })
}

export const setToStorage = async function (obj: {}): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set(obj, resolve)
  })
}

export const ToastSuccess = async function (message: string, duration: number) {
  await sleep(1500)

  let toast: any = window
    .Toastify({
      escapeMarkup: false,
      text: `${message}`,
      avatar: chrome.runtime.getURL('avatar.png'),
      duration: duration || 5000,
      close: false,
      gravity: 'bottom',
      position: 'right',
      stopOnFocus: true,
      onClick: function () {
        toast.hideToast()
      },
    })
    .showToast()
}

export const ToastError = async function (message: string, duration: number) {
  await sleep(1500)

  window
    .Toastify({
      escapeMarkup: false,
      text: `${message}`,
      avatar: chrome.runtime.getURL('avatar.png'),
      duration: duration || 5000,
      destination:
        'https://github.com/TotalLag/mercari-enhancement-suite/releases',
      newWindow: true,
      close: true,
      gravity: 'bottom',
      position: 'right',
      stopOnFocus: true,
      style: {
        background: 'linear-gradient(to right, #9c1c57, #d73a28)',
      },
    })
    .showToast()
}
