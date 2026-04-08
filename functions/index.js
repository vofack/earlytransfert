const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Imap = require("imap");
const { simpleParser } = require("mailparser");
const cors = require("cors")({ origin: true });

admin.initializeApp();
const db = admin.firestore();

/**
 * IMAP email credentials — works with ANY email provider.
 *
 * Set via Firebase environment config:
 *   firebase functions:config:set email.user="you@example.com" email.password="your-password" email.host="imap.example.com" email.port="993"
 *
 * Common IMAP settings:
 * ┌──────────────────────┬─────────────────────────┬──────┐
 * │ Provider             │ IMAP Host               │ Port │
 * ├──────────────────────┼─────────────────────────┼──────┤
 * │ Gmail                │ imap.gmail.com          │ 993  │
 * │ Outlook / Hotmail    │ outlook.office365.com   │ 993  │
 * │ Yahoo                │ imap.mail.yahoo.com     │ 993  │
 * │ OVH                  │ ssl0.ovh.net            │ 993  │
 * │ GoDaddy              │ imap.secureserver.net   │ 993  │
 * │ Zoho                 │ imap.zoho.com           │ 993  │
 * └──────────────────────┴─────────────────────────┴──────┘
 *
 * For Gmail: enable "Less secure apps" OR use an App Password
 *   (Google Account → Security → 2-Step Verification → App passwords)
 *
 * For professional email: use your regular IMAP credentials from your host.
 */

function getImapConfig() {
  const { defineString } = require('firebase-functions/params');
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;
  const emailHost = process.env.EMAIL_HOST;
  const emailPort = process.env.EMAIL_PORT;


  if (!emailUser || !emailPassword || !emailHost) {
    throw new Error(
      "Email config not set. Run:\n" +
      'firebase functions:config:set email.user="you@domain.com" email.password="your-password" email.host="imap.example.com" email.port="993"'
    );
  }
 

  return {
    user: emailUser,
    password: emailPassword,
    host: emailHost,
    port: parseInt(emailPort || "993", 10),
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
    authTimeout: 10000,
    connTimeout: 15000,
  };
}

/**
 * Extracts dollar amount from subject or body text.
 * Checks subject first, then falls back to body.
 * e.g. "INTERAC e-Transfer: John sent you $150.00" → "$150.00"
 */
function extractAmount(subject, body) {
  const regex = /\$[\d,]+\.?\d*/;
  const subjectMatch = (subject || "").match(regex);
  if (subjectMatch) return subjectMatch[0];
  const bodyMatch = (body || "").match(regex);
  return bodyMatch ? bodyMatch[0] : "";
}

/**
 * Connects to IMAP and fetches emails with "interac" in the subject
 * from the last N days.
 */
