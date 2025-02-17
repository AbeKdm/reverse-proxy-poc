"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLogger = void 0;
var log4js_1 = require("log4js");
Object.defineProperty(exports, "getLogger", { enumerable: true, get: function () { return log4js_1.getLogger; } });
// Log4js Configuration
(0, log4js_1.configure)({
    appenders: {
        console: { type: 'console' },
        file: { type: 'file', filename: 'logs/reverse-proxy.log', pattern: 'yyyy-MM-dd', backups: 3 }
    },
    categories: {
        default: { appenders: ['console', 'file'], level: 'trace' },
        PROXY: { appenders: ['console', 'file'], level: 'trace' }, // Custom category for index.ts
        HC: { appenders: ['console', 'file'], level: 'trace' } // Custom category for healthcheck.ts
    }
});
// Export the default logger
