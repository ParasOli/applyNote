describe('HQ user CRUD', () => {

  beforeEach(() => {
    cy.loginWithSession()
  })

  const email = `parasoli7379+${Date.now()}@gmail.com`
  const fullName = `Test User ${Date.now()}`
  const updatedName = `Updated User ${Date.now()}`

  it('Add HQ User', () => {

    cy.visit('https://console.applynote.com/users/hq-users')

    cy.get('button').contains('Add User').click()

    cy.get('[name="firstName"]').type('Test')
    cy.get('[name="lastName"]').type('User')

    cy.get('#designation').click()
    cy.get('[role="option"]').contains('Counsellor').click()

    cy.get('[type="email"]').type(email)
    cy.get('[name="phone"]').type('9868757379')

    cy.get('button').contains('Location Info').click()
    cy.get('[name="city"]').type('Test City')

    cy.get('button').contains('Select Country').click()
    cy.get('.truncate').contains('Algeria').click({ force: true })

    cy.get('button').contains('Add New').click()

    cy.get('[data-type="success"]')
      .contains('Hq User created successfully!')
      .should('be.visible')
  })


  


  it('Delete HQ User', () => {

    cy.visit('https://console.applynote.com/users/hq-users')

    cy.get('[placeholder="Search..."]').eq(1).type(email)

    cy.contains('tr', email)
      .should('be.visible')
      .within(() => {
        cy.get('button, svg').first().click({ force: true })
      })

    cy.get('[role="menuitem"]').contains('Delete').click()

    cy.get('button').contains('Delete').click()

    cy.contains(email).should('not.exist')
  })

})