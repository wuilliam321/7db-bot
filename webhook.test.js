// archivo: tests/processIncomingMessage.test.js
var axios = require("axios");
const { processIncomingMessage } = require("./processIncommingMessage");

jest.mock("axios");

const productos = [
  { CODIGO: "ABC123", Vendido: "SI", Apartado: "NO", "Precio Sugerido": "$25", DESCRIPCION: "desc", MARCA: "M", TALLA: "S", COLOR: "R", Ubicacion: "R", IMAGEN: "I" },
  { CODIGO: "DEF456", Vendido: "SI", Apartado: "NO", "Precio Sugerido": "$25", DESCRIPCION: "desc", MARCA: "M", TALLA: "S", COLOR: "R", Ubicacion: "R", IMAGEN: "I" },
];

describe("processIncomingMessage", () => {
  it("should return true for a valid message", async () => {
    const message = {
      text: {
        body: "DEF456",
      },
      from: "1234567890",
    };

    axios.post.mockResolvedValueOnce({ data: {} });
    const result = await processIncomingMessage(message, productos);
    expect(result).toBe(true);

  });

  it("should return false for an invalid message", async () => {
    const message = {
      text: {
        body: "INVALID MESSAGE",
      },
      from: "1234567890",
    };
    const productos = [
      { CODIGO: "ABC123" },
      { CODIGO: "DEF456" },
    ];

    axios.post.mockResolvedValueOnce({ data: {} });
    const result = await processIncomingMessage(message, productos);
    expect(result).toBe(true);

  });

  it("should return false for a message with no text", async () => {
    const message = {
      from: "1234567890",
    };
    const productos = [
      { CODIGO: "ABC123" },
      { CODIGO: "DEF456" },
    ];

    axios.post.mockResolvedValueOnce({ data: {} });
    const result = await processIncomingMessage(message, productos);
    expect(result).toBe(false);

  });

  it("should return false for a message with empty text", async () => {
    const message = {
      text: {
        body: "",
      },
      from: "1234567890",
    };
    const productos = [
      { CODIGO: "ABC123" },
      { CODIGO: "DEF456" },
    ];

    axios.post.mockResolvedValueOnce({ data: {} });
    const result = await processIncomingMessage(message, productos);
    expect(result).toBe(false);

  });

  // it("should return false for a message with no products", async () => {
  //   const message = {
  //     text: {
  //       body: "PAGOMOVIL",
  //     },
  //     from: "1234567890",
  //   };
  //   const productos = [];

  //   axios.post.mockResolvedValueOnce({ data: {} });
  //   const result = await processIncomingMessage(message, productos);
  //   expect(result).toBe(false);

  // });

  // it("should return false for a message with no products match", async () => {
  //   const message = {
  //     text: {
  //       body: "PAGOMOVIL",
  //     },
  //     from: "1234567890",
  //   };
  //   const productos = [
  //     { CODIGO: "ABC123" },
  //     { CODIGO: "DEF456" },
  //   ];

  //   axios.post.mockResolvedValueOnce({ data: {} });
  //   const result = await processIncomingMessage(message, productos);
  //   expect(result).toBe(false);

  // });

});
