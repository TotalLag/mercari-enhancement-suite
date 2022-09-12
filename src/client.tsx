import React from 'react'
import { createRoot } from 'react-dom/client'
import DarkMode from './components/DarkMode/DarkMode'

console.log('client.js executed')

const root = createRoot(document.querySelector('#clientjack') as Element)
root.render(<DarkMode />)
