const pm2 = require('pm2');
const os = require('os');

const appNames = ['FabricatermosPersonalizado', 'Fabricatermos']; // Reemplaza con los nombres de tus aplicaciones en PM2
const maxCpuUsage = 90; // Umbral de uso de CPU en porcentaje
const checkInterval = 10000; // Intervalo de verificación en milisegundos (10 segundos)
const maxDuration = 180000; // Duración máxima en milisegundos para superar el umbral (3 minutos)

let cpuUsageHistories = appNames.reduce((acc, appName) => {
  acc[appName] = [];
  return acc;
}, {});

setInterval(() => {
  pm2.connect((err) => {
    if (err) {
      console.error(err);
      return;
    }

    appNames.forEach(appName => {
      pm2.describe(appName, (err, list) => {
        if (err) {
          console.error(err);
          return;
        }

        const app = list[0];
        if (!app) {
          console.error(`Application ${appName} not found`);
          return;
        }

        const cpuUsage = app.monit.cpu;

        // Añadir el uso actual de CPU al historial
        cpuUsageHistories[appName].push({
          time: Date.now(),
          usage: cpuUsage,
        });

        // Filtrar el historial para mantener solo los registros dentro de la duración máxima
        cpuUsageHistories[appName] = cpuUsageHistories[appName].filter(entry => entry.time > Date.now() - maxDuration);

        // Calcular el uso promedio de CPU en el historial
        const avgCpuUsage = cpuUsageHistories[appName].reduce((acc, entry) => acc + entry.usage, 0) / cpuUsageHistories[appName].length;

        if (avgCpuUsage > maxCpuUsage) {
          console.log(`CPU usage average is ${avgCpuUsage}% for ${appName}, restarting...`);
          pm2.restart(appName, (err) => {
            if (err) {
              console.error(err);
            } else {
              console.log(`${appName} restarted successfully.`);
            }
            // Limpiar el historial después del reinicio
            cpuUsageHistories[appName] = [];
          });
        }
      });
    });
  });
}, checkInterval); // Verificar cada 10 segundos
