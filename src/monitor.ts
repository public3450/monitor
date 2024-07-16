import * as pm2 from 'pm2';

const appName = 'FabricatermosChabot'; // Reemplaza con el nombre de tu aplicación en PM2
const maxCpuUsage = 90; // Umbral de uso de CPU en porcentaje
const checkInterval = 5000; // Intervalo de verificación en milisegundos (5 segundos)
const maxDuration = 180000; // Duración máxima en milisegundos para superar el umbral (3 minutos)

let cpuUsageHistory: { time: number, usage: number }[] = [];

setInterval(() => {
  pm2.connect((err) => {
    if (err) {
      console.error('Error al conectar con PM2:', err);
      return;
    }

    pm2.describe(appName, (err, list) => {
      if (err) {
        console.error('Error al describir la aplicación en PM2:', err);
        pm2.disconnect(); // Asegúrate de desconectar PM2 si hay un error
        return;
      }

      const app = list[0];
      const cpuUsage = app?.monit?.cpu;

      // Añadir el uso actual de CPU al historial
      cpuUsageHistory.push({
        time: Date.now(),
        usage: cpuUsage || 0, // Asegúrate de manejar el caso donde cpuUsage pueda ser undefined
      });

      // Filtrar el historial para mantener solo los registros dentro de la duración máxima
      cpuUsageHistory = cpuUsageHistory.filter(entry => entry.time > Date.now() - maxDuration);

      // Calcular el uso promedio de CPU en el historial
      const avgCpuUsage = cpuUsageHistory.length > 0 ?
        cpuUsageHistory.reduce((acc, entry) => acc + (entry.usage || 0), 0) / cpuUsageHistory.length :
        0; // Asegúrate de manejar el caso donde cpuUsageHistory.length podría ser 0

      if (avgCpuUsage > maxCpuUsage) {
        console.log(`El uso promedio de CPU es ${avgCpuUsage}%, reiniciando ${appName}...`);
        pm2.restart(appName, (err) => {
          if (err) {
            console.error('Error al reiniciar la aplicación en PM2:', err);
          } else {
            console.log(`${appName} reiniciada exitosamente.`);
          }
          // Limpiar el historial después del reinicio
          cpuUsageHistory = [];
          pm2.disconnect(); // Desconectar PM2 después de realizar operaciones
        });
      } else {
        pm2.disconnect(); // Desconectar PM2 si no es necesario reiniciar
      }
    });
  });
}, checkInterval); // Verificar cada 5 segundos
