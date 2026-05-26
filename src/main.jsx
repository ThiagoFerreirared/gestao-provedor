import React from 'react'
import ReactDOM from 'react-dom/client'
import { Root } from './App' // Changed this line

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root /> {/* Changed this line */}
  </React.StrictMode>,
)
