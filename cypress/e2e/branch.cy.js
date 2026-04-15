describe('branch CRUD', () => {

  beforeEach(() => {
    cy.loginWithSession()
    cy.visit('https://console.applynote.com/units/branches')
  })

  const branchName = `Test Branch ${Date.now()}`
  const updatedBranchName = `${branchName} Updated`

  it('Create Branch', () => {
    cy.get('button').contains('Add Branch').click()
    cy.get('#displayName').type(branchName)
    cy.get('[name="legalName"]').type('Test Branch Legal Name')
    cy.get('[name="website"]').type('https://applynote.com')
    cy.get('[name="email"]').type('parasoli7379@gmail.com')
    cy.get('[name="phone"]').type('9868757379')

    cy.get('button').contains('Select Currency').click()
    cy.get('.truncate').contains('AFN').click()

    cy.get('[name="commissionRate"]').type('5')

    cy.get('button').contains('Location Info').click()
    cy.get('#city').type('Test City')
    cy.get('#state').type('Test State')

    cy.get('button').contains('Select Country').click()
    cy.get('.truncate').contains('Algeria').click({ force: true })

    cy.get('button').contains('Add New').click()

    cy.get('[data-type="success"]').contains('Branch created successfully!').should('be.visible')
  })


  it('Update Branch', () => {
    cy.get('[placeholder="Search..."]').eq(1).clear().type(branchName)
    cy.contains('tr', branchName).should('be.visible').within(() => {
      cy.get('button, svg').first().click({ force: true })
    })
    cy.get('[role="menuitem"]').contains('Edit').click()
    cy.get('#displayName').clear().type(updatedBranchName)
    cy.get('button').contains('Update Branch').click()
    cy.get('[data-type="success"]').should('be.visible')
  })


  it('Delete Branch', () => {
    cy.visit('https://console.applynote.com/units/branches')
    cy.get('[placeholder="Search..."]').eq(1).clear().type(updatedBranchName)
    cy.contains('tr', updatedBranchName).should('be.visible').within(() => {
      cy.get('button, svg').first().click({ force: true })
    })
    cy.get('[role="menuitem"]').contains('Delete Branch').click()
    cy.get('button').contains('Delete').click()
    cy.contains(updatedBranchName).should('not.exist')
  })

})