import { writeFile } from "node:fs/promises";

const APP_URL = "http://127.0.0.1:5173";
const CDP_VERSION_URL = "http://127.0.0.1:9223/json/version";

const users = {
  admin: {
    id: 1,
    nombre: "Juan Lopez",
    email: "juan.lopez@demo.local",
    rol: "admin",
    estado: "activo",
    coordinador_id: null,
  },
  coordinador: {
    id: 2,
    nombre: "Carlos Perez",
    email: "carlos.perez@demo.local",
    rol: "coordinador",
    estado: "activo",
    coordinador_id: null,
    coordinador_validado: true,
  },
  operador: {
    id: 3,
    nombre: "Ana Martinez",
    email: "ana.martinez@demo.local",
    rol: "operador",
    estado: "activo",
    coordinador_id: 2,
  },
  consulta: {
    id: 4,
    nombre: "Maria Garcia",
    email: "maria.garcia@demo.local",
    rol: "consulta",
    estado: "activo",
    coordinador_id: 2,
  },
};

let activeUser = users.admin;
let documentId = 101;
let documents = [];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function response(body) {
  return {
    responseCode: 200,
    responseHeaders: [{ name: "Content-Type", value: "application/json; charset=UTF-8" }],
    body: Buffer.from(JSON.stringify(body)).toString("base64"),
  };
}

function documentRowsFor(user) {
  return documents.map((doc) => ({
    ...doc,
    coordinador_nombre: "Carlos Perez",
    coordinador_email: "carlos.perez@demo.local",
    creado_por_nombre: "Maria Garcia",
    creado_por_email: "maria.garcia@demo.local",
    firmado_por_nombre: doc.firmado_por ? "Carlos Perez" : null,
    firmado_por_email: doc.firmado_por ? "carlos.perez@demo.local" : null,
  }));
}

async function handleApi(url, method, postData) {
  if (url.includes("/api/login.php")) {
    const body = postData ? JSON.parse(postData) : {};
    const match = Object.values(users).find((user) => user.email === body.email) || users.admin;
    activeUser = match;
    return response({ success: true, usuario: match });
  }

  if (url.includes("/api/validar_sesion.php")) {
    const body = postData ? JSON.parse(postData) : {};
    const match = Object.values(users).find((user) => user.id === body.id) || activeUser;
    activeUser = match;
    return response({ success: true, usuario: match });
  }

  if (url.includes("/api/documentos.php")) {
    return response({ success: true, documentos: documentRowsFor(activeUser) });
  }

  if (url.includes("/api/crear_documento.php")) {
    const doc = {
      id: documentId,
      titulo: "Expediente de validacion",
      descripcion: "Documento de ejemplo para el flujo de revision y firma.",
      archivo_nombre: "expediente-validacion.pdf",
      archivo_ruta: "uploads/documentos/doc_demo_expediente.pdf",
      etapa: "V",
      coordinador_id: 2,
      creado_por: users.consulta.id,
      firma_coordinador: null,
      folio_firma: null,
      accion_firma: null,
      firmado_por: null,
      fecha_firma: null,
    };
    documents = [doc];
    return response({
      success: true,
      mensaje: "Documento creado correctamente",
      documento_id: documentId,
    });
  }

  if (url.includes("/api/avanzar_documento.php")) {
    const body = postData ? JSON.parse(postData) : {};
    documents = documents.map((doc) => {
      if (doc.id !== body.documento_id) return doc;
      if (doc.etapa === "V") return { ...doc, etapa: "O" };
      if (doc.etapa === "C") return { ...doc, etapa: "A" };
      return doc;
    });
    return response({
      success: true,
      mensaje: "Documento avanzado correctamente",
    });
  }

  if (url.includes("/api/firmar_documento.php")) {
    const folio = "FIR-20260604-120000-DOC101-USR2";
    documents = documents.map((doc) => ({
      ...doc,
      etapa: doc.id === documentId ? "C" : doc.etapa,
      firma_coordinador: doc.id === documentId ? "firma-demo-base64" : doc.firma_coordinador,
      folio_firma: doc.id === documentId ? folio : doc.folio_firma,
      accion_firma:
        doc.id === documentId
          ? "El coordinador firmo digitalmente el documento y lo avanzo de Operador a Coordinador"
          : doc.accion_firma,
      firmado_por: doc.id === documentId ? users.coordinador.id : doc.firmado_por,
      fecha_firma: doc.id === documentId ? "2026-06-04 12:00:00" : doc.fecha_firma,
    }));
    return response({
      success: true,
      mensaje: "Documento firmado correctamente",
      etapa: "C",
      folio_firma: folio,
    });
  }

  if (url.includes("/api/verificar_firma_documento.php")) {
    return response({
      success: true,
      mensaje: "Firma valida",
      coordinador: "Carlos Perez",
    });
  }

  return response({ success: true });
}

class CdpClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.handlers = new Map();
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
    });
    this.ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(message.error.message));
        else resolve(message.result);
        return;
      }
      const handler = this.handlers.get(message.method);
      if (handler) handler(message);
    });
  }

  send(method, params = {}, sessionId = undefined) {
    const id = this.nextId++;
    this.ws.send(JSON.stringify({ id, method, params, sessionId }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  on(method, handler) {
    this.handlers.set(method, handler);
  }
}

async function main() {
  const version = await fetch(CDP_VERSION_URL).then((res) => res.json());
  const cdp = new CdpClient(version.webSocketDebuggerUrl);
  await cdp.open();

  const target = await cdp.send("Target.createTarget", { url: "about:blank" });
  const attached = await cdp.send("Target.attachToTarget", {
    targetId: target.targetId,
    flatten: true,
  });
  const sessionId = attached.sessionId;

  cdp.on("Fetch.requestPaused", async (message) => {
    if (message.sessionId !== sessionId) return;
    const { requestId, request } = message.params;
    const apiResponse = await handleApi(request.url, request.method, request.postData);
    await cdp.send("Fetch.fulfillRequest", { requestId, ...apiResponse }, sessionId);
  });

  cdp.on("Page.javascriptDialogOpening", async () => {
    await cdp.send(
      "Page.handleJavaScriptDialog",
      { accept: true, promptText: "FirmaDemo2026" },
      sessionId
    );
  });

  await cdp.send("Page.enable", {}, sessionId);
  await cdp.send("Runtime.enable", {}, sessionId);
  await cdp.send("Fetch.enable", { patterns: [{ urlPattern: "*://*/api/*" }] }, sessionId);
  await cdp.send(
    "Emulation.setDeviceMetricsOverride",
    { width: 1440, height: 1600, deviceScaleFactor: 1, mobile: false },
    sessionId
  );

  async function navigate(path) {
    await cdp.send("Page.navigate", { url: `${APP_URL}${path}` }, sessionId);
    await delay(900);
  }

  async function evalJs(expression) {
    return cdp.send(
      "Runtime.evaluate",
      { expression, awaitPromise: true, returnByValue: true },
      sessionId
    );
  }

  async function setUser(user) {
    activeUser = user;
    await evalJs(`localStorage.setItem("usuario", ${JSON.stringify(JSON.stringify(user))})`);
  }

  async function screenshot(name) {
    await evalJs("window.scrollTo(0, 0)");
    await delay(500);
    const result = await cdp.send("Page.captureScreenshot", { format: "png" }, sessionId);
    await writeFile(`manual_usuario/capturas/${name}.png`, Buffer.from(result.data, "base64"));
    console.log(`captured ${name}.png`);
  }

  await navigate("/");
  await screenshot("01-login");

  await evalJs(`
    document.querySelector('input[type="email"]').value = "juan.lopez@demo.local";
    document.querySelector('input[type="email"]').dispatchEvent(new Event("input", { bubbles: true }));
    document.querySelector('input[type="password"]').value = "Demo1234";
    document.querySelector('input[type="password"]').dispatchEvent(new Event("input", { bubbles: true }));
    document.querySelector("form").requestSubmit();
  `);
  await delay(1100);
  await screenshot("02-dashboard-admin");

  await setUser(users.admin);
  await navigate("/documentos");
  await screenshot("03-gestor-documentos-inicial");

  await setUser(users.consulta);
  await navigate("/documentos");
  await screenshot("04-formulario-nuevo-documento");

  await evalJs(`
    const title = [...document.querySelectorAll("input")].find((input) => input.placeholder.includes("Expediente"));
    title.value = "Expediente de validacion";
    title.dispatchEvent(new Event("input", { bubbles: true }));
    const desc = document.querySelector("textarea");
    desc.value = "Documento de ejemplo para el flujo de revision y firma.";
    desc.dispatchEvent(new Event("input", { bubbles: true }));
    document.querySelector("form").requestSubmit();
  `);
  await delay(1200);
  await screenshot("05-documento-etapa-ventanilla");

  await setUser(users.operador);
  await navigate("/documentos");
  await screenshot("06-aprobacion-operador");
  await evalJs(`[...document.querySelectorAll("button")].find((button) => button.textContent.includes("Aprobar")).click()`);
  await delay(900);
  await cdp.send("Page.handleJavaScriptDialog", { accept: true }, sessionId).catch(() => {});
  await delay(900);
  await screenshot("07-documento-etapa-operador");

  await setUser(users.coordinador);
  await navigate("/documentos");
  await screenshot("08-firma-coordinador");
  await evalJs(`[...document.querySelectorAll("button")].find((button) => button.textContent.includes("Firmar documento")).click()`);
  await delay(1500);
  await screenshot("09-ticket-firma");

  await evalJs(`[...document.querySelectorAll("button")].find((button) => button.textContent.includes("Verificar firma")).click()`);
  await delay(600);
  await cdp.send("Page.handleJavaScriptDialog", { accept: true }, sessionId).catch(() => {});
  await delay(600);
  await screenshot("10-verificacion-firma");

  await setUser(users.admin);
  await navigate("/documentos");
  await screenshot("11-insercion-final-admin");
  await evalJs(`[...document.querySelectorAll("button")].find((button) => button.textContent.includes("Inserción final")).click()`);
  await delay(900);
  await cdp.send("Page.handleJavaScriptDialog", { accept: true }, sessionId).catch(() => {});
  await delay(900);
  await screenshot("12-documento-finalizado");

  await cdp.send("Target.closeTarget", { targetId: target.targetId });
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
