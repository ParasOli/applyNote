require("dotenv").config();
const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const Imap = require("imap-simple");
const twilio = require("twilio");

module.exports = {
  e2e: {
    screenshotOnRunFailure: true,
    viewportWidth: 1440,
    viewportHeight: 900,

    projectId: "qqtmqa",
    experimentalPromptCommand: true,

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

      config.env.EMAIL = process.env.EMAIL;
      config.env.PASSWORD = process.env.PASSWORD;
      config.env.TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
      config.env.TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
      config.env.TWILIO_NUMBER = process.env.TWILIO_NUMBER;
      config.env.EXPECTED_FROM = process.env.EXPECTED_FROM;
      config.env.PROJECT_NAME = "LVL 10-11";
      config.env.PROJECT_ID = 500526306;

      on("task", {
        getLatestDownloadedFile({ downloadsFolder, prefix = "" }) {
          const files = fs
            .readdirSync(downloadsFolder)
            .filter(f =>
              f.includes(prefix) &&
              (f.endsWith(".csv") || f.endsWith(".xlsx"))
            )
            .map(file => ({
              name: file,
              time: fs.statSync(path.join(downloadsFolder, file)).mtime.getTime(),
            }))
            .sort((a, b) => b.time - a.time);

          return files[0]?.name || null;
        },

        parseExcel({ filePath }) {
          const workbook = xlsx.readFile(filePath);
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          return xlsx.utils.sheet_to_json(sheet, { header: 1 });
        },

        deleteDownloadedFiles({ downloadsFolder, pattern, extension }) {
          if (!fs.existsSync(downloadsFolder)) return 0;

          const filesToDelete = fs
            .readdirSync(downloadsFolder)
            .filter(f => f.includes(pattern) && f.endsWith(extension));

          filesToDelete.forEach(file =>
            fs.unlinkSync(path.join(downloadsFolder, file))
          );

          return filesToDelete.length;
        },

        deleteFile({ filePath }) {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        },

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
          } catch (err) {
            console.error("Email error:", err.message);
            return null;
          }
        },

        async listRecentEmails() {
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
              { bodies: ["HEADER"], markSeen: false }
            );

            connection.end();

            return messages.map(msg => {
              const headers = msg.parts.find(p => p.which === "HEADER")?.body;
              return {
                subject: headers?.subject?.[0] || "No Subject",
                from: headers?.from?.[0] || "Unknown",
                date: headers?.date?.[0] || "Unknown",
              };
            });
          } catch (err) {
            console.error("List email error:", err.message);
            return [];
          }
        },

        getTwilioOtp({ accountSid, authToken, to }) {
          if (!accountSid || !authToken) return null;

          const client = twilio(accountSid, authToken);

          return client.messages.list({ to, limit: 5 }).then(msgs => {
            const otp = msgs.find(m => m.body.includes("Your OTP"));
            return otp?.body.match(/\d{4,6}/)?.[0] || null;
          });
        },

        getTwilioMessages({ accountSid, authToken, to }) {
          if (!accountSid || !authToken) return [];

          const client = twilio(accountSid, authToken);

          return client.messages.list({ to, limit: 10 }).then(msgs =>
            msgs.map(m => ({
              body: m.body,
              from: m.from,
              to: m.to,
              direction: m.direction,
              status: m.status,
            }))
          );
        },
      });

      return config;
    },

    env: {
      allure: true,
      allureResultsPath: "allure-results",
      allureSkipCommands: "wrap",
      allureAddVideoOnPass: false,
      allureSkipAutomaticScreenshots: false,
      allureLogCypress: false,
      allureReuseAfterRun: false,
      allureAddVideoOnFail: true,
    },
  },
};