// App.js
import React, { useState } from "react";
import AdminPanel from "./AdminPanel";

const BASE_URL = "https://asistencia-ia-1.onrender.com";

function App() {
  const [isLogged, setIsLogged] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [course, setCourse] = useState("Inteligencia Artificial");
  const [message, setMessage] = useState("");
  const [userType, setUserType] = useState("student");

  // LOGIN
  const handleLogin = async () => {
    setMessage("");
    try {
      const res = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    
      });
      const data = await res.json();
      if (res.ok) {
        setIsLogged(true);
        setUserType(data.user_type);
        setMessage("Login Exitoso");
      } else {
        setMessage(data.error || "Error en login");
      }
    } catch (error) {
      setMessage("Error de conexión");
    }
  };

  // LOGOUT
  const handleLogout = async () => {
    setMessage("");
    try {
      const res = await fetch(`${BASE_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setIsLogged(false);
        setUserType("student");
        setMessage(data.message);
      } else {
        setMessage(data.error || "Error al cerrar sesión");
      }
    } catch (error) {
      setMessage("Error de conexión");
    }
  };

  // MARCAR ASISTENCIA (solo estudiantes)
  const handleAttendance = () => {
    setMessage("");
    if (!navigator.geolocation) {
      setMessage("Geolocalización no soportada.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`${BASE_URL}/attendance`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ course, latitude, longitude }),
            credentials: "include",
          });
          const data = await res.json();
          setMessage(data.message || data.error);
        } catch (error) {
          setMessage("Error de conexión");
        }
      },
      () => setMessage("No se pudo obtener la ubicación.")
    );
  };

  if (!isLogged) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
          <h1 className="text-3xl font-bold text-center text-indigo-800 mb-6">
            Sistema de Asistencia
          </h1>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Correo Institucional
            </label>
            <input
              type="email"
              className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="ej: alumno@unmsm.edu.pe"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Código (Contraseña)
            </label>
            <input
              type="password"
              className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="ej: 20210001"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            onClick={handleLogin}
            className="w-full bg-indigo-600 text-white py-3 rounded hover:bg-indigo-700 transition-colors duration-200"
          >
            Iniciar Sesión
          </button>
          {message && (
            <p className="mt-4 text-center text-red-600 font-medium">
              {message}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 flex flex-col">
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold text-indigo-800">
            Sistema de Asistencia
          </h1>
          <button
            onClick={handleLogout}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors duration-200"
          >
            Cerrar Sesión
          </button>
        </div>
      </nav>
      {message && (
        <div className="container mx-auto mt-4 px-4">
          <p className="text-center text-green-600 font-semibold">{message}</p>
        </div>
      )}
      <div className="container mx-auto px-4 py-6 flex-1">
        {userType === "student" && (
          <div className="bg-white p-4 rounded shadow max-w-md mx-auto mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Marcar Asistencia
            </h2>
            <label className="block text-gray-700 font-medium mb-2">
              Curso
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-green-400 mb-4"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
            />
            <button
              onClick={handleAttendance}
              className="w-full bg-green-600 text-white py-3 rounded hover:bg-green-700 transition-colors duration-200"
            >
              Marcar Asistencia
            </button>
          </div>
        )}
        {userType === "teacher" && (
          <div className="bg-white p-4 md:p-6 rounded shadow-2xl">
            <AdminPanel baseUrl={BASE_URL} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
