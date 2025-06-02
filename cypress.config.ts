import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8080',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    
    env: {
      TEST_EMAIL: 'test@examforge.com',
      TEST_PASSWORD: 'testpassword123'
    },

    setupNodeEvents(on, config) {
      // Simple task for logging
      on('task', {
        log(message) {
          console.log(message)
          return null
        }
      })
    },
  },
})
