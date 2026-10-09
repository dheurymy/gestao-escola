const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Valida e normaliza o corpo de um aluno. Retorna o objeto limpo ou uma mensagem de erro. */
export function cleanStudent(body: any) {
  const name = str(body?.name, 120);
  if (!name) return "Informe o nome do aluno";
  const birthDate = str(body?.birthDate, 10);
  if (birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return "Data de nascimento inválida";
  const photo = typeof body?.photo === "string" ? body.photo : "";
  if (photo && (!photo.startsWith("data:image/") || photo.length > 400_000)) {
    return "Foto inválida ou muito grande";
  }
  return {
    name,
    photo,
    birthDate,
    school: str(body?.school, 120),
    guardianName: str(body?.guardianName, 120),
    guardianPhone: str(body?.guardianPhone, 30),
    notes: str(body?.notes, 1000),
    active: body?.active !== false,
  };
}
