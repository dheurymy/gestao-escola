import { Link, NavLink, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth";
import Icon, { Logo } from "./components/Icon";
import Avatar from "./components/Avatar";
import Login from "./pages/Login";
import Attendance from "./pages/Attendance";
import Students from "./pages/Students";
import StudentForm from "./pages/StudentForm";
import Reports from "./pages/Reports";
import Teachers from "./pages/Teachers";

function Shell() {
  const { user, loading, logout } = useAuth();
  if (loading) return <div className="center-screen">Carregando…</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app">
      <a className="skip" href="#conteudo">
        Pular para o conteúdo
      </a>
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/chamada" className="brand">
            <Logo />
            Gestão Escola
          </Link>
          <nav className="nav" aria-label="Principal">
            <NavLink to="/chamada">
              <Icon name="list" />
              Chamada
            </NavLink>
            <NavLink to="/alunos">
              <Icon name="users" />
              Alunos
            </NavLink>
            <NavLink to="/relatorios">
              <Icon name="chart" />
              Relatórios
            </NavLink>
            <NavLink to="/professores">
              <Icon name="teacher" />
              Professores
            </NavLink>
          </nav>
          <div className="userbox">
            <span className="who">{user.name}</span>
            <Avatar name={user.name} size={32} />
            <button className="btn quiet sm" onClick={logout}>
              Sair
            </button>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}

function NotFound() {
  return (
    <main id="conteudo" className="page narrow" tabIndex={-1}>
      <div className="empty">
        <div className="glyph">
          <Icon name="search" size={24} />
        </div>
        <strong>Página não encontrada</strong>
        <p>O endereço não existe ou foi movido.</p>
        <Link className="btn primary" to="/chamada">
          Voltar para a chamada
        </Link>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Shell />}>
        <Route path="/" element={<Navigate to="/chamada" replace />} />
        <Route path="/chamada" element={<Attendance />} />
        <Route path="/alunos" element={<Students />} />
        <Route path="/alunos/novo" element={<StudentForm />} />
        <Route path="/alunos/:id" element={<StudentForm />} />
        <Route path="/relatorios" element={<Reports />} />
        <Route path="/professores" element={<Teachers />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
