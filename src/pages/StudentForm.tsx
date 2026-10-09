import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { StudentInput } from "../../shared/types";
import { api } from "../api";
import Avatar from "../components/Avatar";

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
      reject(new Error("Não foi possível ler a imagem"));
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
      setError(err instanceof Error ? err.message : "Erro na foto");
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
      setError(err instanceof Error ? err.message : "Erro ao salvar");
      setBusy(false);
    }
  }

  async function remove() {
    if (!id) return;
    if (!confirm("Excluir este aluno e TODO o histórico de presenças dele? Isso não pode ser desfeito.")) return;
    try {
      await api.deleteStudent(id);
      navigate("/alunos");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir");
    }
  }

  if (loading) return <p className="muted">Carregando…</p>;

  return (
    <form className="form" onSubmit={submit}>
      <div className="row between">
        <h2>{id ? "Editar aluno" : "Novo aluno"}</h2>
        <Link to="/alunos" className="link">
          Cancelar
        </Link>
      </div>

      <div className="photo-pick">
        <Avatar name={form.name} photo={form.photo} size={96} />
        <div className="stack">
          <label className="btn">
            {form.photo ? "Trocar foto" : "Adicionar foto"}
            <input type="file" accept="image/*" onChange={onPhoto} hidden />
          </label>
          {form.photo && (
            <button type="button" className="link" onClick={() => set("photo", "")}>
              Remover foto
            </button>
          )}
        </div>
      </div>

      <label>
        Nome *
        <input value={form.name} onChange={(e) => set("name", e.target.value)} required />
      </label>
      <label>
        Data de nascimento
        <input type="date" value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)} />
      </label>
      <label>
        Escola
        <input value={form.school} onChange={(e) => set("school", e.target.value)} />
      </label>
      <label>
        Responsável
        <input value={form.guardianName} onChange={(e) => set("guardianName", e.target.value)} />
      </label>
      <label>
        Telefone do responsável
        <input
          type="tel"
          value={form.guardianPhone}
          onChange={(e) => set("guardianPhone", e.target.value)}
        />
      </label>
      <label>
        Observações
        <textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      </label>
      <label className="check-line">
        <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} />
        Aluno ativo (aparece na chamada)
      </label>

      {error && <div className="error">{error}</div>}
      <button className="btn primary" disabled={busy}>
        {busy ? "Salvando…" : "Salvar"}
      </button>
      {id && (
        <button type="button" className="btn danger" onClick={remove}>
          Excluir aluno
        </button>
      )}
    </form>
  );
}
