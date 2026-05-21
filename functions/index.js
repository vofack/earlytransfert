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
