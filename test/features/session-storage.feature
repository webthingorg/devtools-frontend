Feature: Application Tab

Background: Reset Pages
  Given that the browser is set up

  Scenario: Show Session Storage keys and values
    * navigate to session-storage resource and open Application tab
    * open the domain storage
    * check that storage data values are correct
    