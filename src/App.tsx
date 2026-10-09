import { NavLink, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth";
import Login from "./pages/Login";
import Attendance from "./pages/Attendance";
import Students from "./pages/Students";
import StudentForm from "./pages/StudentForm";
import Reports from "./pages/Reports";

function Shell() {
  const { user, loading, logout } = useAuth();
  if (loading) return <div className="center muted">Carregando…</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="shell">
      <header className="topbar">
        <strong>Gestão Escola</strong>
        <span className="spacer" />
        <span className="muted hide-sm">{user.name}</span>
        <button className="btn ghost" onClick={logout}>
          Sair
        </button>
      </header>
      <main className="content">
        <Outlet />
      </main>
      <nav className="tabbar">
        <NavLink to="/chamada">Chamada</NavLink>
        <NavLink to="/alunos">Alunos</NavLink>
        <NavLink to="/relatorios">Relatórios</NavLink>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Shell />}>
        <Route path="/chamada" element={<Attendance />} />
        <Route path="/alunos" element={<Students />} />
        <Route path="/alunos/novo" element={<StudentForm />} />
        <Route path="/alunos/:id" element={<StudentForm />} />
        <Route path="/relatorios" element={<Reports />} />
        <Route path="*" element={<Navigate to="/chamada" replace />} />
      </Route>
    </Routes>
  );
}
