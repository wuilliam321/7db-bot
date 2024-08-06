var axios = require("axios");
const { exec } = require('child_process');
const { promisify } = require('util');

const execPromise = promisify(exec);

const { GRAPH_API_TOKEN, PHONE_ID } = process.env;

// Función para enviar mensajes con imagen
const sendImageMessage = async (to, imageUrl, text) => {
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
    console.log("Image message sent:", response.data);
  } catch (error) {
    console.error(
      "Error sending image message:",
      error.response ? error.response.data : error.message
    );
  }
};

async function runPythonScript(chatId) {
  const pythonCommand = '/usr/bin/python3 /home/wuilliam/personal/7db-pagomovil/run.py 17129071 \\$carlos8 1464,40';
  // const pythonCommand = '/usr/bin/python3 /home/wuilliam/personal/7db-pagomovil/run.py 16444162 \\*Aurora8 1464,40';

  try {
    const { stdout, stderr } = await execPromise(pythonCommand, { shell: '/bin/bash' });

    if (stderr) {
      console.error(`Error en la salida estándar: ${stderr}`);
      return;
    }

    const lines = stdout.trim().split('\n');
    console.log(lines);

    let msg = "Saldo:\n" + lines[0] + "\n";
    msg += "Ultimos movimientos:\n" + lines.slice(1, 6).join("\n");
    sendImageMessage(chatId, "", msg);
  } catch (error) {
    console.error(`Error al ejecutar el comando: ${error.message}`);
      sendImageMessage(chatId, "", "❌ No se pudo ingresar al banco");
  }
}

// Función para procesar mensajes entrantes
const processIncomingMessage = async (message, productos) => {
  try {
    if (message.text.body == "") {
      return false;
    }

    const content = message.text.body.toUpperCase();
    if (content.trim().toLowerCase() == "pagomovil" || content.trim().toLowerCase() == "pago movil" || content.trim().toLowerCase() == "pago móvil") {
      console.log("vamos a verificar pago movil")
      sendImageMessage(message.from, "", "Un momento por favor...");
      runPythonScript(message.from);
      return true;
    } else {
      const codigos = content.split(" ");
      let respuestas = [];
      for (let codigo of codigos) {
        const producto = productos.find((p) => p.CODIGO === codigo);
        if (producto) {
          const infoProducto = `
${producto["Vendido"] == "SI" ? "❌ Vendido" : producto["Apartado"] == "SI" ? "🔒 Apartado" : "✅ Disponible"}

*💰 PRECIO: \$${producto["Precio Sugerido"]}*

🔍 ${producto.DESCRIPCION} ${producto.MARCA}
Talla: ${capitalize(producto.TALLA)}
Color: ${capitalize(producto.COLOR)}

📍 Ubicación: ${producto.Ubicacion}`;
          respuestas.push({ codigo, infoProducto, imageUrl: producto.IMAGEN });
        } else {
          respuestas.push({
            codigo,
            infoProducto: "Producto no encontrado",
            imageUrl: null,
          });
        }
      }

      for (let respuesta of respuestas) {
        sendImageMessage(message.from, respuesta.imageUrl, `Código: ${respuesta.codigo}\n${respuesta.infoProducto}`);
      }
    }
  } catch (error) {
    console.error(
      "Error procesando mensaje entrante:",
      error.response ? error.response.data : error.message
    );
    return false;
  }

  return true;
};

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

module.exports = { processIncomingMessage };
