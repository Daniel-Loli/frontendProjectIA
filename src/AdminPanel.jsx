import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Registro de componentes para ChartJS
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function AdminPanel() {
  // Estado para la navegación del panel
  const [activeTab, setActiveTab] = useState("all"); // "all", "today", "filter"
  // Para el filtro por fecha
  const [date, setDate] = useState("");
  const [report, setReport] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Estados para la edición de registros
  const [editStatus, setEditStatus] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [targetAttendance, setTargetAttendance] = useState(null);

  // Función para obtener el reporte según la pestaña activa
  const fetchReport = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setReport(null);
    let url = "http://localhost:5000/admin/attendance"; // Registro general por defecto
    if (activeTab === "today") {
      const today = new Date().toISOString().slice(0, 10);
      url = `http://localhost:5000/admin/attendance?date=${today}`;
    } else if (activeTab === "filter") {
      if (!date) {
        setErrorMsg("Por favor seleccione una fecha.");
        return;
      }
      url = `http://localhost:5000/admin/attendance?date=${date}`;
    }
    try {
      const res = await fetch(url, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Error al obtener reporte");
      } else {
        setReport(data);
      }
    } catch (error) {
      setErrorMsg("Error de conexión");
    }
  };

  // Se ejecuta automáticamente si se selecciona "Registro General" o "Asistencia de Hoy"
  useEffect(() => {
    if (activeTab === "all" || activeTab === "today") {
      fetchReport();
    }
  }, [activeTab]);

  // Funciones para abrir y actualizar el modal de edición
  const openEditModal = (attendance) => {
    setTargetAttendance(attendance);
    setEditStatus(attendance.status || "on_time");
    setShowEditModal(true);
  };

  const updateStatus = async () => {
    if (!targetAttendance) return;
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const body = {
        attendance_id: targetAttendance.attendance_id,
        new_status: editStatus,
      };
      if (!targetAttendance.attendance_id) {
        body.student_code = targetAttendance.student_code;
      }
      const res = await fetch("http://localhost:5000/admin/update_status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Error al actualizar");
      } else {
        setSuccessMsg(data.message);
        setShowEditModal(false);
        fetchReport();
      }
    } catch (error) {
      setErrorMsg("Error de conexión");
    }
  };

  // Función para renderizar las tablas de registros
  const renderTable = (title, data) => {
    return (
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-indigo-600 mb-2">
          {title} ({data.length})
        </h3>
        <div className="overflow-x-auto shadow rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-indigo-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                  Código
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                  Nombres
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                  Apellidos
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                  Estado
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                  Hora
                </th>
                <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {data.map((item, idx) => {
                const apellidos = `${item.paternal_surname} ${item.maternal_surname}`;
                const hora = item.timestamp
                  ? new Date(item.timestamp).toLocaleTimeString()
                  : "--:--";
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {item.student_code}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {item.first_name}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {apellidos}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {item.status}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {hora}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => openEditModal(item)}
                        className="bg-blue-500 text-white px-3 py-1 rounded transition-colors duration-200 hover:bg-blue-600 text-xs"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Configuración del gráfico
  const chartData = report
    ? {
        labels: ["Puntual", "Tarde", "Desde Afuera", "Faltó"],
        datasets: [
          {
            label: "Cantidad",
            data: [
              report.on_time ? report.on_time.length : 0,
              report.late ? report.late.length : 0,
              report.outside_campus ? report.outside_campus.length : 0,
              report.absent ? report.absent.length : 0,
            ],
            backgroundColor: [
              "rgba(34, 197, 94, 0.7)",
              "rgba(249, 115, 22, 0.7)",
              "rgba(59, 130, 246, 0.7)",
              "rgba(239, 68, 68, 0.7)",
            ],
            borderRadius: 4,
          },
        ],
      }
    : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: { font: { size: 14 } },
      },
      title: {
        display: true,
        text: "Reporte de Asistencia",
        font: { size: 16, weight: "600" },
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-2xl">
      <h2 className="text-3xl font-bold text-center text-purple-800 mb-6">
        Panel de Administración
      </h2>

      {/* Navegación con pestañas */}
      <div className="flex space-x-4 mb-6 justify-center">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded ${
            activeTab === "all"
              ? "bg-indigo-600 text-white"
              : "bg-gray-200 text-gray-800"
          }`}
        >
          Registro General
        </button>
        <button
          onClick={() => setActiveTab("today")}
          className={`px-4 py-2 rounded ${
            activeTab === "today"
              ? "bg-indigo-600 text-white"
              : "bg-gray-200 text-gray-800"
          }`}
        >
          Asistencia de Hoy
        </button>
        <button
          onClick={() => setActiveTab("filter")}
          className={`px-4 py-2 rounded ${
            activeTab === "filter"
              ? "bg-indigo-600 text-white"
              : "bg-gray-200 text-gray-800"
          }`}
        >
          Filtrar por Día
        </button>
      </div>

      {/* Si está en la pestaña de filtro se muestra el input y botón */}
      {activeTab === "filter" && (
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 justify-center">
          <input
            type="date"
            className="border px-3 py-2 rounded focus:ring-2 focus:ring-purple-300"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button
            onClick={fetchReport}
            className="bg-indigo-600 text-white px-4 py-2 rounded transition-all duration-200 hover:bg-indigo-700"
          >
            Filtrar
          </button>
        </div>
      )}

      {errorMsg && (
        <p className="text-red-600 text-center mb-4">{errorMsg}</p>
      )}
      {successMsg && (
        <p className="text-green-600 text-center mb-4">{successMsg}</p>
      )}

      {report && (
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            {activeTab === "all"
              ? "Registro General"
              : activeTab === "today"
              ? "Asistencia de Hoy"
              : `Reporte del ${date}`}
          </h3>

          <div className="mb-8 w-full h-80">
            <Bar data={chartData} options={chartOptions} />
          </div>

          {renderTable("Asistieron Puntual (on_time)", report.on_time)}
          {renderTable("Llegaron Tarde (late)", report.late)}
          {renderTable(
            "Intentaron desde Afuera (outside_campus)",
            report.outside_campus
          )}
          {renderTable("Faltaron (absent)", report.absent)}
        </div>
      )}

      {/* Modal para editar estado */}
      {showEditModal && targetAttendance && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-sm">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Editar Estado
            </h3>
            <p className="text-gray-600 mb-3">
              <span className="font-semibold">Código:</span>{" "}
              {targetAttendance.student_code}
            </p>
            <label className="block mb-2 font-medium text-gray-700">
              Nuevo Estado
            </label>
            <select
              className="border w-full px-3 py-2 rounded focus:ring focus:ring-purple-300 mb-4"
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
            >
              <option value="on_time">on_time</option>
              <option value="late">late</option>
              <option value="absent">absent</option>
              <option value="outside_campus">outside_campus</option>
            </select>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded transition-colors duration-200 hover:bg-gray-500"
              >
                Cancelar
              </button>
              <button
                onClick={updateStatus}
                className="bg-green-600 text-white px-4 py-2 rounded transition-colors duration-200 hover:bg-green-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
