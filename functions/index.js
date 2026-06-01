const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Imap = require("imap");
const { simpleParser } = require("mailparser");
const cors = require("cors")({ origin: true });
const crypto = require("crypto");

const INTERAC_ALIAS_DOMAIN = "earlytransfert.com";

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
 * │ IONOS                │ imap.ionos.com          │ 993  │
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
 * Extracts a dollar amount from subject or body text.
 * Handles both English ("$150.00", "$1,000.00") and French-Canadian
 * ("70,00 $", "1 250,00 $") formats. Subject is checked first, then body.
 *   "INTERAC e-Transfer: John sent you $150.00" → "$150.00"
 *   "Virement Interac : Vous avez reçu 70,00 $ de …" → "70,00 $"
 */
function extractAmount(subject, body) {
  const regex = /\$\s*\d{1,3}(?:[,\s]\d{3})*(?:[.,]\d{1,2})?|\d{1,3}(?:[\s.,]\d{3})*(?:[.,]\d{1,2})?\s*\$/;
  const subjectMatch = (subject || "").match(regex);
  if (subjectMatch) return subjectMatch[0].trim();
  const bodyMatch = (body || "").match(regex);
  return bodyMatch ? bodyMatch[0].trim() : "";
}

// Words that look like names but aren't the client (Interac/banque branding,
// generic greetings). Compared case-insensitively against the extracted match.
const SENDER_NAME_BLOCKLIST = new Set([
  "interac", "interac e-transfer", "interac e-transfert",
  "virement interac", "e-transfer", "e-transfert",
  "money", "argent", "funds", "fonds",
]);

// Email domains we never want to treat as the customer's address.
const SENDER_EMAIL_DOMAIN_BLOCKLIST = [
  "payments.interac.ca",
  "notify.interac.ca",
  "interac.ca",
  "earlytransfert.com",
];

function isBlockedSenderEmail(addr) {
  const lower = (addr || "").toLowerCase();
  if (!lower) return true;
  return SENDER_EMAIL_DOMAIN_BLOCKLIST.some((d) => lower.endsWith("@" + d) || lower.endsWith("." + d));
}

/**
 * Extracts the customer's full name and (when available) email from an Interac
 * notification. The FROM header is always Interac/the bank — the real sender
 * is embedded in the body, sometimes mirrored in Reply-To.
 *
 * Returns { senderFullName, senderEmailFromBody } (empty strings when not found).
 */
function parseInteracSender(subject, body, replyTo) {
  const text = `${subject || ""}\n${body || ""}`;

  // Bilingual patterns. Capitalized 2+ word names adjacent to known anchor
  // phrases. \p{L} accepts French accented letters (é, à, ç, etc.).
  const namePatterns = [
    /([A-ZÀ-Ý][\p{L}'\-]+(?:\s+[A-ZÀ-Ý][\p{L}'\-]+)+)\s+sent you/u,
    /from\s+([A-ZÀ-Ý][\p{L}'\-]+(?:\s+[A-ZÀ-Ý][\p{L}'\-]+)+)/u,
    /([A-ZÀ-Ý][\p{L}'\-]+(?:\s+[A-ZÀ-Ý][\p{L}'\-]+)+)\s+vous a envoyé/u,
    /(?:de la part de|de)\s+([A-ZÀ-Ý][\p{L}'\-]+(?:\s+[A-ZÀ-Ý][\p{L}'\-]+)+)/u,
  ];

  let senderFullName = "";
  for (const pat of namePatterns) {
    const m = text.match(pat);
    if (m && m[1]) {
      const candidate = m[1].trim();
      if (!SENDER_NAME_BLOCKLIST.has(candidate.toLowerCase())) {
        senderFullName = candidate;
        break;
      }
    }
  }

  // Email: Reply-To takes priority, then scan body for the first non-blocked address.
  let senderEmailFromBody = "";
  if (replyTo && !isBlockedSenderEmail(replyTo)) {
    senderEmailFromBody = replyTo.toLowerCase().trim();
  } else {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = (body || "").match(emailRegex) || [];
    for (const candidate of matches) {
      if (!isBlockedSenderEmail(candidate)) {
        senderEmailFromBody = candidate.toLowerCase().trim();
        break;
      }
    }
  }

  return { senderFullName, senderEmailFromBody };
}

