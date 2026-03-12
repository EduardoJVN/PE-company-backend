export function buildCompanyInviteEmail(inviteUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invitación a empresa</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="background-color:#18181b;padding:32px 40px;">
              <p style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">Plataforma Emprendedores</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#18181b;">
                Te invitaron a unirte a una empresa
              </h1>
              <p style="margin:0 0 32px;font-size:16px;color:#52525b;line-height:1.6;">
                Alguien te invitó a colaborar en su empresa dentro de la plataforma.
                Hacé clic en el botón para aceptar la invitación y completar tu registro.
              </p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#18181b;border-radius:6px;">
                    <a href="${inviteUrl}"
                       style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
                      Aceptar invitación
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:32px 0 0;font-size:13px;color:#a1a1aa;">
                Este enlace expira en 7 días. Si no esperabas esta invitación, podés ignorar este correo.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
