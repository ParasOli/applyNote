const { defineConfig } = require("cypress");
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const Imap = require("imap-simple");

module.exports = defineConfig({
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
            .filter(
              (f) =>
                f.includes(prefix) &&
                (f.endsWith(".csv") || f.endsWith(".xlsx"))
            )
            .map((file) => ({
              name: file,
              time: fs.statSync(path.join(downloadsFolder, file)).mtime.getTime(),
            }))
            .sort((a, b) => b.time - a.time);

          files.slice(1).forEach((file) =>
            fs.unlinkSync(path.join(downloadsFolder, file.name))
          );

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
            .filter((f) => f.includes(pattern) && f.endsWith(extension));

          filesToDelete.forEach((file) =>
            fs.unlinkSync(path.join(downloadsFolder, file))
          );

          return filesToDelete.length;
        },

        deleteFile({ filePath }) {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          return null;
        },

        async getMostRecentEmail() {
          const imapConfig = {
            imap: {
              user: process.env.GMAIL_USER,
              password: process.env.GMAIL_APP_PASSWORD,
              host: "imap.gmail.com",
              port: 993,
              tls: true,
              tlsOptions: { rejectUnauthorized: false },
            },
          };

          try {
            const connection = await Imap.connect(imapConfig);
            await connection.openBox("INBOX");

            const searchCriteria = [["SINCE", new Date(Date.now() - 30 * 60 * 1000)]];
            const fetchOptions = { bodies: ["HEADER", "TEXT", ""], markSeen: false };

            const messages = await connection.search(searchCriteria, fetchOptions);
            connection.end();

            if (messages && messages.length > 0) {
              const message = messages[messages.length - 1];
              const parts = message.parts;
              let body = "";
              let headers = {};

              parts.forEach((part) => {
                if (part.which === "TEXT" || part.which === "") body += part.body;
                if (part.which === "HEADER") headers = part.body;
              });

              return {
                subject: headers.subject ? headers.subject[0] : "",
                from: headers.from ? headers.from[0] : "",
                body: body,
                date: headers.date ? headers.date[0] : "",
              };
            }

            return null;
          } catch (error) {
            console.error("❌ Error getting most recent email:", error.message);
            return null;
          }
        },

        async listRecentEmails() {
          const imapConfig = {
            imap: {
              user: process.env.GMAIL_USER,
              password: process.env.GMAIL_APP_PASSWORD,
              host: "imap.gmail.com",
              port: 993,
              tls: true,
              tlsOptions: { rejectUnauthorized: false },
            },
          };

          try {
            const connection = await Imap.connect(imapConfig);
            await connection.openBox("INBOX");

            const searchCriteria = [["SINCE", new Date(Date.now() - 30 * 60 * 1000)]];
            const fetchOptions = { bodies: ["HEADER"], markSeen: false };

            const messages = await connection.search(searchCriteria, fetchOptions);
            connection.end();

            return messages.map((msg) => {
              const headers = msg.parts.find((p) => p.which === "HEADER").body;
              return {
                subject: headers.subject ? headers.subject[0] : "No Subject",
                from: headers.from ? headers.from[0] : "Unknown",
                date: headers.date ? headers.date[0] : "Unknown",
              };
            });
          } catch (error) {
            console.error("❌ Error listing emails:", error.message);
            return [];
          }
        },

        getTwilioOtp({ accountSid, authToken, to }) {
          // ✅ Guard — prevents config crash when credentials missing in CI
          if (!accountSid || !authToken) {
            console.error("❌ Twilio credentials missing for getTwilioOtp");
            return null;
          }

          const client = twilio(accountSid, authToken);
          return client.messages
            .list({ to, limit: 5 })
            .then((messages) => {
              const otpMessage = messages.find((msg) => msg.body.includes("Your OTP"));
              if (otpMessage) return otpMessage.body.match(/\d{4,6}/)[0];
              return null;
            });
        },

        getTwilioMessages({ accountSid, authToken, to }) {
          if (!accountSid || !authToken) {
            console.error("❌ Twilio credentials missing for getTwilioMessages");
            return [];
          }

          const client = twilio(accountSid, authToken);
          return client.messages
            .list({ to, limit: 10 })
            .then((messages) =>
              messages.map((m) => ({
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
      allureReuseAfterSpec: false,
      allureAddVideoOnFail: true,
    },
  },
});