/**
 * Extracts the Interac reference number from the body. Bilingual: tries the
 * labelled form ("Reference Number: …" / "Numéro de référence : …") first,
 * then falls back to the standard Interac CAxxxxxxxx pattern.
 * Returns "" when not found.
 */
function extractInteracReference(body) {
  const text = body || "";
  const labelled = text.match(
    /(?:Reference\s*(?:Number|#|No\.?)|Num[ée]ro\s+de\s+r[ée]f[ée]rence)\s*[:\-]?\s*([A-Z0-9]{6,20})/i
  );
  if (labelled && labelled[1]) return labelled[1].toUpperCase().trim();
  const fallback = text.match(/\b(CA[A-Z0-9]{6,18})\b/);
  return fallback ? fallback[1].toUpperCase().trim() : "";
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

    console.log("IMAP connecting to", imapConfig.host, "port", imapConfig.port, "user", imapConfig.user);

    imap.once("ready", () => {
      console.log("IMAP connection ready, opening INBOX...");
      imap.openBox("INBOX", true, (err, box) => {
        if (err) {
          console.error("openBox error:", err.message);
          imap.end();
          return reject(err);
        }

        console.log("INBOX opened, total messages:", box.messages.total);

        // Build search date (N days ago)
        const since = new Date();
        since.setDate(since.getDate() - days);

        // IMAP SEARCH: emails since date with "interac" in subject
        const searchCriteria = [
          ["SINCE", since],
          ["SUBJECT", "interac"],
        ];

        console.log("Searching with criteria:", JSON.stringify(searchCriteria));

        imap.search(searchCriteria, (err, uids) => {
          if (err) {
            console.error("IMAP search error:", err.message);
            imap.end();
            return reject(err);
          }

          console.log("Search returned", uids ? uids.length : 0, "UIDs");

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
              rawBuffer.uid = attrs.uid;
            });

            msg.once("end", () => {
              const raw = Buffer.concat(rawBuffer);
              raw.uid = rawBuffer.uid;
              emails.push(raw);
            });
          });

          fetch.once("error", (err) => {
            console.error("Fetch error:", err.message);
            imap.end();
            reject(err);
          });

          fetch.once("end", async () => {
            console.log("Fetch complete,", emails.length, "emails collected");
            imap.end();

            // Parse emails right here instead of waiting for imap "end" event
            const parsed = [];
            for (const raw of emails) {
              try {
                const mail = await simpleParser(raw);
                const bodyText = (mail.text || "").substring(0, 2000).trim();
                const replyTo = mail.replyTo?.value?.[0]?.address || "";
                const { senderFullName, senderEmailFromBody } = parseInteracSender(
                  mail.subject || "",
                  bodyText,
                  replyTo
                );
                const referenceNumber = extractInteracReference(bodyText);
                const toAddress = (mail.to?.value?.[0]?.address || "").toLowerCase().trim();
                const receivedAlias = toAddress ? toAddress.split("@")[0] : "";
                parsed.push({
                  uid: raw.uid,
                  from: mail.from?.value?.[0]?.address || "",
                  senderName: mail.from?.value?.[0]?.name || "",
                  subject: mail.subject || "",
                  snippet: bodyText.substring(0, 200).replace(/\n/g, " "),
                  body: bodyText,
                  date: mail.date ? mail.date.toISOString() : new Date().toISOString(),
                  messageId: mail.messageId || `uid-${raw.uid}`,
                  senderFullName,
                  senderEmailFromBody,
                  referenceNumber,
                  receivedAlias,
                  toAddress,
                });
              } catch (parseErr) {
                console.warn("Failed to parse email:", parseErr.message);
              }
            }
            console.log("Parsed", parsed.length, "emails successfully");
            resolve(parsed);
          });
        });
      });
    });

    imap.once("error", (err) => {
      console.error("IMAP connection error:", err.message);
      reject(err);
    });

    imap.once("end", () => {
      console.log("IMAP connection closed");
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
          // Dedup by messageId (always) and by Interac referenceNumber when
          // available — the same transfer forwarded as a new email has a
          // different messageId but the same referenceNumber.
          const existing = await db
            .collection("interac_emails")
            .where("messageId", "==", email.messageId)
            .limit(1)
            .get();

          if (!existing.empty) continue;

          if (email.referenceNumber) {
            const existingByRef = await db
              .collection("interac_emails")
              .where("referenceNumber", "==", email.referenceNumber)
              .limit(1)
              .get();
            if (!existingByRef.empty) continue;
          }

          await db.collection("interac_emails").add({
            messageId: email.messageId,
            from: email.from,
            senderName: email.senderName,
            senderFullName: email.senderFullName || "",
            senderEmailFromBody: email.senderEmailFromBody || "",
            referenceNumber: email.referenceNumber || "",
            receivedAlias: email.receivedAlias || "",
            toAddress: email.toAddress || "",
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
 * HTTP Cloud Function: sends FCM push notifications.
 * Supports sending to a specific user (by email) or all users.
 *
 * Body params:
 *   - title: string (notification title)
 *   - body: string (notification body)
 *   - targetEmail: string (user email, or empty/"all" to send to all users)
 */
exports.sendNotification = functions
  .runWith({ timeoutSeconds: 60, memory: "256MB" })
  .https.onRequest((req, res) => {
    cors(req, res, async () => {
      if (req.method !== "POST") {
        return res.status(405).json({ success: false, error: "Method not allowed" });
      }

      const { title, body, targetEmail } = req.body;

      if (!title || !body) {
        return res.status(400).json({ success: false, error: "title and body are required" });
      }

      try {
        let tokens = [];
        let targetDesc = "";

        if (targetEmail && targetEmail !== "all") {
          // Send to a specific user
          const userSnap = await db
            .collection("users")
            .where("email", "==", targetEmail)
            .limit(1)
            .get();

          if (userSnap.empty) {
            return res.status(404).json({ success: false, error: "User not found" });
          }

          const userData = userSnap.docs[0].data();
          if (!userData.fcmToken) {
            return res.status(400).json({
              success: false,
              error: "User has no FCM token (app not installed or not logged in)",
            });
          }

          tokens.push(userData.fcmToken);
          targetDesc = targetEmail;
        } else {
          // Send to all users with FCM tokens
          const usersSnap = await db.collection("users").get();
          usersSnap.docs.forEach((doc) => {
            const data = doc.data();
            if (data.fcmToken) {
              tokens.push(data.fcmToken);
            }
          });
          targetDesc = "all";
        }

        if (tokens.length === 0) {
          return res.status(400).json({
            success: false,
            error: "No users with FCM tokens found",
          });
        }

        // Send the notification
        const message = {
          notification: { title, body },
          tokens: tokens,
        };

        const response = await admin.messaging().sendEachForMulticast(message);

        // Log the notification in Firestore
        await db.collection("notifications").add({
          title,
          body,
          targetEmail: targetEmail || "all",
          sentAt: new Date().toISOString(),
          successCount: response.successCount,
          failureCount: response.failureCount,
          totalTokens: tokens.length,
        });

        res.json({
          success: true,
          successCount: response.successCount,
          failureCount: response.failureCount,
        });
      } catch (error) {
        console.error("sendNotification error:", error);
        res.status(500).json({ success: false, error: error.message });
      }
    });
  });

/**
 * Scheduled Cloud Function: runs every 30 minutes to check for new Interac emails.
 */
exports.scheduledInteracCheck = functions
.runWith({ secrets: ["EMAIL_USER", "EMAIL_PASSWORD", "EMAIL_HOST", "EMAIL_PORT"] })
.pubsub.schedule("every 30 minutes")
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

        if (email.referenceNumber) {
          const existingByRef = await db
            .collection("interac_emails")
            .where("referenceNumber", "==", email.referenceNumber)
            .limit(1)
            .get();
          if (!existingByRef.empty) continue;
        }

        await db.collection("interac_emails").add({
          messageId: email.messageId,
          from: email.from,
          senderName: email.senderName,
          senderFullName: email.senderFullName || "",
          senderEmailFromBody: email.senderEmailFromBody || "",
          referenceNumber: email.referenceNumber || "",
          receivedAlias: email.receivedAlias || "",
          toAddress: email.toAddress || "",
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

/**
 * Generates a unique 8-char alphanumeric Interac alias for a wallet.
 * Retries up to 5 times on collision. Returns null if all retries collide.
 */
async function generateUniqueInteracAlias() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = crypto.randomBytes(5).toString("hex").substring(0, 8).toLowerCase();
    const existing = await db
      .collection("walletAccount")
      .where("interacAlias", "==", candidate)
      .limit(1)
      .get();
    if (existing.empty) return candidate;
  }
  return null;
}

/**
 * HTTP Cloud Function: assigns a unique Interac alias to a wallet.
 * Body params: { walletId: string }
 * Returns: { success, alias, fullAddress }
 */
exports.assignInteracAlias = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const walletId = req.body?.walletId || req.query?.walletId;
      if (!walletId) {
        return res.status(400).json({ success: false, error: "walletId is required" });
      }

      const walletRef = db.collection("walletAccount").doc(walletId);
      const walletSnap = await walletRef.get();
      if (!walletSnap.exists) {
        return res.status(404).json({ success: false, error: "Wallet not found" });
      }

      const existing = walletSnap.data().interacAlias;
      if (existing) {
        return res.json({
          success: true,
          alias: existing,
          fullAddress: `${existing}@${INTERAC_ALIAS_DOMAIN}`,
          alreadyAssigned: true,
        });
      }

      const alias = await generateUniqueInteracAlias();
      if (!alias) {
        return res.status(500).json({ success: false, error: "Could not generate unique alias after retries" });
      }

      await walletRef.update({ interacAlias: alias });
      res.json({
        success: true,
        alias,
        fullAddress: `${alias}@${INTERAC_ALIAS_DOMAIN}`,
      });
    } catch (error) {
      console.error("assignInteracAlias error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
});

/**
 * HTTP Cloud Function: backfills interacAlias on all CA wallets that don't
 * have one yet. Run once after deployment. Idempotent.
 */
exports.backfillInteracAliases = functions
  .runWith({ timeoutSeconds: 300, memory: "256MB" })
  .https.onRequest((req, res) => {
    cors(req, res, async () => {
      try {
        const snap = await db
          .collection("walletAccount")
          .where("countryCode", "==", "CA")
          .get();

        let assigned = 0;
        let skipped = 0;
        const failures = [];

        for (const doc of snap.docs) {
          if (doc.data().interacAlias) {
            skipped++;
            continue;
          }
          const alias = await generateUniqueInteracAlias();
          if (!alias) {
            failures.push(doc.id);
            continue;
          }
          await doc.ref.update({ interacAlias: alias });
          assigned++;
        }

        res.json({
          success: true,
          totalCA: snap.size,
          assigned,
          skipped,
          failures,
        });
      } catch (error) {
        console.error("backfillInteracAliases error:", error);
        res.status(500).json({ success: false, error: error.message });
      }
    });
  });

/**
 * Generates a unique short MoMo reference code (e.g. "ET7K2X") for a CM wallet.
 * Shorter than the Interac alias because customers type it on USSD/MoMo keypads.
 * Excludes visually ambiguous chars (O, 0, I, 1). Retries up to 5 times on
 * collision. Returns null if all retries collide.
 */
async function generateUniqueMomoCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 5; attempt++) {
    let candidate = "ET";
    for (let i = 0; i < 4; i++) {
      candidate += chars[Math.floor(Math.random() * chars.length)];
    }
    const existing = await db
      .collection("walletAccount")
      .where("momoCode", "==", candidate)
      .limit(1)
      .get();
    if (existing.empty) return candidate;
  }
  return null;
}

/**
 * HTTP Cloud Function: assigns a unique MoMo reference code to a CM wallet.
 * Body params: { walletId: string }
 * Returns: { success, code, alreadyAssigned? }
 */
exports.assignMomoCode = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const walletId = req.body?.walletId || req.query?.walletId;
      if (!walletId) {
        return res.status(400).json({ success: false, error: "walletId is required" });
      }

      const walletRef = db.collection("walletAccount").doc(walletId);
      const walletSnap = await walletRef.get();
      if (!walletSnap.exists) {
        return res.status(404).json({ success: false, error: "Wallet not found" });
      }

      const existing = walletSnap.data().momoCode;
      if (existing) {
        return res.json({ success: true, code: existing, alreadyAssigned: true });
      }

      const code = await generateUniqueMomoCode();
      if (!code) {
        return res.status(500).json({ success: false, error: "Could not generate unique code after retries" });
      }

      await walletRef.update({ momoCode: code });
      res.json({ success: true, code });
    } catch (error) {
      console.error("assignMomoCode error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
});

