exports.handler = async function(event) {
  const params = event.queryStringParameters || {};
  const { rc, provincia, municipio, tipovia, nomvia, numero, bloque, escalera, planta, puerta } = params;

  let url;

  if (rc) {
    const rcClean = rc.trim().replace(/\s/g, '').toUpperCase();
    url = `https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/json/ConsultaDNPRC?RefCat=${encodeURIComponent(rcClean)}`;
  } else if (provincia && municipio && nomvia && numero) {
    const tv = tipovia || 'CL';
    let locUrl = `https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/json/ConsultaDNPLOC?Provincia=${encodeURIComponent(provincia)}&Municipio=${encodeURIComponent(municipio)}&TipoVia=${encodeURIComponent(tv)}&NomVia=${encodeURIComponent(nomvia)}&Numero=${encodeURIComponent(numero)}`;
    if (bloque)   locUrl += `&Bloque=${encodeURIComponent(bloque)}`;
    if (escalera) locUrl += `&Escalera=${encodeURIComponent(escalera)}`;
    if (planta)   locUrl += `&Planta=${encodeURIComponent(planta)}`;
    if (puerta)   locUrl += `&Puerta=${encodeURIComponent(puerta)}`;
    url = locUrl;
  } else {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Introduce una referencia catastral o los datos de dirección (provincia, municipio, vía y número).' })
    };
  }

  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'VOhome-Valoracion/1.0' }
    });

    const text = await response.text();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: `Catastro respondió con error ${response.status}. Comprueba que la referencia catastral es correcta.`, raw: text.substring(0, 300) })
      };
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch(e) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Catastro devolvió una respuesta inesperada.', raw: text.substring(0, 300) })
      };
    }

    if (data?.lerr?.err?.cod) {
      const cod = data.lerr.err.cod;
      const msgs = {
        '43': 'Referencia catastral no encontrada. Comprueba que es correcta.',
        '44': 'No se encontró ningún inmueble con esa dirección.',
        '1':  'Error en los parámetros enviados a Catastro.'
      };
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: msgs[cod] || `Error Catastro código ${cod}.` })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(data)
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Error de red al contactar con Catastro: ' + err.message })
    };
  }
};
