var axios = require("axios").default;
const { exec } = require('child_process');
const { promisify } = require('util');

const execPromise = promisify(exec);

const { GRAPH_API_TOKEN, PHONE_ID, DEBUG } = process.env;

// Función para enviar mensajes con imagen
const sendMessage = async (to, text, imageUrl) => {
  const req = {
    messaging_product: "whatsapp",
    to,
    text: { body: text },
  }
  if (imageUrl) {
    req["type"] = "image"
    req["image"] = {
      link: imageUrl,
      caption: text,
    }
  }
  try {
    !! DEBUG && console.log("request",
      `https://graph.facebook.com/v20.0/${PHONE_ID}/messages`,
      req,
      {
        headers: {
          Authorization: `Bearer ${GRAPH_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    const response = await axios.post(
      `https://graph.facebook.com/v20.0/${PHONE_ID}/messages`,
      req,
      {
        headers: {
          Authorization: `Bearer ${GRAPH_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    !! DEBUG && console.log("response", response);
    if (response.status != 200) {
      return {
        success: false,
        message: response.statusText,
      }
    }
    return {
      success: true,
      message: text,
    }
  } catch (error) {
    console.error(
      "Error sending image message:",
      error.response ? error.response.data : error.message
    );
    return {
      success: false,
      message: error.response ? error.response.data : error.message,
    }
  }
};

async function runPythonScript(chatId) {
  const pythonCommand = '/home/wuilliam/proyectos/7db-pagomovil/.venv/bin/python /home/wuilliam/proyectos/7db-pagomovil/run.py 17129071 \\$carlos8 1464,40';
  // const pythonCommand = '/usr/bin/python3 /home/wuilliam/proyectos/7db-pagomovil/run.py 16444162 \\*Aurora8 1464,40';

    const { stdout, stderr } = await execPromise(pythonCommand, { shell: '/bin/bash' });

    if (stderr) {
      console.error(`Error en la salida estándar: ${stderr}`);
      return;
    }

    const lines = stdout.trim().split('\n');

    let msg = "Saldo:\n" + lines[0] + "\n";
    msg += "Ultimos movimientos:\n" + lines.slice(1, 6).join("\n");
    return await sendMessage(chatId, msg);
}

function getProductInfo(producto) {
  const disponibilidad = producto["Vendido"] == "SI" ? "❌ Vendido" : producto["Apartado"] == "SI" ? "🔒 Apartado" : "✅ Disponible";
  const precio = `*💰 PRECIO: \$${producto["Precio Sugerido"]}*`
  const descripcion = `🔍 ${producto.DESCRIPCION}`
  const marca = producto.MARCA
  const talla = `Talla: ${capitalize(producto.TALLA)}`
  const color = `Color: ${capitalize(producto.COLOR)}`
  const ubicacion = `📍 Ubicación: ${producto.Ubicacion}`

  return `
${disponibilidad}

${precio}

${descripcion} ${marca}
${talla}
${color}

${ubicacion}`;
}

// Función para procesar mensajes entrantes
const processIncomingMessage = async (message, productos) => {
  try {
    if (!message.text || !message.text.body) {
      return {
        success: false,
        message: "Empty message",
      }
    }

    const content = message.text.body.toUpperCase();
    if (content.trim().toLowerCase() == "pagomovil" || content.trim().toLowerCase() == "pago movil" || content.trim().toLowerCase() == "pago móvil") {
      const res = await sendMessage(message.from, "Un momento por favor...");
      if (!res.success) {
        return res;
      }
      return runPythonScript(message.from);
    } else {
      const codigo = content.trim();
      let respuesta = {};
      const producto = productos.find((p) => p.CODIGO === codigo);
      if (producto) {
        const infoProducto = getProductInfo(producto);
        respuesta = { codigo, infoProducto, imageUrl: producto.IMAGEN };
      } else {
        respuesta = { codigo, infoProducto: "Producto no encontrado", imageUrl: null };
      }

      return await sendMessage(message.from, `Código: ${respuesta.codigo}\n${respuesta.infoProducto}`, respuesta.imageUrl);
    }
  } catch (error) {
    console.error(
      "Error procesando mensaje entrante:",
      error.response ? error.response.data : error.message
    );
    return {
      success: false,
      message: error.response ? error.response.data : error.message,
    }
  }
};

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

module.exports = { processIncomingMessage };