/**
 * HTTP Cloud Function: backfills momoCode on all CM wallets that don't have
 * one yet. Run once after deployment. Idempotent.
 */
exports.backfillMomoCodes = functions
  .runWith({ timeoutSeconds: 300, memory: "256MB" })
  .https.onRequest((req, res) => {
    cors(req, res, async () => {
      try {
        const snap = await db
          .collection("walletAccount")
          .where("countryCode", "==", "CM")
          .get();

        let assigned = 0;
        let skipped = 0;
        const failures = [];

        for (const doc of snap.docs) {
          if (doc.data().momoCode) {
            skipped++;
            continue;
          }
          const code = await generateUniqueMomoCode();
          if (!code) {
            failures.push(doc.id);
            continue;
          }
          await doc.ref.update({ momoCode: code });
          assigned++;
        }

        res.json({
          success: true,
          totalCM: snap.size,
          assigned,
          skipped,
          failures,
        });
      } catch (error) {
        console.error("backfillMomoCodes error:", error);
        res.status(500).json({ success: false, error: error.message });
      }
    });
  });

/**
 * HTTP Cloud Function: lets a Cameroun customer declare a Mobile Money
 * deposit they just made, so the admin can verify and credit their wallet.
 *
 * Body params:
 *   - walletId: string (required)
 *   - amount: number (required)
 *   - transactionId: string (required) — MoMo transaction reference shown in
 *     the SMS / app confirmation (e.g. "MP240526.1234.XXXXX" for MTN)
 *   - operator: 'MTN' | 'ORANGE' (required)
 *   - senderPhone: string (optional) — the number the customer sent from
 *   - note: string (optional)
 *
 * Creates a doc in `momo_deposits` with status='pending'. Dedup is per
 * (transactionId, walletId) so the same transaction can't be submitted twice.
 */
