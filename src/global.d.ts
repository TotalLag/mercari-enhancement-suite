declare global {
  interface Window {
    compareVersions: {
      compare: (
        version1: string,
        version2: string,
        comparator: string
      ) => boolean
    }
    Toastify: (obj: TToastify) => {
      showToast: () => void
      hideToast: () => void
    }
  }

  type TToastify = {
    escapeMarkup?: boolean
    text?: string
    avatar?: string
    duration?: number
    destination?: string
    newWindow?: boolean
    close?: boolean
    gravity?: string
    position?: string
    stopOnFocus?: boolean
    style?: {
      background: string
    }
    onClick?: () => void
  }
}

export {}
