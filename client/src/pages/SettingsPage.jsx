import { Link, Outlet, useLocation } from "react-router-dom";

export default function SettingsPage() {
  const location = useLocation();

  // Lista de opciones de configuración
  const menuItems = [
    { path: "/settings/profile", label: "Editar Perfil" },
    { path: "/settings/payments", label: "Pagos" },
    { path: "/settings/blocked", label: "Bloqueados" },
    { path: "/settings/help", label: "Ayuda" },
    { path: "/settings/other-options", label: "Otras opciones" },
  ];

  return (
    <div className="bg-gray-100 min-h-screen py-6"> 
      {/* Contenedor principal centrado */}
      <div className="container mx-auto px-4 md:px-8 mt-8">
        {/* Contenedor flex de barra lateral y contenido */}
        <div className="flex flex-col md:flex-row gap-6"> 
          {/* Barra lateral */}
          <aside className="w-full md:w-1/4 bg-white shadow p-4 md:p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Configuración</h1>
            <nav className="space-y-2">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-3 py-2 rounded-md text-lg font-medium ${
                    location.pathname === item.path
                      ? "bg-blue-500 text-white"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          {/* Contenido principal */}
          <main className="flex-1 bg-white shadow p-4 md:p-6">
            <Outlet /> {/* Aquí se cargan las subpáginas */}
          </main>
        </div>
      </div>
    </div>
  );
}
