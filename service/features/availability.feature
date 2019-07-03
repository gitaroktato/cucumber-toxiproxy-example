Feature: Availability for user service
  User service should survive all possible failure scenarios

  Scenario: Read-only mode without MySQL
    Given MySQL is down
    When user 'u-12345abde234' is requested
    Then the user with id 'u-12345abde234' is returned from Redis

  Scenario: Write not allowed without MySQL
    Given MySQL is down
    When new user created with id 'u-1123' and name 'Joe'
    Then HTTP 503 is returned

  Scenario: Write is restored with MySQL
    Given MySQL is down
    When MySQL is up
    And new user created with id 'u-1123' and name 'Joe'
    And user 'u-1123' is requested
    Then the user with id 'u-1123' is returned from MySQL
