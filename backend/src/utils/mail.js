import nodemailer from "nodemailer";

export const sendMail = async (options) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail", // Usas Gmail como servicio
      auth: {
        user: process.env.EMAIL_USER, // Tu email
        pass: process.env.EMAIL_PASS, // Contraseña de aplicación
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER, // Desde tu correo
      to: options.to, // Correo del destinatario
      subject: options.subject, // Asunto
      text: options.text, // Contenido del mensaje
      html: options.html || null, // Opcional: contenido HTML
    };

    const info = await transporter.sendMail(mailOptions);
    //console.log("Correo enviado:", info.response);
  } catch (error) {
    console.error("Error enviando correo:", error);
    throw error;
  }
};
