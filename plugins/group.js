
const config = require("../settings");

const { cmd } = require("../lib/command");

cmd(
  {
    pattern: "ginfo",
    alias: ["groupinfo", "gcinfo"],
    category: "group",
    desc: "Show group information with photo",
    filename: __filename,
  },

  // ⚠️  PARAMETER ORDER: (message, match, client)
  async (message, _match, client) => {
    if (!message.isGroup)
      return await message.reply("👥 This command works only in groups.");

    /* ── Fetch metadata ─────────────────────────────────────────── */
    const metadata = await client.groupMetadata(message.chat);
    const participants = metadata.participants || [];
    const admins = participants.filter((p) => p.admin !== null);
    const owner =
      metadata.owner ||
      participants.find((p) => p.admin === "superadmin")?.id ||
      null;

    /* ── Description & photo ────────────────────────────────────── */
    const description = metadata.desc || "📝 No description set.";
    let pfp;
    try {
      pfp = await client.profilePictureUrl(message.chat, "image");
    } catch {
      pfp =
        "https://telegra.ph/file/9e58d8c3d8ed6a22e2c42.jpg"; // fallback image
    }

    /* ── Build caption ──────────────────────────────────────────── */
    const groupInfo = `
📛 *Group Name:* ${metadata.subject}
🆔 *Group ID:* ${metadata.id}
👤 *Owner:* ${owner ? "@" + owner.split("@")[0] : "Unknown"}
👥 *Members:* ${participants.length}
🛡️ *Admins:* ${admins.length}

📝 *Description:*
${description}
`.trim();

    /* ── Send message ───────────────────────────────────────────── */
    await client.sendMessage(
      message.chat,
      {
        image: { url: pfp },
        caption: groupInfo,
        mentions: owner ? [owner] : [],
      },
      { quoted: message }
    );
  }
);