exports.submitMomoDeposit = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const {
        walletId,
        amount,
        transactionId,
        operator,
        senderPhone,
        note,
      } = req.body || {};

      if (!walletId || !amount || !transactionId || !operator) {
        return res.status(400).json({
          success: false,
          error: "walletId, amount, transactionId and operator are required",
        });
      }

      const opNormalized = String(operator).toUpperCase();
      if (opNormalized !== "MTN" && opNormalized !== "ORANGE") {
        return res.status(400).json({ success: false, error: "operator must be MTN or ORANGE" });
      }

      const txId = String(transactionId).trim();
      const numericAmount = Number(amount);
      if (!isFinite(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({ success: false, error: "amount must be a positive number" });
      }

      // Load wallet to enrich the deposit doc with usersEmail + momoCode.
      const walletRef = db.collection("walletAccount").doc(walletId);
      const walletSnap = await walletRef.get();
      if (!walletSnap.exists) {
        return res.status(404).json({ success: false, error: "Wallet not found" });
      }
      const walletData = walletSnap.data();

      // Dedup: same transactionId + same wallet = already submitted.
      const existing = await db
        .collection("momo_deposits")
        .where("transactionId", "==", txId)
        .where("walletId", "==", walletId)
        .limit(1)
        .get();
      if (!existing.empty) {
        return res.status(409).json({
          success: false,
          error: "This transaction ID has already been submitted for this wallet",
          existingId: existing.docs[0].id,
        });
      }

      const nowIso = new Date().toISOString();
      const docRef = await db.collection("momo_deposits").add({
        walletId,
        walletEmail: walletData.usersEmail || "",
        momoCode: walletData.momoCode || "",
        amount: numericAmount,
        currency: walletData.currency || "XAF",
        transactionId: txId,
        operator: opNormalized,
        senderPhone: senderPhone ? String(senderPhone).trim() : "",
        note: note ? String(note).trim().substring(0, 500) : "",
        status: "pending",
        submittedAt: nowIso,
      });

      res.json({ success: true, id: docRef.id, submittedAt: nowIso });
    } catch (error) {
      console.error("submitMomoDeposit error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
});

