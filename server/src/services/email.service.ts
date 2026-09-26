import { mailTransport, EMAIL_FROM, EMAIL_ENABLED } from '../config/email.js';
import { EmailLog, type EmailTemplate } from '../models/EmailLog.model.js';
import { logger } from '../utils/logger.js';

import { renderOtp, type OtpData } from '../email/templates/otp.js';
import {
  renderInvitation,
  type InvitationData,
} from '../email/templates/invitation.js';
import {
  renderPasswordReset,
  type PasswordResetData,
} from '../email/templates/passwordReset.js';
import {
  renderAnnouncement,
  type AnnouncementData,
} from '../email/templates/announcement.js';
import { renderDigest, type DigestData } from '../email/templates/digest.js';
import {
  renderNotification,
  type NotificationEmailData,
} from '../email/templates/notification.js';

// ─── Public types ────────────────────────────────────────────────

export interface SendInput {
  to: string;
  template: EmailTemplate;
  /** Template-specific data. Type is checked by `renderTemplate`. */
  data: unknown;
  /** Optional reference back to the triggering entity. */
  refModel?: string;
  refId?: string;
}

export interface EnqueueInput {
  recipients: string[];
  template: EmailTemplate;
  data: unknown;
  refModel?: string;
  refId?: string;
}

// ─── Public API ──────────────────────────────────────────────────

export const emailService = {
  async send(input: SendInput): Promise<{ ok: boolean; logId: string }> {
    const { subject, html } = renderTemplate(input.template, input.data);

    if (!EMAIL_ENABLED || !mailTransport) {
      logger.info('Email skipped (SMTP disabled)', {
        to: input.to,
        template: input.template,
        subject,
      });
      const log = await EmailLog.create({
        to: input.to,
        template: input.template,
        subject,
        renderedHtml: html,
        status: 'sent',
        attempts: 0,
        providerMessageId: 'dev-skip',
        refModel: input.refModel,
        refId: input.refId,
      });
      return { ok: true, logId: log._id.toString() };
    }

    const log = await EmailLog.create({
      to: input.to,
      template: input.template,
      subject,
      renderedHtml: html,
      status: 'queued',
      attempts: 0,
      refModel: input.refModel,
      refId: input.refId,
    });

    return attemptSend({
      logId: log._id.toString(),
      to: input.to,
      subject,
      html,
    });
  },

  async enqueue(input: EnqueueInput): Promise<{ queued: number }> {
    const { subject, html } = renderTemplate(input.template, input.data);

    const now = new Date();
    const docs = input.recipients.map((to) => ({
      to,
      template: input.template,
      subject,
      renderedHtml: html,
      status: 'queued' as const,
      attempts: 0,
      refModel: input.refModel,
      refId: input.refId,
      nextAttemptAt: now,
    }));

    if (docs.length === 0) return { queued: 0 };

    await EmailLog.insertMany(docs);

    if (!EMAIL_ENABLED || !mailTransport) {
      logger.info('Bulk email queued (SMTP disabled - will be skipped)', {
        count: docs.length,
        template: input.template,
      });
    } else {
      logger.info('Bulk email queued', {
        count: docs.length,
        template: input.template,
      });
    }

    return { queued: docs.length };
  },

  async processQueue(
    batchSize = 20,
    delayMs = 1500
  ): Promise<{ sent: number; failed: number }> {
    if (!EMAIL_ENABLED || !mailTransport) {
      return { sent: 0, failed: 0 };
    }

    const now = new Date();
    const jobs = await EmailLog.find({
      status: 'queued',
      nextAttemptAt: { $lte: now },
    })
      .select('+renderedHtml')
      .limit(batchSize);

    let sent = 0;
    let failed = 0;

    for (const job of jobs) {
      if (job.status !== 'queued') continue;

      const html = job.renderedHtml ?? '<p>(empty)</p>';

      const result = await attemptSend({
        logId: job._id.toString(),
        to: job.to,
        subject: job.subject,
        html,
      });

      if (result.ok) sent++;
      else failed++;

      await new Promise((r) => setTimeout(r, delayMs));
    }

    return { sent, failed };
  },

  async retry(logId: string): Promise<{ ok: boolean }> {
    const log = await EmailLog.findById(logId).select('+renderedHtml');
    if (!log) return { ok: false };
    if (log.status === 'sent') return { ok: true };

    const html = log.renderedHtml ?? '<p>(empty)</p>';
    const result = await attemptSend({
      logId: log._id.toString(),
      to: log.to,
      subject: log.subject,
      html,
    });
    return { ok: result.ok };
  },
};

// ─── Internals ────────────────────────────────────────────────────

interface AttemptInput {
  logId: string;
  to: string;
  subject: string;
  html: string;
}

async function attemptSend(
  input: AttemptInput
): Promise<{ ok: boolean; logId: string }> {
  try {
    const info = await mailTransport!.sendMail({
      from: EMAIL_FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });

    await EmailLog.updateOne(
      { _id: input.logId },
      {
        $set: {
          status: 'sent',
          providerMessageId: info.messageId,
        },
        $inc: { attempts: 1 },
        $unset: { lastError: '', nextAttemptAt: '' },
      }
    );

    return { ok: true, logId: input.logId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn('Email send failed', {
      to: input.to,
      error: message,
    });

    const current = await EmailLog.findById(input.logId).lean();
    const nextAttempts = (current?.attempts ?? 0) + 1;
    const retryable = nextAttempts < 3;

    await EmailLog.updateOne(
      { _id: input.logId },
      {
        $set: {
          status: retryable ? 'queued' : 'failed',
          lastError: message,
          ...(retryable
            ? { nextAttemptAt: new Date(Date.now() + 60_000 * nextAttempts) }
            : {}),
        },
        $inc: { attempts: 1 },
      }
    );

    return { ok: false, logId: input.logId };
  }
}

function renderTemplate(
  template: EmailTemplate,
  data: unknown
): { subject: string; html: string } {
  switch (template) {
    case 'otp':
      return renderOtp(data as OtpData);
    case 'invitation':
      return renderInvitation(data as InvitationData);
    case 'password-reset':
      return renderPasswordReset(data as PasswordResetData);
    case 'announcement':
      return renderAnnouncement(data as AnnouncementData);
    case 'digest':
      return renderDigest(data as DigestData);
    case 'notification':
      return renderNotification(data as NotificationEmailData);
  }
}