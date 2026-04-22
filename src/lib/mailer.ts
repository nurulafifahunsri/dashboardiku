import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import path from 'node:path';
import fs from 'node:fs/promises';

const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';

const FROM_NAME = process.env.MAIL_FROM_NAME || 'Dashboard IKU Fasilkom';
const FROM_EMAIL = process.env.MAIL_FROM_EMAIL || 'no-reply@fasilkom.local';

export const isMailerConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

const loadTemplate = async (templateName: string, context: Record<string, unknown>) => {
  const filePath = path.join(process.cwd(), 'src', 'templates', 'emails', `${templateName}.hbs`);
  const source = await fs.readFile(filePath, 'utf-8');
  const template = Handlebars.compile(source);
  return template(context);
};

export const sendTemplateEmail = async ({
  to,
  subject,
  template,
  context,
}: {
  to: string;
  subject: string;
  template: string;
  context: Record<string, unknown>;
}) => {
  if (!isMailerConfigured) {
    throw new Error('Konfigurasi SMTP belum lengkap di environment.');
  }

  const html = await loadTemplate(template, context);

  await transporter.sendMail({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to,
    subject,
    html,
  });
};
