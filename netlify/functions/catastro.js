exports.handler = async function(event) {
  const { rc, provincia, municipio, tipovia, nomvia, numero } = event.queryStringParameters || {};

  let url;

  if (rc) {
    url = `https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/json/ConsultaDNPRC?RefCat=${encodeURIComponent(rc)}`;
  } else if (provincia && municipio && tipovia && nomvia && numero) {
    url = `https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/json/ConsultaDNPLOC?Provincia=${encodeURIComponent(provincia)}&Municipio=${encodeURIComponent(municipio)}&TipoVia=${encodeURIComponent(tipovia)}&NomVia=${encodeURIComponent(nomvia)}&Numero=${encodeURIComponent(numero)}`;
  } else {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Parámetros insuficientes. Usa rc= o provincia+municipio+tipovia+nomvia+numero' })
    };
  }

  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: `Catastro respondió con error ${response.status}` })
      };
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(data)
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Error conectando con Catastro: ' + err.message })
    };
  }
};
