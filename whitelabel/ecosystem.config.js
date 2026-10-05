const path = require("path");

module.exports = {
  apps: [
    {
      name: "whitelabel-portal",
      cwd: path.resolve(__dirname),
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: process.env.PM2_INSTANCES || 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      kill_timeout: 5000,
      listen_timeout: 10000,
      restart_delay: 1000,
      exp_backoff_restart_delay: 100,
      max_restarts: 15,
      error_file: path.resolve(__dirname, "logs/whitelabel-portal-error.log"),
      out_file: path.resolve(__dirname, "logs/whitelabel-portal-out.log"),
      merge_logs: true,
      time: true,
      node_args: "--max-old-space-size=1024",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_development: {
        NODE_ENV: "development",
        PORT: 3000,
      },
    },
  ],
};
