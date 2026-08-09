import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ message: "Webhook funcionando!" });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: 'chave.json',
      scopes: ['https://www.googleapis.com/auth/drive']
    });

    const drive = google.drive({ version: 'v3', auth });
    const FOLDER_ID = '1-AX9CS8Fgp8_eSr21LBsJ3JtL6fSwsPK';

    const emailComprador = req.body.customer?.email;

    await drive.permissions.create({
      fileId: FOLDER_ID,
      requestBody: {
        role: 'reader',
        type: 'user',
        emailAddress: emailComprador
      }
    });

    res.status(200).send('Acesso liberado!');
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao liberar acesso');
  }
}
