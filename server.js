const express = require("express");
const axios = require("axios");
const { decode } = require("html-entities");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.post("/api/consultar", async (req, res) => {
  const { claveAcceso } = req.body;

  if (!claveAcceso) {
    return res.status(400).json({ error: "La clave de acceso es requerida" });
  }

  const url =
    "https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline";

  const xmlBody = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.autorizacion">
      <soapenv:Header/>
      <soapenv:Body>
        <ec:autorizacionComprobante>
          <claveAccesoComprobante>${claveAcceso}</claveAccesoComprobante>
        </ec:autorizacionComprobante>
      </soapenv:Body>
    </soapenv:Envelope>
  `;

  try {
    const response = await axios.post(url, xmlBody, {
      headers: {
        "Content-Type": "text/xml; charset=UTF-8",
        "SOAPAction": "",
      },
    });

    const decodedXml = decode(response.data);
    const match = decodedXml.match(/<comprobante>(.*?)<\/comprobante>/s);

    if (match && match[1]) {
      const extractedXml = match[1].trim();

      // Enviar el archivo directamente al frontend
      res.setHeader("Content-Disposition", `attachment; filename=${claveAcceso}.xml`);
      res.setHeader("Content-Type", "application/xml");
      return res.send(extractedXml);
    } else {
      return res.status(404).json({ error: "No se encontró el comprobante" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({ error: "Error al consultar el Web Service" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
