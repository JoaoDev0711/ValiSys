const usuario = protegerPagina();

const form = document.getElementById("config-form");
const temaInputs = [...document.querySelectorAll('input[name="tema"]')];
const estiloInputs = [...document.querySelectorAll('input[name="estilo"]')];
const densidadeInputs = [...document.querySelectorAll('input[name="densidade"]')];

const sonsInput = document.getElementById("sons");
const somEntradaInput = document.getElementById("somEntrada");
const somCliqueInput = document.getElementById("somClique");
const somSucessoInput = document.getElementById("somSucesso");
const volumeInput = document.getElementById("volume");
const volumeValor = document.getElementById("volume-valor");
const reduzirMovimentoInput = document.getElementById("reduzirMovimento");
const fonteMaiorInput = document.getElementById("fonteMaior");
const resetBtn = document.getElementById("reset-config");
const testeSomBtn = document.getElementById("teste-som");
const statusConfig = document.getElementById("status-config");

function marcarRadio(inputs, valor) {
  const item = inputs.find(input => input.value === valor);
  if (item) item.checked = true;
}

function lerFormulario() {
  return {
    tema: temaInputs.find(input => input.checked)?.value || "claro",
    estilo: estiloInputs.find(input => input.checked)?.value || "minimalista",
    densidade: densidadeInputs.find(input => input.checked)?.value || "confortavel",
    sons: Boolean(sonsInput.checked),
    somEntrada: Boolean(somEntradaInput.checked),
    somClique: Boolean(somCliqueInput.checked),
    somSucesso: Boolean(somSucessoInput.checked),
    volume: Number(volumeInput.value || 55) / 100,
    reduzirMovimento: Boolean(reduzirMovimentoInput.checked),
    fonteMaior: Boolean(fonteMaiorInput.checked)
  };
}

function preencherFormulario() {
  const pref = valisysPreferencias.ler();

  marcarRadio(temaInputs, pref.tema);
  marcarRadio(estiloInputs, pref.estilo);
  marcarRadio(densidadeInputs, pref.densidade);

  sonsInput.checked = Boolean(pref.sons);
  somEntradaInput.checked = Boolean(pref.somEntrada);
  somCliqueInput.checked = Boolean(pref.somClique);
  somSucessoInput.checked = Boolean(pref.somSucesso);
  volumeInput.value = Math.round(Number(pref.volume || 0.55) * 100);
  reduzirMovimentoInput.checked = Boolean(pref.reduzirMovimento);
  fonteMaiorInput.checked = Boolean(pref.fonteMaior);

  atualizarVolume();
}

function atualizarVolume() {
  volumeValor.innerText = `${volumeInput.value}%`;
}

function atualizarDependenciasSom() {
  const ativo = sonsInput.checked;

  [somEntradaInput, somCliqueInput, somSucessoInput, volumeInput, testeSomBtn].forEach(item => {
    item.disabled = !ativo;
  });
}

function salvar(auto = false) {
  const pref = lerFormulario();
  valisysPreferencias.salvar(pref);

  statusConfig.innerText = auto
    ? "Preferências aplicadas com segurança neste aparelho."
    : "Configurações salvas.";

  if (!auto) {
    valisysPreferencias.tocarSom("sucesso");
  }
}

[...temaInputs, ...estiloInputs, ...densidadeInputs].forEach(input => {
  input.addEventListener("change", () => salvar(true));
});

[sonsInput, somEntradaInput, somCliqueInput, somSucessoInput, reduzirMovimentoInput, fonteMaiorInput].forEach(input => {
  input.addEventListener("change", () => {
    atualizarDependenciasSom();
    salvar(true);
  });
});

volumeInput.addEventListener("input", () => {
  atualizarVolume();
  salvar(true);
});

form.addEventListener("submit", event => {
  event.preventDefault();
  salvar(false);
});

testeSomBtn.addEventListener("click", () => {
  valisysPreferencias.tocarSom("sucesso");
});

resetBtn.addEventListener("click", async () => {
  const confirmar = await confirmarAcao(
    "Restaurar aparência, sons e acessibilidade para o padrão deste aparelho?",
    "Restaurar configurações"
  );

  if (!confirmar) return;

  localStorage.removeItem("valisysPreferencias");

  if (window.valisysPreferencias) {
    valisysPreferencias.salvar(valisysPreferencias.defaults);
  }

  preencherFormulario();
  atualizarDependenciasSom();
  statusConfig.innerText = "Padrão restaurado.";
});

preencherFormulario();
atualizarDependenciasSom();
