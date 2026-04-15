require("dotenv").config();
const Imap = require("imap-simple");
const allureWriter = require("@shelex/cypress-allure-plugin/writer");

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

    testIsolation: false,

    specPattern: "cypress/e2e/**/*.{cy.js,cy.ts}",

    setupNodeEvents(on, config) {

      // ================= ALLURE (REQUIRED) =================
      allureWriter(on, config);

      // ================= ENV =================
      config.env.EMAIL = process.env.EMAIL;
      config.env.PASSWORD = process.env.PASSWORD;
      config.env.GMAIL_USER = process.env.GMAIL_USER;
      config.env.GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

      // ================= TASKS =================
      on("task", {
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

            let headers = {};
            let body = "";

            msg.parts.forEach(part => {
              if (part.which === "HEADER") headers = part.body;
              if (part.which === "TEXT" || part.which === "") body += part.body;
            });

            return {
              subject: headers.subject?.[0] || "",
              from: headers.from?.[0] || "",
              body,
              date: headers.date?.[0] || "",
            };

          } catch (err) {
            console.error("❌ Email error:", err.message);
            return null;
          }
        },
      });

      return config;
    },

    // ================= ALLURE CONFIG =================
    env: {
      allure: true,
      allureResultsPath: "allure-results",
    },
  },
};