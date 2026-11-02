import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})

// import react from '@vitejs/plugin-react'
// import { defineConfig } from 'vite'
//
// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   server: {
//     proxy: {
//       '/api': {
//         target: 'http://localhost:8081', // Trỏ ngầm sang cổng 8081 của bạn
//         changeOrigin: true,
//       }
//     }
//   }
// })