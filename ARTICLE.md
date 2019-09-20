# Designing resilient microservices with Toxiproxy and Cucumber

## Thinking about resiliency from day 0
Resiliency - alongside with security and other traits - is hard to factor-in after the service is already built. It's created by making careful design decisions starting at the same time your service was born. _"... but what happens when the database isn't there? What happens if all connections time out?"_ - you might ask. These are all valid questions and you better prepare for these situations before your service goes live.

## About Toxiproxy
Toxiproxy is a cool programmable proxy made by Shopify for testing purposes. We're going to use it to predefine network characteristics in our scenarios which are going to describe our failure modes.

## Why Cucumber?
Failure modes are hard to understand, but still take a significant part in our service lifecycle. Usually you can only understand failure modes of a specific service by looking at the source code. These implementations are typically low level so it's even harder to understand by solely relying on code review.
It's better to use a living documentation to understand the service's failure modes, so team can maintain and support the service at-ease. Also it gives more opportunity for experimenting after the step definition implementations are settled.

## What are we going to build?
The diagram shows an overview of the container connections in the example's [docker compose][2] file. The application connects to a cache cluster and a database instance provided by redis master/slave and MySQL. It's doing it indirectly through Toxiproxy, which offers a REST API for controlling the network characteristics. Tests will be able to change the network connectivity between the application and each one of its dependency separately. Cucumber gives the test scenarios a nice readable format and allows declaring our application's failure modes in feature files.
![services-overview][services-overview]


## How to run the example?
Go to the [GitHub example][1] and see the `README.md` on how to start the service along all the dependencies. It also contains the commands for running the Cucumber tests.

