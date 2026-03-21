/// <reference types="vitest/globals" />
import '@testing-library/jest-dom'

// Polyfill ResizeObserver for cmdk (Command component) in jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
