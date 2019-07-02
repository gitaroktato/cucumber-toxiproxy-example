# How to build resilient microservices?

# Goal
## Local / Staging
- Easily reproducing it locally only with Docker
- Able to integrate with our container orchestrators
- Living documentation of failure scenarios for every service that helps team to understand failure modes
- Better control and design for failure modes

# Test lifecycle
1. start service in docker
1. Execute Cucumber tests
1. Teardown

## Integration points
caching -> DB
aggregate service (BFF) -> service or defaults

# Executing manually
Create proxy
```
/go/bin/toxiproxy-cli create redis-public --listen 0.0.0.0:6379 --upstream redis:6379
/go/bin/toxiproxy-cli toxic add redis-public -t latency -a latency=1000
```

Connect to the proxy with `redis-cli`
```
docker-compose exec redis redis-cli -h toxiproxy
```

# Draft
- Don't run the service and the tests in the same process
- Benefits of testing with the whole network stack


## Step 1 - Pooling MySQL
https://www.npmjs.com/package/mysql#server-disconnects


# Conclusion
This method allows fine-grained failure scenarios that are clear for everyone. Assumptions made locally can be verified with another environment by reconfiguring ToxyiProxy to see if they still stand.

# Disclaimer
Node.js code should not serve as an example on how to write clean code in this language.

# References
https://www.gremlin.com/chaos-monkey/chaos-monkey-alternatives/
https://github.com/shopify/toxiproxy#clients
https://github.com/trekawek/toxiproxy-java
https://cucumber.io/docs/guides/10-minute-tutorial/
