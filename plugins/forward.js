const l = console.log
const config = require('../settings')
const { cmd, commands } = require('../lib/command');


cmd({
  pattern: "forward",
  desc: "Forward a quoted message to the specified JID",
  alias: ["fo"],
  category: "owner",
  use: ".forward <jid>",
  filename: __filename,
},
async (conn, mek, m, { q, reply, isOwner }) => {
  try {
    if (!isOwner) return reply("❌ Owner only command!");

    if (!q) return reply("❌ Please provide the target JID.\nUsage: .forward <jid>");

    if (!m.quoted) return reply("❌ Please reply to a message to forward.");

    // Construct the message object correctly
    const message = {
      key: {
        remoteJid: m.quoted.key.remoteJid || m.key.remoteJid,
        id: m.quoted.key.id,
        fromMe: m.quoted.key.fromMe,
        participant: m.quoted.key.participant || m.key.participant,
      },
      message: m.quoted.message,
    };

    // Forward the message (true to force forward flag)
    await conn.forwardMessage(q, message, true);

    return reply(`✅ Message forwarded successfully to:\n${q}`);
  } catch (error) {
    console.error("Error in forward command:", error);
    return reply("❌ Failed to forward message.");
  }
});
