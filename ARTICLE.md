# Designing resilient microservices with Toxiproxy and Cucumber

## Thinking about resiliency from day 0
Resiliency, alongside with security and other traits, is hard to factor-in after the service is already built. It's created by making careful design decisions starting at the same time the service was born. What happens when the database isn't there? What happens if all connections time out? - you might ask.

## About Toxiproxy
Toxiproxy is a cool programmable proxy made by Shopify for testing purposes. We're going to use it to predefine network characteristics in our ... which are describing our failure modes.

## Why Cucumber?
Failure modes are hard to understand, but still take a significant part in 
We need a living documentation to understand the service's failure modes, so team can maintain and support te service at-ease. Also it gives some opportunity for experimenting after the step definitions are in-place.

## How to run the example?


# When things go down



## Conclusion
### Why can't I just use integration tests and mocks?
Drives are just a black box. They contain a lot of surprises you wouldn't expect. Creating a programmable mock involves a lot of assumptions on how the driver is going to behave.