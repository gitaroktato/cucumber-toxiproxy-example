Feature: Cache availability scenarios for user service
  User service should survive all possible failure scenarios

  Scenario: Cache read-only mode without Redis master
    Given 'redis-master' is down
    When user 'u-12345abde234' is requested
    Then the user with id 'u-12345abde234' is returned from 'Redis'

 # TODO cache eviction on BeforeAll / AfterAll ???
  Scenario: Write cache fails without Redis master
    Given 'redis-master' is up
    And new user created with id 'u-113' and name 'Joe'
    # We know it's cached now
    And user 'u-113' is requested
    When 'redis-master' is down
    And user is updated with id 'u-113' and name 'Bob'
    # TODO is it OK to return possible stale users?
    # We should detect cache eviction failures
    And user 'u-113' is requested
    Then the user with id 'u-113' and name 'Joe' is returned from 'Redis'

  Scenario: Write cache connection is restored after Redis master is up
    Given 'redis-master' is up
    And new user created with id 'u-111' and name 'Bob'
    # We know it's cached now
    And user 'u-111' is requested
    When user is updated with id 'u-111' and name 'Joe'
    And user 'u-111' is requested
    And user 'u-111' is requested
    Then the user with id 'u-111' and name 'Joe' is returned from 'Redis'
  
    