I suggest looking at `Before` `BeforeAll` `AfterAll` implementations to better understand how step definition is communicating with the [Toxpiproxy API][toxpiroxy API]. (#TODO concrete methods with links)

In the next sections I'm going to present an imaginary development process, similar to the one I went through when doing the excercises by myself. Readers can go through the article and review the example codebase to get a taste of how the development process would look like. 

## When things go down
First thing that we will implement is the case of not being able to reach the database.  
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
Shortly after executing the test we'll realize that our application simply crashes when MySQL is gone. Failing fast is definetely a good thing, when it's intentional. But what if we just want to send back the data humbly, when it's available from cache?

Seems like it's relatively easy to fix application crashes. We just need to modify our code to use [connection pools][mysql-pools]. 
```
function connect({host, port, user, password}, callback) {
  const pool = mysql.createPool({
    host: host,
    port: port,
    user: user,
    password: password
  });
  callback(null, pool);
}
```

In the next step we're adding two more scenarios, which ensures that write issues are handled correctly and application is able to recover after database is back online.
```
  Scenario: Write not allowed without MySQL
    Given 'MySQL' is down
    When new user created with id 'u-1123' and name 'Joe'
    Then HTTP 503 is returned

  Scenario: Write is restored with MySQL
    Given 'MySQL' is down
    When 'MySQL' is up
    And new user created with id 'u-1123' and name 'Joe'
    And user 'u-1123' is requested
    Then the user with id 'u-1123' is returned from 'MySQL'
```

The second scenario passes without code change, because the database driver is doing the work for us. We just need to ensure that write errors are handled correctly and we're also able to pass the first scenario.

```
app.put('/users/:userId', function (req, res) {
  ...
  dao.saveUser(app.daoConnection, user, (err) => {
    if (err) {
      console.error("MySQL error, when saving user - ", err);
      return res.sendStatus(503);
    }
  ...
  });
});
```

## Caching issues
Now, let's define scenarios for the failure modes related to caching. What should happen if the Redis master is unavailable? Until we have a Redis slave running we should still use it for returning cached results.

```
Feature: Cache availability scenarios for user service
  User service should survive all possible failure scenarios

  Background:
    Given user 'u-12345abde234' with name 'Jack' is cached
    And user 'u-12345abde234' with name 'Jack' is stored

  Scenario: Cache read-only mode without Redis master
    Given 'redis-master' is down
    When user 'u-12345abde234' is requested
    Then the user with id 'u-12345abde234' is returned from 'Redis'
```

This was the point, when things became interesting. If we intented to run redis in just a simple [master/slave][redis-cluster] mode, without using sentinels or a cluster with shards, it's impossible to failover to the read-only slaves with the traditional node.js driver. I had to look for a smarter client and finally ended up using [thunk-redis][thunk-redis]. Fortunately the two APIs are almost identical and I have the option to define both the master and the slave IP addresses at connection initialization. You can see list of cliets for all programming languages in the [official website][redis-clients].

```
function connect({
    hosts, ...
  }, callback) {
  const client = redis.createClient(hosts, {onlyMaster: false});
  ...
  client.on("error", function (err) {
    console.error("Redis error caught on callback - ", err);
  });
  client.on("warn", function (err) {
    console.warn("Redis warning caught on callback - ", err);
  });
  ...
  callback(null, client);
}
```

```
{
    "default": {
      "config_id": "default",
      ...
      "redis": {
        "hosts": ["192.168.99.106:6379", "192.168.99.106:16379"],
        ...
      },
      ...
    }
}
```

How should we handle any error with cache writes? The next step is to carve out two additional scenarios for these use cases.  

```
Feature: Cache availability scenarios for user service
  User service should survive all possible failure scenarios

  Background:
    Given user 'u-12345abde234' with name 'Jack' is cached
    And user 'u-12345abde234' with name 'Jack' is stored
...
  Scenario: Write cache fails without Redis master
    Given 'redis-master' is down
    When user is updated with id 'u-12345abde234' and name 'Joe'
    And user 'u-12345abde234' is requested
    Then the user with id 'u-12345abde234' and name 'Jack' is returned from 'Redis'

  @single
  @fragile
  Scenario: Write cache connection is restored after Redis master is up
    # This test case should be written differently.
    # Every cached entry should have TTL
    # and application should care about restoring stale state in the background
    Given 'redis-master' is up
    And we wait a bit
    When user is updated with id 'u-12345abde234' and name 'Joe'
    And we wait a bit
    When user is updated with id 'u-12345abde234' and name 'Joe'
    And user 'u-12345abde234' is requested
    # Should be cached now
    And user 'u-12345abde234' is requested
    Then the user with id 'u-12345abde234' and name 'Joe' is returned from 'Redis'
...
```

(#TODO move this to the proper place)
```
app.get('/users/:userId', function (req, res) {
    const userId = req.params.userId;
    // get from cache
    cache.getUser(app.cacheClient, userId, (err, user) => {
      // Let's ignore error and just try to continue.. What could go wrong?
      if (err) {
        console.error("REDIS error, when getting user - ", err);
      }
      // Check if result has something.
      // thunk-redis returns empty object if key doesn't exist.
      if (user && user.id) {
        console.debug("Loaded from REDIS - %o", user);
        res.set("X-Data-Source", "cache");
        res.json(user);
      } else {
        // get from database
        ...
      }
    });
});
```

## Drawbacks
Serivces recover after a certain period. That period can be different on each environment ... (#TODO)
It's not really a good idea to connect failure detection with some kind-of action if your traffic doesn't have stable characteristics. 

## Conclusion
### Why can't I just use integration tests and mocks?
Drives are just a black box. They contain a lot of surprises you wouldn't expect. Creating a programmable mock involves a lot of assumptions on how the driver is going to behave.

### What's with toxiproxy-node-client?
(#TODO)

[1]: https://github.com/gitaroktato/cucumber-toxiproxy-example
[2]: https://github.com/gitaroktato/cucumber-toxiproxy-example/blob/master/docker-compose.yml
[services-overview]: docs/services-overview.png
[toxpiroxy API]: https://github.com/shopify/toxiproxy#http-api
[mysql-pools]: https://www.npmjs.com/package/mysql#server-disconnects
[redis-cluster]: https://redis.io/topics/replication
[thunk-redis]: https://github.com/thunks/thunk-redis
[redis-clients]: https://redis.io/clients