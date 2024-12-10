export const emailTemplate = ({
    title,
    body,
    footer,
}: {
    title: string;
    body: string;
    footer: string;
}): string => `
    <!DOCTYPE html>
    <html>
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    background-color: #f9f9f9;
                    padding: 20px;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background: #ffffff;
                    border-radius: 10px;
                    padding: 20px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
                .header {
                    text-align: center;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 10px;
                    margin-bottom: 20px;
                }
                .header h1 {
                    color: #4CAF50;
                }
                .footer {
                    font-size: 14px;
                    color: #999;
                    text-align: center;
                    margin-top: 20px;
                }
                .footer a {
                    color: #4CAF50;
                    text-decoration: none;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>${title}</h1>
                </div>
                <div class="body">
                    ${body}
                </div>
                <div class="footer">
                    ${footer}
                </div>
            </div>
        </body>
    </html>
`;
