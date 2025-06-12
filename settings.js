const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });
function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}


module.exports = {
SESSION_ID: process.env.SESSION_ID === undefined ? 'nAcRBCbD#EzoZHvIDXe2ateXfK_tH2y8TF-SrVyVNs_ODfGLQxwc' : process.env.SESSION_ID,
OWNER_NUMBER: process.env.OWNER_NUMBER === undefined ? '94743826406' : process.env.OWNER_NUMBER,  
PREFIX: process.env.PREFIX || '.' ,
POSTGRESQL_URL: process.env.POSTGRESQL_URL === undefined ? 'postgres://vajiratech_user:oSIFl2xmSojMZ0rkzdd0g0W6msuVTpNN@dpg-cpd7fjv109ks73e5gtig-a.frankfurt-postgres.render.com/vajiratech' : process.env.POSTGRESQL_URL,   
ALIVE:  process.env.ALIVE  || '> GOJO MD',
GEMINI_API_KEY:process.env.GEMINI_API_KEY || 'AIzaSyDQIUl78aFtIgsNKY1RUU82nDkL905UbtA',
};
