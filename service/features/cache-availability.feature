Feature: Cache availability scenarios for user service
  User service should survive all possible failure scenarios

  Scenario: Cache read-only mode without Redis master
    Given Redis master is down
    When user 'u-12345abde234' is requested
    Then the user with id 'u-12345abde234' is returned from 'Redis'
    