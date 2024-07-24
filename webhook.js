var express = require("express");
var axios = require("axios");
const fs = require("fs");
const csv = require("csv-parser");

const productos = [];

const app = express();
app.use(express.json());

const { WEBHOOK_VERIFY_TOKEN, GRAPH_API_TOKEN, PORT, PHONE_ID } = process.env;

// Leer datos del CSV
fs.createReadStream("productos.csv")
  .pipe(csv())
  .on("data", (row) => {
    productos.push(row);
  })
  .on("end", () => {
    console.log("CSV file successfully processed");
  });

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

// Función para procesar mensajes entrantes
const processIncomingMessage = (msg) => {
  const content = msg.text.body.toUpperCase();
  const chatId = msg.from;

  const codigos = content.split(" ");
  const respuestas = codigos.map((codigo) => {
    const producto = productos.find((p) => p.CODIGO === codigo);
    if (producto) {
      const infoProducto = `
${producto["Vendido"] == "SI" ? "❌ Vendido" : producto["Apartado"] == "SI" ? "🔒 Apartado" : "✅ Disponible"}

*💰 PRECIO: \$${producto["Precio Sugerido"]}*

🔍 ${producto.DESCRIPCION} ${producto.MARCA}
Talla: ${producto.TALLA}
Color: ${capitalize(producto.COLOR)}

📍 Ubicación: ${producto.Ubicacion}`;
      return { codigo, infoProducto, imageUrl: producto.IMAGEN };
    } else {
      return {
        codigo,
        infoProducto: "Producto no encontrado",
        imageUrl: null,
      };
    }
  });

  respuestas.forEach(({ codigo, infoProducto, imageUrl }) => {
    sendImageMessage(chatId, imageUrl, `Código: ${codigo}\n${infoProducto}`);
  });
};

app.post("/webhook", async (req, res) => {
  const entry = req.body.entry[0];
  const changes = entry.changes[0];
  const value = changes.value;
  const message = value.messages && value.messages[0];

  if (message) {
    processIncomingMessage(message);
  }

  res.sendStatus(200);
});

// accepts GET requests at the /webhook endpoint. You need this URL to setup webhook initially.
// info on verification request payload: https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  // check the mode and token sent are correct
  if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
    // respond with 200 OK and challenge token from the request
    res.status(200).send(challenge);
    console.log("Webhook verified successfully!");
  } else {
    // respond with '403 Forbidden' if verify tokens do not match
    res.sendStatus(403);
  }
});

app.get("/", (req, res) => {
  res.send(`<pre>Nothing to see here.
Checkout README.md to start.</pre>`);
});

app.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`);
});

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}
