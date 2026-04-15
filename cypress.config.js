const { defineConfig } = require("cypress");
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const Imap = require("imap-simple");

module.exports = defineConfig({
  e2e: {
    // ─── Viewport & timeouts ───────────────────────────────────────────────
    viewportWidth: 1440,
    viewportHeight: 900,
    defaultCommandTimeout: 30000,
    requestTimeout: 30000,
    responseTimeout: 30000,
    pageLoadTimeout: 30000,
    taskTimeout: 120000,

    // ─── Run behaviour ─────────────────────────────────────────────────────
    screenshotOnRunFailure: true,
    testIsolation: false,
    chromeWebSecurity: false,
    retries: { runMode: 1, openMode: 0 },

    // ─── Paths ─────────────────────────────────────────────────────────────
    specPattern: "cypress/e2e/**/*.{cy.js,cy.ts}",
    downloadsFolder: path.join(__dirname, "cypress", "downloads"),

    // ─── Cloud ─────────────────────────────────────────────────────────────
    projectId: "qqtmqa",

    // ─── Allure env vars ───────────────────────────────────────────────────
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

    setupNodeEvents(on, config) {
      // ── Allure plugin (MUST be registered first) ─────────────────────────
      const allureWriter = require("@shelex/cypress-allure-plugin/writer");
      allureWriter(on, config);

      // ── Env injection ────────────────────────────────────────────────────
      config.env.EMAIL    = process.env.CYPRESS_EMAIL;
      config.env.PASSWORD = process.env.CYPRESS_PASSWORD;
      config.env.PROJECT_NAME = "LVL 10-11";
      config.env.PROJECT_ID   = 500526306;

      // ── Tasks ────────────────────────────────────────────────────────────
      on("task", {

        // Returns the newest downloaded .csv/.xlsx whose name contains prefix
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

          // Clean up older duplicates
          files.slice(1).forEach((file) =>
            fs.unlinkSync(path.join(downloadsFolder, file.name))
          );

          return files[0]?.name || null;
        },

        // Delete files matching a pattern + extension
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

        // Delete a single file by absolute path
        deleteFile({ filePath }) {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          return null;
        },

        // Fetch the most recent email from the last 30 min
        async getMostRecentEmail() {
          const imapConfig = {
            imap: {
              user:     process.env.GMAIL_USER,
              password: process.env.GMAIL_APP_PASSWORD,
              host:     "imap.gmail.com",
              port:     993,
              tls:      true,
              tlsOptions: { rejectUnauthorized: false },
            },
          };

          try {
            const connection = await Imap.connect(imapConfig);
            await connection.openBox("INBOX");

            const searchCriteria = [["SINCE", new Date(Date.now() - 30 * 60 * 1000)]];
            const fetchOptions   = { bodies: ["HEADER", "TEXT", ""], markSeen: false };

            const messages = await connection.search(searchCriteria, fetchOptions);
            connection.end();

            if (!messages?.length) return null;

            const message = messages[messages.length - 1];
            let body = "", headers = {};

            message.parts.forEach((part) => {
              if (part.which === "TEXT" || part.which === "") body += part.body;
              if (part.which === "HEADER") headers = part.body;
            });

            return {
              subject: headers.subject?.[0] ?? "",
              from:    headers.from?.[0]    ?? "",
              body,
              date:    headers.date?.[0]    ?? "",
            };
          } catch (error) {
            console.error("❌ getMostRecentEmail:", error.message);
            return null;
          }
        },

        // List subjects/senders of emails from the last 30 min
        async listRecentEmails() {
          const imapConfig = {
            imap: {
              user:     process.env.GMAIL_USER,
              password: process.env.GMAIL_APP_PASSWORD,
              host:     "imap.gmail.com",
              port:     993,
              tls:      true,
              tlsOptions: { rejectUnauthorized: false },
            },
          };

          try {
            const connection = await Imap.connect(imapConfig);
            await connection.openBox("INBOX");

            const searchCriteria = [["SINCE", new Date(Date.now() - 30 * 60 * 1000)]];
            const fetchOptions   = { bodies: ["HEADER"], markSeen: false };

            const messages = await connection.search(searchCriteria, fetchOptions);
            connection.end();

            return messages.map((msg) => {
              const headers = msg.parts.find((p) => p.which === "HEADER").body;
              return {
                subject: headers.subject?.[0] ?? "No Subject",
                from:    headers.from?.[0]    ?? "Unknown",
                date:    headers.date?.[0]    ?? "Unknown",
              };
            });
          } catch (error) {
            console.error("❌ listRecentEmails:", error.message);
            return [];
          }
        },
      });

      return config;
    },
  },
});