
import './commands'
import '@shelex/cypress-allure-plugin';

Cypress.on('uncaught:exception', (err) => {
    if (err.message.includes('messaging/unsupported-browser')) {
      return false
    }
  })
