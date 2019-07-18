Feature: Cache availability scenarios for user service
  User service should survive all possible failure scenarios

  Background:
    Given user 'u-12345abde234' with name 'Jack' is cached
    And user 'u-12345abde234' with name 'Jack' is stored

  Scenario: Cache read-only mode without Redis master
    Given 'redis-master' is down
    When user 'u-12345abde234' is requested
    Then the user with id 'u-12345abde234' is returned from 'Redis'

  # @fragile
  Scenario: Write cache fails without Redis master
    Given 'redis-master' is down
    # This is a problem with how deletion is triggered
    When user is updated with id 'u-12345abde234' and name 'Joe'
    And user 'u-12345abde234' is requested
    Then the user with id 'u-12345abde234' and name 'Jack' is returned from 'Redis'

  @single
  Scenario: Write cache connection is restored after Redis master is up
    # This test case should be written differently.
    # Every cached entry should have TTL
    # and application should care about restoring stale state in the background
    Given 'redis-master' is up
    When user is updated with id 'u-12345abde234' and name 'Joe'
    And we wait a bit
    When user is updated with id 'u-12345abde234' and name 'Joe'
    And user 'u-12345abde234' is requested
    # Should be cached now
    And user 'u-12345abde234' is requested
    Then the user with id 'u-12345abde234' and name 'Joe' is returned from 'Redis'

  Scenario: Redis master/slave time out
    Given 'redis-master' times out
    And 'redis-slave' times out
    When user 'u-12345abde234' is requested
    Then the user with id 'u-12345abde234' is returned from 'MySQL'
  
    