describe('designation CRUD', () => {

    beforeEach(() => {
      cy.loginWithSession()
    })
  
    const designationName = `QA ${Date.now()}`
    const updatedDesignationName = `${designationName} Updated`
  
    it('Add Designation', () => {
      cy.visit('https://console.applynote.com/users/designation')
  
      cy.get('button').contains('Add Designation').click()
      cy.get('#name').type(designationName)
  
      cy.get('button.bg-success').contains('Add').click()
  
      cy.get('[data-type="success"]')
        .contains('Designation created successfully!')
        .should('be.visible')
    })
  
  
    it('Update Designation', () => {
      cy.visit('https://console.applynote.com/users/designation')
  
      cy.get('[placeholder="Search..."]').eq(1).type(designationName)
  
      cy.contains('tr', designationName)
        .should('be.visible')
        .within(() => {
          cy.get('button, svg').first().click({ force: true })
        })
  
      cy.get('[role="menuitem"]').contains('Edit').click()
  
      cy.get('#name').clear().type(updatedDesignationName)
  
      cy.get('button').contains('Edit').click()
  
      cy.get('[data-type="success"]')
        .should('be.visible')
    })
  
  
    it('Delete Designation', () => {
      cy.visit('https://console.applynote.com/users/designation')
  
      cy.get('[placeholder="Search..."]').eq(1).type(updatedDesignationName)
  
      cy.contains('tr', updatedDesignationName)
        .should('be.visible')
        .within(() => {
          cy.get('button, svg').first().click({ force: true })
        })
  
      cy.get('[role="menuitem"]').contains('Delete').click()
  
      cy.get('button').contains('Delete').click()
  
      cy.contains(updatedDesignationName).should('not.exist')
    })
  
  })