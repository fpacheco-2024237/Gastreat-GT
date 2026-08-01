import dotenv from 'dotenv';
// Importamos 'app' además de 'initServer'
import { initServer, app } from './configs/app.js';

dotenv.config();

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // En Serverless es mejor evitar process.exit(1) para no congelar la instancia
});

process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', err);
  // Evitamos process.exit(1)
});

// Solo iniciamos el servidor tradicional si NO estamos en Vercel
if (process.env.NODE_ENV !== 'production') {
  initServer();
}

// Esta es la línea clave: Vercel recibe la instancia de tu app para enrutar el tráfico
export default app;