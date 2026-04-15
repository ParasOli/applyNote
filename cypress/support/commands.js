// cypress/support/commands.js

Cypress.Commands.add('applyNoteLogin', () => {
    cy.visit('https://console.applynote.com/')
    cy.get('[placeholder="Enter email"]').type('parasoli7379@gmail.com')
    cy.get('[placeholder="Enter password"]').type('applynote123')
    cy.get('button').contains('Continue').click()
  
    cy.waitForOtpEmail().then((otp) => {
      cy.get('input[placeholder="Enter 6-digit OTP"]').should('be.visible').type(otp)
      cy.get('button').contains('Login').click()
      cy.get('h1.title').contains('Dashboard').should('be.visible')
    })
  })
  
  Cypress.Commands.add('waitForOtpEmail', (retries = 10, interval = 3000) => {
    cy.wait(13000)
    const attempt = (remaining) => {
      return cy.task('getMostRecentEmail').then((email) => {
        const otp = (email?.subject || '').match(/\d{4,8}/)?.[0]
        if (otp) return cy.wrap(otp)
        if (remaining <= 0) throw new Error('❌ OTP not received after retries')
        cy.wait(interval)
        return attempt(remaining - 1)
      })
    }
    return attempt(retries)
  })
  
  Cypress.Commands.add('loginWithSession', () => {
    cy.session(
      'applynote-login',
      function setupFn() {
        cy.applyNoteLogin()
      },
      {
        cacheAcrossSpecs: true
      }
    )
  })