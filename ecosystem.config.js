module.exports = {
  apps: [
    {
      name: 'monitor-cpu',
      script: 'src/monitor.ts',
      interpreter: 'ts-node',
      watch: false
    }
  ]
};
