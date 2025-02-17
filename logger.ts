import { configure, getLogger } from 'log4js';

// Log4js Configuration
configure({
    appenders: {
        console: { type: 'console' },
        file: { type: 'file', filename: 'logs/reverse-proxy.log', pattern: 'yyyy-MM-dd', backups: 3 }
    },
    categories: {
        default: { appenders: ['console', 'file'], level: 'trace' },
        PROXY: { appenders: ['console', 'file'], level: 'trace' }, // Custom category for index.ts
        HC: { appenders: ['console', 'file'], level: 'trace' }    // Custom category for healthcheck.ts
    }
});

// Export only configuration, not the default logger
export { getLogger };
// Export the default logger