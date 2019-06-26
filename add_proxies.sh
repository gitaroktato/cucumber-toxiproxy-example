#! /bin/sh
/go/bin/toxiproxy-cli -h toxiproxy:8474 create mysql --listen 0.0.0.0:3306 --upstream mysql:3306 ||
/go/bin/toxiproxy-cli -h toxiproxy:8474 create redis-master --listen 0.0.0.0:6379 --upstream redis-master:6379 ||
/go/bin/toxiproxy-cli -h toxiproxy:8474 create redis-slave --listen 0.0.0.0:16379 --upstream redis-slave:6379
