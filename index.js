const axios = require('axios');
const fs = require('fs');
const csv = require('csv-parser');

const productos = [];
const { GRAPH_API_TOKEN, PHONE_ID } = process.env;

// Leer datos del CSV
fs.createReadStream('productos.csv')
  .pipe(csv())
  .on('data', (row) => {
    productos.push(row);
  })
  .on('end', () => {
    console.log('CSV file successfully processed');
  });

// Función para enviar mensajes de texto
const sendMessage = async (to, text) => {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v20.0/${PHONE_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        text: { body: text }
      },
      {
        headers: {
          Authorization: `Bearer ${GRAPH_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Message sent:', response.data);
  } catch (error) {
    console.error('Error sending message:', error.response ? error.response.data : error.message);
  }
};

// Función para enviar mensajes con imagen
const sendImageMessage = async (to, imageUrl, caption) => {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v20.0/${PHONE_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'image',
        image: {
          link: imageUrl,
          caption: caption
        }
      },
      {
        headers: {
          Authorization: `Bearer ${GRAPH_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Image message sent:', response.data);
  } catch (error) {
    console.error('Error sending image message:', error.response ? error.response.data : error.message);
  }
};

// Función para procesar mensajes entrantes
const processIncomingMessage = (msg) => {
  const content = msg.text.body.toUpperCase();
  const chatId = msg.from;

  if (content.startsWith('CODIGO')) {
    const codigos = content.split(' ').slice(1);
    const respuestas = codigos.map(codigo => {
      const producto = productos.find(p => p.CODIGO === codigo);
      if (producto) {
        const infoProducto = `
                    Descripción: ${producto.DESCRIPCION}
                    Marca: ${producto.MARCA}
                    Talla: ${producto.TALLA}
                    Color: ${producto.COLOR}
                    Precio Sugerido: ${producto["Precio Sugerido"]}
                    Ubicación: ${producto.Ubicacion}
                    Vendido: ${producto["Vendido?"]}
                    Apartado: ${producto["Apartado?"]}
                `;
        return { codigo, infoProducto, imageUrl: producto.IMAGE_URL };
      } else {
        return { codigo, infoProducto: 'Producto no encontrado', imageUrl: null };
      }
    });

    respuestas.forEach(({ codigo, infoProducto, imageUrl }) => {
      sendMessage(chatId, `Código: ${codigo}\n${infoProducto}`);
      if (imageUrl) {
        sendImageMessage(chatId, imageUrl, `Código: ${codigo}`);
      }
    });
  } else {
    sendMessage(chatId, 'Por favor, ingrese un código válido.');
  }
};

// Ejemplo de mensaje entrante (esto debe ser reemplazado con un webhook en producción)
const exampleIncomingMessage = {
  text: { body: 'CODIGO 1234 5678' },
  from: 'whatsapp:+1777484848'
};

processIncomingMessage(exampleIncomingMessage);

