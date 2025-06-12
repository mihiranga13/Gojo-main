const axios = require('axios');
const { cmd, tlang } = require('../lib/command');
const { WEATHER_API_KEY } = require('../settings'); // API Key එක මෙතනින් යනවා

cmd({
    pattern: "weather",
    category: "search",
    react: "⛅",
    desc: "නගරයක වැසි තොරතුරු ලබා දේ",
    use: "<නගරය>",
    filename: __filename
},
async (Void, citel, text) => {
    if (!text) return citel.reply("🌍 කරුණාකර නගරයක් සඳහන් කරන්න.\nඋදා: `.weather Colombo`");

    const city = String(text).trim(); // ⚠️ මෙහිදි error එක විසඳනවා

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${WEATHER_API_KEY}&lang=si`;

    try {
        const response = await axios.get(url);
        const data = response.data;
        const weather = data.weather[0];

        let msg = `🌦️ *${data.name}, ${data.sys.country} නගරයේ කාලගුණය*\n\n`;
        msg += `🌡️ උෂ්ණත්වය: ${data.main.temp}°C (ඇත් බවට හැඟෙන උෂ්ණත්වය: ${data.main.feels_like}°C)\n`;
        msg += `💧 ආර්ද්‍රතාව: ${data.main.humidity}%\n`;
        msg += `💨 සුළං වේගය: ${data.wind.speed} m/s\n`;
        msg += `☁️ තත්ත්වය: ${weather.main} - ${weather.description}\n`;
        msg += `🗺️ ස්ථාන ඛණ්ඩාංක: ${data.coord.lat}, ${data.coord.lon}`;

        return citel.reply(msg);

    } catch (error) {
        if (error.response?.data?.cod === '404') {
            return citel.reply("❌ නගරය සොයාගත නොහැක. නිවැරදි නාමයක් ලබාදෙන්න.");
        }

        console.error("Weather API Error:", error.response?.data || error);
        return citel.reply("⚠️ කාලගුණ තොරතුරු ලබා ගැනීමට නොහැක. කරුණාකර පසුව උත්සාහ කරන්න.");
    }
});
