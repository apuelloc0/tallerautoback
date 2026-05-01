import axios from 'axios';

// Configura aquí la URL de tu backend en Render o localhost
const API_URL = 'https://tallerautoback.onrender.com/api/inventory'; // Ruta que toca la DB
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiZjZmZTFiMC1lODY4LTRlZjItYWY1ZS1hOTlmZmRkMjhkZjEiLCJ3b3Jrc2hvcF9pZCI6ImRjMGI3ZmJlLWExMGEtNDBkMy1hZjJlLWIyNWEzNzkwMzg0OCIsInJvbGUiOiJBRE1JTklTVFJBRE9SIiwiaWF0IjoxNzc3NjU0MDI1LCJleHAiOjE3Nzc3NDA0MjV9.GEThOOvvKAv6lXE-E3b4cn6nM55Wqx8hZdFIy5MyfL4'; 
const CONCURRENT_REQUESTS = 20; // Subimos a 20 para sentir el rigor

async function runTest() {
  console.log(`🚀 Iniciando prueba de CARGA REAL (DB): ${CONCURRENT_REQUESTS} peticiones simultáneas...`);
  console.log(`🔗 Objetivo: ${API_URL}`);

  const start = Date.now();

  // Creamos un array de promesas para ejecutarlas todas al mismo tiempo
  const requests = Array.from({ length: CONCURRENT_REQUESTS }).map((_, i) => 
    axios.get(API_URL, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    })
      .then(res => ({ id: i + 1, status: res.status, success: true }))
      .catch(err => ({ id: i + 1, status: err.response?.status || 'Error', success: false }))
  );

  try {
    const results = await Promise.all(requests);
    const duration = Date.now() - start;

    console.log('\n--- RESULTADOS ---');
    results.forEach(res => {
      console.log(`Petición #${res.id}: ${res.success ? '✅ OK' : '❌ FALLO'} (Status: ${res.status})`);
    });

    const successCount = results.filter(r => r.success).length;
    console.log('\n--- RESUMEN ---');
    console.log(`Tiempo total: ${duration}ms`);
    console.log(`Promedio por petición: ${(duration / CONCURRENT_REQUESTS).toFixed(2)}ms`);
    console.log(`Éxitos: ${successCount}/${CONCURRENT_REQUESTS}`);
  } catch (error) {
    console.error('Error crítico durante la prueba:', error.message);
  }
}

runTest();