/**
 * Connects to IMAP and fetches emails with "Issue Report from" in the subject
 * from the last N days.
 */
function fetchIssueReportEmails(days) {
  return new Promise((resolve, reject) => {
    const imapConfig = getImapConfig();
    const imap = new Imap(imapConfig);
    const emails = [];

    console.log("IMAP connecting for issue reports to", imapConfig.host);

    imap.once("ready", () => {
      imap.openBox("INBOX", true, (err, box) => {
        if (err) {
          imap.end();
          return reject(err);
        }

        const since = new Date();
        since.setDate(since.getDate() - days);

        const searchCriteria = [
          ["SINCE", since],
          ["SUBJECT", "Issue Report from"],
        ];

        console.log("Searching issue reports with criteria:", JSON.stringify(searchCriteria));

        imap.search(searchCriteria, (err, uids) => {
          if (err) {
            imap.end();
            return reject(err);
          }

          if (!uids || uids.length === 0) {
            imap.end();
            return resolve([]);
          }

          const toFetch = uids.slice(-50);

          const fetch = imap.fetch(toFetch, {
            bodies: "",
            struct: true,
          });

          fetch.on("message", (msg) => {
            let rawBuffer = [];

            msg.on("body", (stream) => {
              stream.on("data", (chunk) => rawBuffer.push(chunk));
            });

            msg.on("attributes", (attrs) => {
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

          fetch.once("end", async () => {
            imap.end();

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
                console.warn("Failed to parse issue report email:", parseErr.message);
              }
            }
            console.log("Parsed", parsed.length, "issue report emails");
            resolve(parsed);
          });
        });
      });
    });

    imap.once("error", (err) => {
      reject(err);
    });

    imap.once("end", () => {
      console.log("IMAP connection closed (issue reports)");
    });

    imap.connect();
  });
}

/**
 * HTTP Cloud Function: checks mailbox for Issue Report emails
 * and stores new ones in the issue_report_emails Firestore collection.
 */
exports.checkIssueReportEmails = functions
  .runWith({ timeoutSeconds: 60, memory: "256MB", secrets: ["EMAIL_USER", "EMAIL_PASSWORD", "EMAIL_HOST", "EMAIL_PORT"] })
  .https.onRequest((req, res) => {
    cors(req, res, async () => {
      try {
        const emails = await fetchIssueReportEmails(7);
        let newCount = 0;

        for (const email of emails) {
          const existing = await db
            .collection("issue_report_emails")
            .where("messageId", "==", email.messageId)
            .limit(1)
            .get();

          if (!existing.empty) continue;

          await db.collection("issue_report_emails").add({
            messageId: email.messageId,
            from: email.from,
            senderName: email.senderName,
            subject: email.subject,
            snippet: email.snippet,
            body: email.body || "",
            date: email.date,
            status: "new",
          });
          newCount++;
        }

        res.json({ success: true, totalChecked: emails.length, newCount });
      } catch (error) {
        console.error("checkIssueReportEmails error:", error);
        res.status(500).json({ success: false, error: error.message });
      }
    });
  });

/**
 * Scheduled Cloud Function: runs every 30 minutes to check for new Issue Report emails.
 */
exports.scheduledIssueReportCheck = functions
.runWith({ secrets: ["EMAIL_USER", "EMAIL_PASSWORD", "EMAIL_HOST", "EMAIL_PORT"] })
.pubsub.schedule("every 30 minutes")
  .onRun(async () => {
    try {
      const emails = await fetchIssueReportEmails(1);

      for (const email of emails) {
        const existing = await db
          .collection("issue_report_emails")
          .where("messageId", "==", email.messageId)
          .limit(1)
          .get();

        if (!existing.empty) continue;

        await db.collection("issue_report_emails").add({
          messageId: email.messageId,
          from: email.from,
          senderName: email.senderName,
          subject: email.subject,
          snippet: email.snippet,
          body: email.body || "",
          date: email.date,
          status: "new",
        });
      }

      console.log(`Scheduled issue report check complete: ${emails.length} emails scanned`);
      return null;
    } catch (error) {
      console.error("scheduledIssueReportCheck error:", error);
      return null;
    }
  });

// ─── Marketplace lifecycle: push notifications ──────────────────────────────
//
// Triggered for every new doc written to `marketplaceNotifications/{notifId}`
// by the Flutter `MarketplaceLifecycleService` (cancellation cascade) so the
// targeted bidder gets a push even if the app is closed. The same doc is
// also rendered as an in-app banner by the Flutter home_page listener — the
// push and the banner are two complementary surfaces for the same event.
//
// Doc shape (written by the lifecycle service):
//   { targetUserEmail, type, postId, fromEmail,
//     messageEn, messageFr, read, createdAt }
//
// On send failures, a stale token is cleared on the user doc so the next
// sign-in writes a fresh one and we don't keep retrying the same broken
// destination forever.
const MARKETPLACE_NOTIF_TITLES_EN = {
  post_cancelled: "Post cancelled",
};
const MARKETPLACE_NOTIF_TITLES_FR = {
  post_cancelled: "Annonce annulée",
};

// ─── ONE-SHOT: backfill `lifecycle` on legacy posts/propositions ────────────
//
// Reads every doc in `posts` and `propositions`, stamps `lifecycle: 'active'`
// on those that don't already have the field, and reports the count. Safe to
// re-run (idempotent: docs with a `lifecycle` value are skipped).
//
// USAGE:
//   1. Deploy this function:
//        firebase deploy --only functions:backfillMarketplaceLifecycle
//   2. Call it once (URL printed in deploy output, or visible in console):
//        curl https://us-central1-dashboard-33d8e.cloudfunctions.net/backfillMarketplaceLifecycle
//      Response: { "success": true, "posts": <N>, "propositions": <M> }
//   3. Verify in Firestore console that legacy docs now have lifecycle:"active".
//   4. DELETE this function after use — leaving an unauthenticated bulk-write
//      endpoint in prod is bad hygiene:
//        firebase functions:delete backfillMarketplaceLifecycle


// Procédure de backfill — étape par étape
// 1. Déployer la fonction

// cd /Volumes/DevSSD/vsCodeProject/earlytransfert
// firebase deploy --only functions:backfillMarketplaceLifecycle
// À la fin du déploiement, Firebase affiche l'URL dans le terminal :


// Function URL (backfillMarketplaceLifecycle): https://us-central1-dashboard-33d8e.cloudfunctions.net/backfillMarketplaceLifecycle
// (la région exacte peut différer — us-central1 par défaut, mais c'est dans la sortie de la commande).

// 2. L'appeler une fois

// curl https://us-central1-dashboard-33d8e.cloudfunctions.net/backfillMarketplaceLifecycle
// Ou directement dans ton navigateur en collant l'URL — c'est juste un GET. Réponse attendue :


// {
//   "success": true,
//   "posts": { "scanned": 234, "updated": 230 },
//   "propositions": { "scanned": 891, "updated": 884 }
// }
// scanned = nombre total de docs lus
// updated = nombre stampés avec lifecycle: "active" (les 4-7 docs de différence ont été créés par une nouvelle version du Flutter en cours de rollout, donc déjà stampés → skip)
// Si tu vois {"success":false,...}, recoller le message d'erreur ici.

// 3. Vérifier en console
// Ouvrir la console Firestore, choisir n'importe quel doc dans posts ou propositions, et confirmer que lifecycle: "active" est bien présent.

// 4. Supprimer la fonction (très important)
// C'est un endpoint non-authentifié qui fait des écritures en bulk — ne pas le laisser traîner.


// firebase functions:delete backfillMarketplaceLifecycle
// Confirmer Y quand Firebase demande.


//
// Security note: this endpoint is intentionally unauthenticated to keep the
// one-shot operation simple, but the operation itself is bounded — it only
// adds a constant string to docs missing the field, never overwrites existing
// values, never touches money. Worst case if abused: the same idempotent
// no-op runs again.
exports.backfillMarketplaceLifecycle = functions
  .runWith({ timeoutSeconds: 540, memory: "512MB" })
  .https.onRequest((req, res) => {
    cors(req, res, async () => {
      try {
        async function backfillCollection(name) {
          const snap = await db.collection(name).get();
          let updated = 0;
          let batch = db.batch();
          let inBatch = 0;
          for (const doc of snap.docs) {
            if (doc.get("lifecycle")) continue; // already stamped
            batch.update(doc.ref, { lifecycle: "active" });
            inBatch++;
            updated++;
            if (inBatch >= 400) {
              await batch.commit();
              batch = db.batch();
              inBatch = 0;
            }
          }
          if (inBatch > 0) await batch.commit();
          return { scanned: snap.size, updated };
        }

        const posts = await backfillCollection("posts");
        const propositions = await backfillCollection("propositions");
        console.log("Backfill complete:", { posts, propositions });
        res.json({ success: true, posts, propositions });
      } catch (error) {
        console.error("backfillMarketplaceLifecycle error:", error);
        res.status(500).json({ success: false, error: error.message });
      }
    });
  });

exports.onMarketplaceNotificationCreated = functions.firestore
  .document("marketplaceNotifications/{notifId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    if (!data) return null;

    const targetEmail = data.targetUserEmail;
    if (!targetEmail) {
      console.warn("marketplace notif missing targetUserEmail", context.params.notifId);
      return null;
    }

    const userSnap = await db
      .collection("users")
      .where("email", "==", targetEmail)
      .limit(1)
      .get();
    if (userSnap.empty) {
      console.warn("marketplace notif: no user doc for", targetEmail);
      return null;
    }

    const userDoc = userSnap.docs[0];
    const token = userDoc.get("fcmToken");
    if (!token) {
      console.log("marketplace notif: user has no fcmToken yet, skipping push:", targetEmail);
      return null;
    }

    // `preferredLang` is optional on the user doc — defaults to EN. The
    // in-app banner localises itself client-side from `Get.locale`, so the
    // only thing this push gets wrong if `preferredLang` is missing is the
    // translation of the banner shown by the OS while the app is closed.
    const lang = (userDoc.get("preferredLang") || "en").toString();
    const isFr = lang.toLowerCase().startsWith("fr");
    const type = data.type || "";
    const title = isFr
      ? (MARKETPLACE_NOTIF_TITLES_FR[type] || "Notification")
      : (MARKETPLACE_NOTIF_TITLES_EN[type] || "Notification");
    const body = isFr
      ? (data.messageFr || data.messageEn || "")
      : (data.messageEn || data.messageFr || "");

    const message = {
      token,
      notification: { title, body },
      data: {
        notifId: context.params.notifId,
        type,
        postId: data.postId || "",
        // Flutter side reads this and routes to the right screen on tap.
        route: "marketplaceNotification",
      },
      android: {
        priority: "high",
        notification: { channelId: "high_importance_channel" },
      },
      apns: {
        payload: { aps: { sound: "default" } },
      },
    };

    try {
      await admin.messaging().send(message);
    } catch (err) {
      // Stale token: drop it so the next sign-in re-registers cleanly.
      if (err && err.code === "messaging/registration-token-not-registered") {
        await userDoc.ref.update({ fcmToken: "" });
      } else {
        console.error("marketplace notif FCM send failed", err);
      }
    }
    return null;
  });
