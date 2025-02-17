# Reverse Proxy with Health Checks and Sticky Sessions

This project implements a reverse proxy server using Express.js and `http-proxy-middleware`. The proxy checks the health of the target servers before routing traffic to them. It supports TCP and HTTP health checks, with custom loggers configured for the proxy and health check processes. Additionally, the proxy implements **sticky sessions** where requests are routed to the same server if the server was used within the last 30 seconds.

## Features

- **Reverse Proxy**: Routes HTTP requests to a pool of backend servers.
- **Health Checks**: Verifies server health using TCP or HTTP checks.
- **Logging**: Uses `log4js` for logging proxy activities and health check results.
- **Load Balancing**: Routes to healthy servers in a round-robin fashion.
- **Sticky Sessions**: Routes requests from the same client to the same server for 30 seconds after the first use, based on the `x-target-server-last-use` header.