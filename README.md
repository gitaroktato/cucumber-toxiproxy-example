# How to build resilient microservices?

# Requirements
## Local / Staging
- Easily reproducing it locally only with Docker
- Able to integrate with our container orchestrators

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

# References
https://www.gremlin.com/chaos-monkey/chaos-monkey-alternatives/
https://github.com/shopify/toxiproxy#clients
https://github.com/trekawek/toxiproxy-java
