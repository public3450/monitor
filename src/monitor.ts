import pm2 from 'pm2';

const appName = 'FabricatermosChabot'; // Reemplaza con el nombre de tu aplicación en PM2
const maxCpuUsage = 90; // Umbral de uso de CPU en porcentaje
const checkInterval = 5000; // Intervalo de verificación en milisegundos (5 segundos)
const maxDuration = 180000; // Duración máxima en milisegundos para superar el umbral (3 minutos)

let cpuUsageHistory: { time: number, usage: number }[] = [];

setInterval(() => {
  pm2.describe(appName, (err, list) => {
    if (err) {
      console.error(err);
      return;
    }

    const app = list[0];
    const cpuUsage = app.monit.cpu;

    // Añadir el uso actual de CPU al historial
    cpuUsageHistory.push({
      time: Date.now(),
      usage: cpuUsage,
    });

    // Filtrar el historial para mantener solo los registros dentro de la duración máxima
    cpuUsageHistory = cpuUsageHistory.filter(entry => entry.time > Date.now() - maxDuration);

    // Calcular el uso promedio de CPU en el historial
    const avgCpuUsage = cpuUsageHistory.reduce((acc, entry) => acc + entry.usage, 0) / cpuUsageHistory.length;

    if (avgCpuUsage > maxCpuUsage) {
      console.log(`CPU usage average is ${avgCpuUsage}%, restarting ${appName}...`);
      pm2.restart(appName, (err) => {
        if (err) {
          console.error(err);
        } else {
          console.log(`${appName} restarted successfully.`);
        }
        // Limpiar el historial después del reinicio
        cpuUsageHistory = [];
      });
    }
  });
}, checkInterval); // Verificar cada 5 segundos
