/* ValiSys - Registro PWA */
(function () {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .catch(erro => console.warn("Service worker não registrado:", erro));
  });
})();
