# Reverse Proxy with Health Checks and Sticky Sessions

This project implements a reverse proxy server using Express.js and `http-proxy-middleware`. The proxy checks the health of the target servers before routing traffic to them. It supports TCP and HTTP health checks, with custom loggers configured for the proxy and health check processes. Additionally, the proxy implements **sticky sessions** where requests are routed to the same server if the server was used within the last 30 seconds.

## Features

- **Reverse Proxy**: Routes HTTP requests to a pool of backend servers.
- **Health Checks**: Verifies server health using TCP or HTTP checks.
- **Logging**: Uses `log4js` for logging proxy activities and health check results.
- **Load Balancing**: Routes to healthy servers in a round-robin fashion.
- **Sticky Sessions**: Routes requests from the same client to the same server for 30 seconds after the first use, based on the `x-target-server-last-use` header.

## Configuration

The proxy server can be configured to route traffic to different backend servers, and the health checks can be performed over TCP or HTTP.

- **TARGET_SERVERS**: Define a list of backend servers in `index.ts` for routing requests.
- **Health Check Path**: By default, the health check path is `/`. You can modify it as needed.
- **Logging**: Custom loggers are set up for both the proxy (`PROXY`) and health check (`HC`).
  - To configure the logger, update `logger.ts` as needed and set the desired log level (e.g., `debug`, `info`, `warn`, `error`, `fatal`).

## Sticky Sessions

The reverse proxy implements sticky sessions to route requests from the same client to the same server for 30 seconds after the first use. This is based on the `x-target-server-last-use` header, which stores the timestamp of when the server was last used.

### Sticky Session Logic:

1. When a request comes in, it checks the `x-target-server-last-use` header.
2. If the last use was within 30 seconds, the same server is reused.
3. If the last use was longer than 30 seconds, a new server will be selected based on health checks.

This logic ensures that the proxy attempts to keep the same client-server connection for a short period, reducing the load on backend servers and improving performance for certain use cases.

### Example Sticky Session Flow:

1. A request is received with the `x-target-server-last-use` header.
2. The proxy checks if the server has been used in the last 30 seconds.
3. If the server has been used recently, the proxy reuses it; otherwise, it performs health checks to find a healthy server.
