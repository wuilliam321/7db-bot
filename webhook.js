var express = require("express");
const fs = require("fs");
const csv = require("csv-parser");
const { processIncomingMessage } = require("./processIncommingMessage");

const products = [];

const app = express();
app.use(express.json());

const { WEBHOOK_VERIFY_TOKEN, PORT } = process.env;

// Leer datos del CSV
fs.createReadStream("productos.csv")
  .pipe(csv())
  .on("data", (row) => {
    products.push(row);
  })
  .on("end", () => {
    console.log("CSV file successfully processed");
  });

app.post("/webhook", async (req, res) => {
  const entry = req.body.entry[0];
  const changes = entry.changes[0];
  const value = changes.value;
  const message = value.messages && value.messages[0];

  if (message) {
    await processIncomingMessage(message, products);
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
