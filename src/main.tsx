import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import './styles/index.css'

const root = document.getElementById('root')

if (!root) {
  throw new Error('SOA-1001: 앱을 시작할 화면을 찾지 못했습니다.')
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
