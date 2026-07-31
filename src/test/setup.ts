import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
  document.body.replaceChildren()
})

if (!Blob.prototype.arrayBuffer) {
  Blob.prototype.arrayBuffer = function arrayBuffer(): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result)
          return
        }
        reject(new TypeError('Blob을 ArrayBuffer로 변환하지 못했습니다.'))
      })
      reader.addEventListener('error', () => {
        reject(reader.error ?? new Error('Blob 읽기에 실패했습니다.'))
      })
      reader.readAsArrayBuffer(this)
    })
  }
}

if (!URL.createObjectURL) {
  URL.createObjectURL = () => 'blob:sorion-test'
}

if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = () => undefined
}
