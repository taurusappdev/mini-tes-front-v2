document.addEventListener('DOMContentLoaded', () => {
    const apiUrl = window.MINI_TES_API_URL || 'http://localhost:4000/graphql';
    const dashboardDiv = document.getElementById('dashboard');

    if (!dashboardDiv) {
        console.error('No se encontró el contenedor #dashboard');
        return;
    }

    const query = `
      query DashboardOperacion {
        dashboardOperacion {
          checklists {
            total
            completadas
            enProceso
            pendientes
            porcentajeCompletas
          }
          actions {
            total
            abiertas
            completadas
            porcentajeCompletas
          }
        }
      }
    `;

    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query })
    })
        .then(res => res.json())
        .then(res => {
            if (res.errors) {
                console.error(res.errors);
                dashboardDiv.innerHTML = '<p>Error al cargar el dashboard.</p>';
                return;
            }

            const data = res.data.dashboardOperacion;

            dashboardDiv.innerHTML = `
              <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:16px;">
                <div style="background:#fff; padding:16px; border-radius:8px; box-shadow:0 1px 3px rgba(0,0,0,0.08);">
                  <h2 style="margin-top:0; font-size:16px;">Listas de verificación</h2>
                  <p>Total: <strong>${data.checklists.total}</strong></p>
                  <p>Completadas: <strong>${data.checklists.completadas}</strong></p>
                  <p>En proceso: <strong>${data.checklists.enProceso}</strong></p>
                  <p>Pendientes: <strong">${data.checklists.pendientes}</strong></p>
                  <p>% Completas: <strong>${data.checklists.porcentajeCompletas.toFixed(1)}%</strong></p>
                </div>

                <div style="background:#fff; padding:16px; border-radius:8px; box-shadow:0 1px 3px rgba(0,0,0,0.08);">
                  <h2 style="margin-top:0; font-size:16px;">Acciones</h2>
                  <p>Total: <strong>${data.actions.total}</strong></p>
                  <p>Abiertas: <strong>${data.actions.abiertas}</strong></p>
                  <p>Completadas: <strong>${data.actions.completadas}</strong></p>
                  <p>% Completas: <strong>${data.actions.porcentajeCompletas.toFixed(1)}%</strong></p>
                </div>
              </div>
            `;
        })
        .catch(err => {
            console.error(err);
            dashboardDiv.innerHTML = '<p>Error de conexión con la API.</p>';
        });
});
