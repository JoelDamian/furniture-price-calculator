/**
 * SUBIR IMÁGENES A GOOGLE DRIVE
 *
 * SI VES "Acceso denegado: DriveApp", sigue ESTOS PASOS EN ORDEN:
 *
 * A) PERMISOS (solo una vez)
 *    1. Ve a https://myaccount.google.com/permissions
 *    2. Elimina el acceso del proyecto "Proyecto sin título" (o como se llame)
 *    3. En script.google.com elige la función "probarAccesoCarpeta" y pulsa Ejecutar
 *    4. Al autorizar, acepta acceso a Google Drive (debe decir "ver, editar, crear
 *       y eliminar TODOS tus archivos de Drive")
 *    5. Ver > Registros → debe decir "OK - Carpeta: ImagenesArmonya"
 *
 * B) MANIFEST (scopes de Drive)
 *    1. En Apps Script: ⚙ Configuración del proyecto
 *    2. Activa "Mostrar el archivo de manifest appsscript.json en el editor"
 *    3. Abre appsscript.json y pega el contenido de scripts/appsscript.json del repo
 *
 * C) IMPLEMENTACIÓN (MUY IMPORTANTE)
 *    1. Implementar > Administrar implementaciones > Editar
 *    2. Ejecutar como: YO (tu email)  ← NO "Usuario que accede"
 *    3. Quién tiene acceso: Cualquier persona
 *    4. Nueva versión > Implementar
 *
 * D) CUENTA CORRECTA
 *    - Usa la misma cuenta de Google en script.google.com, Drive y el navegador
 *    - La carpeta ImagenesArmonya debe estar en "Mi unidad" de ESA cuenta
 */

const DEFAULT_FOLDER_ID = '10uF_tAe33O_lajM-o-SDOJUON0uUP8qy';

/** Ejecutar UNA VEZ desde el editor para autorizar Drive */
function probarAccesoCarpeta() {
  const email = Session.getEffectiveUser().getEmail();
  Logger.log('Cuenta que ejecuta el script: ' + email);

  const folder = DriveApp.getFolderById(DEFAULT_FOLDER_ID);
  Logger.log('OK - Carpeta: ' + folder.getName());

  // Prueba real de escritura
  const testBlob = Utilities.newBlob('test', 'text/plain', 'test-permisos.txt');
  const testFile = folder.createFile(testBlob);
  testFile.setTrashed(true);
  Logger.log('OK - Escritura en carpeta verificada');
}

function doGet() {
  return jsonResponse({
    success: true,
    message: 'Servicio de subida activo',
  });
}

function doPost(e) {
  try {
    const data = parseRequestData(e);
    const folderId = data.folderId || DEFAULT_FOLDER_ID;
    const { fileName, mimeType, base64Data } = data;

    if (!fileName || !mimeType || !base64Data) {
      return respond(e, { success: false, error: 'Faltan campos requeridos' });
    }

    const bytes = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(bytes, mimeType, fileName);

    const folder = DriveApp.getFolderById(folderId);
    const file = folder.createFile(blob);
    const fileId = file.getId();

    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (sharingError) {
      Logger.log('No se pudo compartir el archivo: ' + sharingError);
    }

    const url = 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w400';

    return respond(e, {
      success: true,
      fileId: fileId,
      url: url,
    });
  } catch (error) {
    Logger.log('Error doPost: ' + error);
    return respond(e, { success: false, error: error.toString() });
  }
}

function parseRequestData(e) {
  if (e.postData && e.postData.contents) {
    return JSON.parse(e.postData.contents);
  }
  if (e.parameter && e.parameter.payload) {
    return JSON.parse(e.parameter.payload);
  }
  throw new Error('No se recibieron datos en la solicitud');
}

function respond(e, obj) {
  if (e.parameter && e.parameter.mode === 'iframe') {
    return htmlPostMessageResponse(obj);
  }
  return jsonResponse(obj);
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function htmlPostMessageResponse(obj) {
  const message = JSON.stringify({
    type: 'gas-upload-result',
    success: obj.success,
    url: obj.url || null,
    fileId: obj.fileId || null,
    error: obj.error || null,
  });
  const html =
    '<!DOCTYPE html><html><head><base target="_top"></head><body>' +
    '<script>window.parent.postMessage(' + message + ', "*");</script>' +
    '</body></html>';
  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}
