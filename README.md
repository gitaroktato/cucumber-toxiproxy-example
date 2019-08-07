# Examples for the article _"Designing resilient microservices with Toxiproxy and Cucumber"_

# How to star the examples?
All you need to do is just bringing everything up in Docker.
```
docker-compose up -d
```
Check if the application is started properly, by running `docker-compose logs user-service`. If not, you might need to bring it up again by executing `docker-compose up -d user-service`.

After the application is up-and-running you can run the Cucumber tests with
```
cd service
npm run cucumber-test
```

The user-service will run database patches by default. If this needs to be switched off, you need to look at [config.json][1] and change the following section to **false**.

```
...
"docker": {
    "config_id": "docker",
    "mysql": {
    "host": "toxiproxy",
    "port": 3306
    },
    "redis": {
    "hosts": ["toxiproxy:6379", "toxiproxy:16379"]
    },
    "initSql": false
}
...
```

[1]: blob/master/service/app/config/config.json