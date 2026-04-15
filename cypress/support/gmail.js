const { google } = require('googleapis');

const auth = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

auth.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const gmail = google.gmail({ version: 'v1', auth });

async function fetchOtp() {
  const res = await gmail.users.messages.list({
    userId: 'me',
    maxResults: 5,
  });

  const messageId = res.data.messages[0].id;

  const msg = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
  });

  const text = msg.data.snippet;

  const otp = text.match(/\b\d{4,8}\b/);
  return otp ? otp[0] : null;
}

module.exports = { fetchOtp };