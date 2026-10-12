import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { StudentInput } from "../../shared/types";
import { api } from "../api";
import Avatar from "../components/Avatar";
import Icon from "../components/Icon";

const EMPTY: StudentInput = {
  name: "",
  photo: "",
  birthDate: "",
  school: "",
  guardianName: "",
  guardianPhone: "",
  notes: "",
  active: true,
};

/** Reduz a imagem para no máximo `max` px e comprime em JPEG (cabe fácil no banco). */
function resizeImage(file: File, max = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler a imagem."));
    };
    img.src = url;
  });
}

export default function StudentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<StudentInput>(EMPTY);
  const [loading, setLoading] = useState(!!id);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    api
      .student(id)
      .then(({ _id, ...rest }) => setForm(rest))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const set = <K extends keyof StudentInput>(key: K, value: StudentInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function onPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      set("photo", await resizeImage(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar a foto.");
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (id) await api.updateStudent(id, form);
      else await api.createStudent(form);
      navigate("/alunos");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o aluno.");
      setBusy(false);
    }
  }

  async function remove() {
    if (!id) return;
    try {
      await api.deleteStudent(id);
      navigate("/alunos");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível excluir o aluno.");
      setConfirmDelete(false);
    }
  }

  return (
    <main id="conteudo" className="page narrow" tabIndex={-1}>
      <div className="page-head">
        <div>
          <Link to="/alunos" className="link" style={{ display: "inline-flex", gap: 6, alignItems: "center", marginBottom: 10 }}>
            <Icon name="back" size={16} />
            Alunos
          </Link>
          <h1 className="h1">{id ? (form.name || "Editar aluno") : "Novo aluno"}</h1>
        </div>
      </div>

      {loading ? (
        <div className="form-grid" aria-hidden="true">
          <span className="skeleton" style={{ width: 160, height: 160, borderRadius: 999 }} />
          <div style={{ display: "grid", gap: 14 }}>
            <span className="skeleton" style={{ height: 46 }} />
            <span className="skeleton" style={{ height: 46 }} />
            <span className="skeleton" style={{ height: 46 }} />
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="form-grid">
          <div className="photo-col">
            <Avatar name={form.name} photo={form.photo} size={160} />
            <label className="btn sm" style={{ cursor: "pointer" }}>
              {form.photo ? "Trocar foto" : "Adicionar foto"}
              <input type="file" accept="image/*" onChange={onPhoto} hidden />
            </label>
            {form.photo && (
              <button type="button" className="link" onClick={() => set("photo", "")}>
                Remover foto
              </button>
            )}
          </div>

          <div>
            <fieldset className="fieldset">
              <legend>Dados do aluno</legend>
              <label className="field">
                <span>Nome completo</span>
                <input value={form.name} onChange={(e) => set("name", e.target.value)} required />
              </label>
              <div className="two">
                <label className="field">
                  <span>Data de nascimento</span>
                  <input type="date" value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)} />
                </label>
                <label className="field">
                  <span>Escola</span>
                  <input value={form.school} onChange={(e) => set("school", e.target.value)} />
                </label>
              </div>
            </fieldset>

            <fieldset className="fieldset">
              <legend>Responsável</legend>
              <div className="two">
                <label className="field">
                  <span>Nome</span>
                  <input value={form.guardianName} onChange={(e) => set("guardianName", e.target.value)} />
                </label>
                <label className="field">
                  <span>Telefone</span>
                  <input type="tel" value={form.guardianPhone} onChange={(e) => set("guardianPhone", e.target.value)} />
                </label>
              </div>
            </fieldset>

            <fieldset className="fieldset">
              <legend>Observações</legend>
              <label className="field">
                <span className="vh">Observações</span>
                <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} />
              </label>
              <label className="check-line">
                <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} />
                Aluno ativo (aparece na chamada)
              </label>
            </fieldset>

            {error && (
              <div className="notice error" role="alert" style={{ marginBottom: 16 }}>
                {error}
              </div>
            )}

            <div className="actions">
              <button className="btn primary" disabled={busy} style={{ minWidth: 140 }}>
                {busy ? "Salvando…" : "Salvar"}
              </button>
              <Link to="/alunos" className="btn quiet">
                Cancelar
              </Link>
            </div>

            {id && (
              <div className="danger-zone">
                {confirmDelete ? (
                  <>
                    <p>Isso apaga o aluno e todo o histórico de presenças dele. Não dá para desfazer.</p>
                    <div className="actions">
                      <button type="button" className="btn danger solid sm" onClick={remove}>
                        Excluir definitivamente
                      </button>
                      <button type="button" className="btn quiet sm" onClick={() => setConfirmDelete(false)}>
                        Manter aluno
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p>Para tirar o aluno da chamada sem perder o histórico, desmarque “Aluno ativo”.</p>
                    <button type="button" className="btn danger sm" onClick={() => setConfirmDelete(true)}>
                      Excluir aluno
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </form>
      )}
    </main>
  );
}
