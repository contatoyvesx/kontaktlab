import { google } from "googleapis";

const FOLDER_ID = "1-AX9CS8Fgp8_eSr21LBsJ3JtL6fSwsPK";

export default async function handler(req, res) {
  // Teste pelo navegador
  if (req.method === "GET") {
    return res.status(200).json({
      status: "online",
      message: "Webhook Kontakt Lab funcionando!"
    });
  }

  // Kiwify envia POST
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método não permitido"
    });
  }

  try {
    const { GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY } = process.env;

    if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
      console.error("Variáveis do Google não configuradas.");
      
      return res.status(500).json({
        error: "Credenciais do Google não configuradas na Vercel."
      });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: GOOGLE_CLIENT_EMAIL,
        private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n")
      },
      scopes: ["https://www.googleapis.com/auth/drive"]
    });

    const drive = google.drive({
      version: "v3",
      auth
    });

    const pedido = req.body;

    console.log("Webhook recebido:", JSON.stringify(pedido));

    // Kiwify usa Customer com C maiúsculo
    const emailComprador = pedido.Customer?.email;

    // Só libera acesso quando o pagamento estiver aprovado
    if (pedido.order_status !== "paid") {
      console.log(
        `Evento ignorado. Status: ${pedido.order_status}`
      );

      return res.status(200).json({
        message: "Evento recebido, mas não é uma compra aprovada."
      });
    }

    if (!emailComprador) {
      console.error("E-mail do comprador não encontrado.");

      return res.status(400).json({
        error: "E-mail do comprador não encontrado."
      });
    }

    console.log(
      `Liberando acesso para: ${emailComprador}`
    );

    // Libera acesso à pasta KONTAKT LAB
    await drive.permissions.create({
      fileId: FOLDER_ID,
      requestBody: {
        role: "reader",
        type: "user",
        emailAddress: emailComprador
      },
      sendNotificationEmail: true
    });

    console.log(
      `Acesso liberado com sucesso para ${emailComprador}`
    );

    return res.status(200).json({
      success: true,
      message: "Acesso liberado com sucesso!",
      email: emailComprador
    });

  } catch (error) {
    console.error(
      "Erro ao liberar acesso:",
      error.response?.data || error.message || error
    );

    return res.status(500).json({
      success: false,
      error: "Erro ao liberar acesso."
    });
  }
}
