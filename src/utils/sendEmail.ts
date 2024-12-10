import nodemailer from "nodemailer";

const sendEmail = async (to: string, subject: string, text: string, html: string) => {
    try {
        const isSecure = Number(process.env.SMTP_PORT) === 465; // Secure if using port 465
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: isSecure,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // Create email options
        const mailOptions: nodemailer.SendMailOptions = {
            from: `"LADX Support" <${process.env.SMTP_USER}>`,
            to,
            subject,
            text, // Plain text version
            html, // HTML version
        };

        await transporter.sendMail(mailOptions);

        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error(`Error sending email: ${error instanceof Error ? error.message : error}`);
    }
};

export default sendEmail;
