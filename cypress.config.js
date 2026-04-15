require("dotenv").config();
const fs = require("fs");
const path = require("path");
const Imap = require("imap-simple");

module.exports = {
  e2e: {
    screenshotOnRunFailure: true,
    viewportWidth: 1440,
    viewportHeight: 900,

    projectId: "qqtmqa",

    chromeWebSecurity: false,

    defaultCommandTimeout: 30000,
    requestTimeout: 30000,
    responseTimeout: 30000,
    pageLoadTimeout: 30000,
    taskTimeout: 120000,

    retries: { runMode: 1, openMode: 0 },

    downloadsFolder: path.join(__dirname, "cypress", "downloads"),

    testIsolation: false,

    specPattern: "cypress/e2e/**/*.{cy.js,cy.ts}",

    setupNodeEvents(on, config) {

      // ✅ ENV
      config.env.EMAIL = process.env.EMAIL;
      config.env.PASSWORD = process.env.PASSWORD;
      config.env.GMAIL_USER = process.env.GMAIL_USER;
      config.env.GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
      config.env.TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
      config.env.TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
      config.env.TWILIO_NUMBER = process.env.TWILIO_NUMBER;

      // ================= TASKS =================
      on("task", {

        // 📥 latest download
        getLatestDownloadedFile({ downloadsFolder, prefix = "" }) {
          if (!fs.existsSync(downloadsFolder)) return null;

          const files = fs.readdirSync(downloadsFolder)
            .filter(f => f.includes(prefix))
            .map(file => ({
              name: file,
              time: fs.statSync(path.join(downloadsFolder, file)).mtime.getTime(),
            }))
            .sort((a, b) => b.time - a.time);

          return files[0]?.name || null;
        },

        // 🗑 delete files
        deleteFile({ filePath }) {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          return null;
        },

        // 📧 Gmail OTP fetch
        async getMostRecentEmail() {
          try {
            const connection = await Imap.connect({
              imap: {
                user: process.env.GMAIL_USER,
                password: process.env.GMAIL_APP_PASSWORD,
                host: "imap.gmail.com",
                port: 993,
                tls: true,
                tlsOptions: { rejectUnauthorized: false },
              },
            });

            await connection.openBox("INBOX");

            const messages = await connection.search(
              [["SINCE", new Date(Date.now() - 30 * 60 * 1000)]],
              { bodies: ["HEADER", "TEXT", ""], markSeen: false }
            );

            connection.end();

            if (!messages.length) return null;

            const msg = messages[messages.length - 1];

            let body = "";
            let headers = {};

            msg.parts.forEach(part => {
              if (part.which === "TEXT" || part.which === "") body += part.body;
              if (part.which === "HEADER") headers = part.body;
            });

            return {
              subject: headers.subject?.[0] || "",
              from: headers.from?.[0] || "",
              body,
              date: headers.date?.[0] || "",
            };

          } catch (e) {
            console.error("Email task error:", e.message);
            return null;
          }
        },

        // 📱 Twilio OTP
        getTwilioOtp({ accountSid, authToken, to }) {
          if (!accountSid || !authToken) return null;

          const client = require("twilio")(accountSid, authToken);

          return client.messages.list({ to, limit: 5 }).then(msgs => {
            const otp = msgs.find(m => m.body?.includes("Your OTP"));
            return otp?.body.match(/\d{4,6}/)?.[0] || null;
          });
        },
      });

      return config;
    },

    // 👉 Allure config (keep ONLY if plugin installed)
    env: {
      allure: true,
      allureResultsPath: "allure-results",
    },
  },
};