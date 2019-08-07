# Designing resilient microservices with Toxiproxy and Cucumber

## Thinking about resiliency from day 0
Resiliency, alongside with security and other traits, is hard to factor-in after the service is already built. It's created by making careful design decisions starting at the same time your service was born. _"... but what happens when the database isn't there? What happens if all connections time out?"_ - you might ask. These are all valid questions and you better prepare for these situations before your service goes live.

## About Toxiproxy
Toxiproxy is a cool programmable proxy made by Shopify for testing purposes. We're going to use it to predefine network characteristics in our scenarios which are going to describe our failure modes.

## Why Cucumber?
Failure modes are hard to understand, but still take a significant part in our service lifecycle. Often you can only understand failure modes of a specific service by looking at the source code. These implementations are typically low level so it's even harder to understand by solely using code review.
It's better to use a living documentation to understand the service's failure modes, so team can maintain and support te service at-ease. Also it gives more opportunity for experimenting after the step definitions are in-place (#TODO settled?).

## How to run the example?
Go to the [GitHub example][1] and see the `README.md` on how to start the service along all the dependencies.

I suggest looking at `Before` `BeforeAll` `AfterAll` implementations to better understand how step definition is communicating with the Toxpiproxy API (#TODO concrete methods with links).

## When things go down
First thing that we will implement is going to be the case when we can't reach the database.  
```
  ...
  Background:
    Given user 'u-12345abde234' with name 'Jack' is cached
    And user 'u-12345abde234' with name 'Jack' is stored

  Scenario: Read-only mode without MySQL
    Given 'MySQL' is down
    When user 'u-12345abde234' is requested
    Then the user with id 'u-12345abde234' is returned from 'Redis'
```
Shortly after executing the test we'll realize that our application simply crashes when MySQL is gone. Failing fast is definetely a good thing, when this is intentional. But what if we just want to send back the user when it's available from cache?

Seems like it's relatively easy to do if we 


## Drawbacks
Serivces recover after a certain period. That period can be different on each environment ...
It's not really a good idea to connect failure detection with some kind-of action if your traffic doesn't have stable characteristics. 

## Conclusion
### Why can't I just use integration tests and mocks?
Drives are just a black box. They contain a lot of surprises you wouldn't expect. Creating a programmable mock involves a lot of assumptions on how the driver is going to behave.

[1]: https://github.com/gitaroktato/cucumber-toxiproxy-example