function fetchInteracEmails(days) {
  return new Promise((resolve, reject) => {
    const imapConfig = getImapConfig();
    const imap = new Imap(imapConfig);
    const emails = [];

    imap.once("ready", () => {
      imap.openBox("INBOX", true, (err) => {
        if (err) {
          imap.end();
          return reject(err);
        }

        // Build search date (N days ago)
        const since = new Date();
        since.setDate(since.getDate() - days);
        const sinceStr = since.toISOString().split("T")[0]; // YYYY-MM-DD

        // IMAP SEARCH: emails since date with "interac" in subject
        const searchCriteria = [
          ["SINCE", sinceStr],
          ["SUBJECT", "interac"],
        ];

        imap.search(searchCriteria, (err, uids) => {
          if (err) {
            imap.end();
            return reject(err);
          }

          if (!uids || uids.length === 0) {
            imap.end();
            return resolve([]);
          }

          // Limit to most recent 50
          const toFetch = uids.slice(-50);

          const fetch = imap.fetch(toFetch, {
            bodies: "",
            struct: true,
          });

          fetch.on("message", (msg, seqno) => {
            let rawBuffer = [];

            msg.on("body", (stream) => {
              stream.on("data", (chunk) => rawBuffer.push(chunk));
            });

            msg.on("attributes", (attrs) => {
              // Store UID as our unique identifier
              rawBuffer.uid = attrs.uid;
            });

            msg.once("end", () => {
              const raw = Buffer.concat(rawBuffer);
              raw.uid = rawBuffer.uid;
              emails.push(raw);
            });
          });

          fetch.once("error", (err) => {
            imap.end();
            reject(err);
          });

          fetch.once("end", () => {
            imap.end();
          });
        });
      });
    });

    imap.once("error", (err) => {
      reject(err);
    });

    imap.once("end", async () => {
      // Parse all collected raw emails
      const parsed = [];
      for (const raw of emails) {
        try {
          const mail = await simpleParser(raw);
          const bodyText = (mail.text || "").substring(0, 2000).trim();
          parsed.push({
            uid: raw.uid,
            from: mail.from?.value?.[0]?.address || "",
            senderName: mail.from?.value?.[0]?.name || "",
            subject: mail.subject || "",
            snippet: bodyText.substring(0, 200).replace(/\n/g, " "),
            body: bodyText,
            date: mail.date ? mail.date.toISOString() : new Date().toISOString(),
            messageId: mail.messageId || `uid-${raw.uid}`,
          });
        } catch (parseErr) {
          console.warn("Failed to parse email:", parseErr.message);
        }
      }
      resolve(parsed);
    });

    imap.connect();
  });
}

/**
 * HTTP Cloud Function: checks mailbox for Interac-related emails
 * and stores new ones in the interac_emails Firestore collection.
 * Works with Gmail, Outlook, professional email — any IMAP provider.
 * const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;
  const emailHost = process.env.EMAIL_HOST;
  const emailPort = process.env.EMAIL_PORT;
 */
exports.checkInteracEmails = functions
  .runWith({ timeoutSeconds: 60, memory: "256MB", secrets: ["EMAIL_USER", "EMAIL_PASSWORD", "EMAIL_HOST", "EMAIL_PORT"] })
  .https.onRequest((req, res) => {
    cors(req, res, async () => {
      try {
        const emails = await fetchInteracEmails(7);
        let newCount = 0;

        for (const email of emails) {
          // Use messageId as dedup key
          const existing = await db
            .collection("interac_emails")
            .where("messageId", "==", email.messageId)
            .limit(1)
            .get();

          if (!existing.empty) continue;

          await db.collection("interac_emails").add({
            messageId: email.messageId,
            from: email.from,
            senderName: email.senderName,
            subject: email.subject,
            snippet: email.snippet,
            body: email.body || "",
            date: email.date,
            amount: extractAmount(email.subject, email.body),
            status: "new",
          });
          newCount++;
        }

        res.json({ success: true, totalChecked: emails.length, newCount });
      } catch (error) {
        console.error("checkInteracEmails error:", error);
        res.status(500).json({ success: false, error: error.message });
      }
    });
  });

/**
 * Scheduled Cloud Function: runs every 10 minutes to check for new Interac emails.
 */
exports.scheduledInteracCheck = functions
.runWith({ secrets: ["EMAIL_USER", "EMAIL_PASSWORD", "EMAIL_HOST", "EMAIL_PORT"] })
.pubsub.schedule("every 10 minutes")
  .onRun(async () => {
    try {
      const emails = await fetchInteracEmails(1);

      for (const email of emails) {
        const existing = await db
          .collection("interac_emails")
          .where("messageId", "==", email.messageId)
          .limit(1)
          .get();

        if (!existing.empty) continue;

        await db.collection("interac_emails").add({
          messageId: email.messageId,
          from: email.from,
          senderName: email.senderName,
          subject: email.subject,
          snippet: email.snippet,
          body: email.body || "",
          date: email.date,
          amount: extractAmount(email.subject, email.body),
          status: "new",
        });
      }

      console.log(`Scheduled check complete: ${emails.length} emails scanned`);
      return null;
    } catch (error) {
      console.error("scheduledInteracCheck error:", error);
      return null;
    }
  });
