const axios = require('axios');
const fetch = require('node-fetch');
const config = require('../settings');

const userName = 'VajiraTech';
const token = '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';
const repoName = 'izumimd-db';

const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
};

async function githubApiRequest(url, method = 'GET', data = null) {
  const options = {
    method,
    headers,
  };
  if (data && method !== 'GET' && method !== 'HEAD') {
    options.data = data;
  }

  try {
    const response = await axios(url, options);
    return response.data;
  } catch (error) {
    const status = error.response?.status || 'NO_STATUS';
    const statusText = error.response?.statusText || error.message;
    throw new Error(`GitHub API Error: [${status}] ${statusText}`);
  }
}

async function githubSearchFile(filePath, fileName) {
  const url = `https://api.github.com/repos/${userName}/${repoName}/contents/${filePath}?ref=main`;
  const files = await githubApiRequest(url);
  return files.find(file => file.name === fileName);
}

async function githubCreateNewFile(filePath, fileName, content) {
  const url = `https://api.github.com/repos/${userName}/${repoName}/contents/${filePath}/${fileName}`;
  const data = {
    message: `Create new file: ${fileName}`,
    content: Buffer.from(content).toString('base64'),
  };
  return githubApiRequest(url, 'PUT', data);
}

async function githubDeleteFile(filePath, fileName) {
  const file = await githubSearchFile(filePath, fileName);
  if (!file) throw new Error('File not found on GitHub.');

  const url = `https://api.github.com/repos/${userName}/${repoName}/contents/${filePath}/${fileName}`;
  const data = {
    message: `Delete file: ${fileName}`,
    sha: file.sha,
  };
  return githubApiRequest(url, 'DELETE', data);
}

async function githubGetFileContent(filePath, fileName) {
  const file = await githubSearchFile(filePath, fileName);
  if (!file) throw new Error('File not found on GitHub.');

  const response = await fetch(file.download_url);
  if (!response.ok) throw new Error(`Failed to fetch file content: ${response.statusText}`);

  return response.text();
}

async function githubClearAndWriteFile(filePath, fileName, content) {
  const file = await githubSearchFile(filePath, fileName);
  if (!file) {
    // File does not exist - create new
    return githubCreateNewFile(filePath, fileName, content);
  } else {
    // File exists - update it
    const url = `https://api.github.com/repos/${userName}/${repoName}/contents/${filePath}/${fileName}`;
    const data = {
      message: `Modify file: ${fileName}`,
      content: Buffer.from(content).toString('base64'),
      sha: file.sha,
    };
    return githubApiRequest(url, 'PUT', data);
  }
}

// Check if repo exists
async function checkRepoAvailability() {
  try {
    const apiUrl = `https://api.github.com/repos/${userName}/${repoName}`;
    await githubApiRequest(apiUrl);
    return true;
  } catch (error) {
    if (error.message.includes('404')) {
      return false;
    }
    console.error('Error checking repo:', error.message);
    throw error;
  }
}

// Create repo if not exists and initialize files
async function connectdb() {
  const available = await checkRepoAvailability();
  if (!available) {
    try {
      await githubApiRequest('https://api.github.com/user/repos', 'POST', {
        name: repoName,
        private: true,
      });
      console.log(`Repository "${repoName}" created successfully.`);

      const initialSettings = {
        LANG: 'EN',
        ANTI_BAD: [],
        MAX_SIZE: 100,
        ONLY_GROUP: false,
        ANTI_LINK: [],
        ANTI_BOT: [],
        ALIVE: 'default',
        FOOTER: '©ＱＵＥＥＮ -ＩＺＵＭＩ - ＭＤ',
        LOGO: 'https://telegra.ph/file/ba8ea739e63bf28c30b37.jpg',
      };

      await githubCreateNewFile('settings', 'settings.json', JSON.stringify(initialSettings, null, 2));
      await githubCreateNewFile('Non-Btn', 'data.json', JSON.stringify([], null, 2));

      console.log('Initial database files created.');
    } catch (err) {
      console.error('Error creating repository or initial files:', err.message);
      throw err;
    }
  } else {
    console.log('Database repository connected.');
  }
}

// Store command mapping
async function updateCMDStore(MsgID, CmdID) {
  try {
    let olds = JSON.parse(await githubGetFileContent('Non-Btn', 'data.json'));
    olds.push({ [MsgID]: CmdID });
    await githubClearAndWriteFile('Non-Btn', 'data.json', JSON.stringify(olds, null, 2));
    return true;
  } catch (e) {
    console.error('Error updating CMD store:', e);
    return false;
  }
}

// Check if MsgID exists in CMD store
async function isbtnID(MsgID) {
  try {
    let olds = JSON.parse(await githubGetFileContent('Non-Btn', 'data.json'));
    return olds.some(item => Object.hasOwn(item, MsgID));
  } catch {
    return false;
  }
}

// Get CmdID by MsgID
async function getCMDStore(MsgID) {
  try {
    let olds = JSON.parse(await githubGetFileContent('Non-Btn', 'data.json'));
    const found = olds.find(item => Object.hasOwn(item, MsgID));
    return found ? found[MsgID] : null;
  } catch (e) {
    console.error('Error getting CMD store:', e);
    return null;
  }
}

// Get cmd string for a cmdId from map
function getCmdForCmdId(CMD_ID_MAP, cmdId) {
  const entry = CMD_ID_MAP.find(item => item.cmdId === cmdId);
  return entry ? entry.cmd : null;
}

// Update a specific setting key and sync config
async function input(setting, data) {
  try {
    const settings = JSON.parse(await githubGetFileContent('settings', 'settings.json'));

    if (!(setting in settings)) {
      throw new Error(`Setting "${setting}" not found.`);
    }

    settings[setting] = data;
    Object.assign(config, { [setting]: data });

    await githubClearAndWriteFile('settings', 'settings.json', JSON.stringify(settings, null, 2));
  } catch (e) {
    console.error(`Error updating setting ${setting}:`, e);
    throw e;
  }
}

// Get a specific setting value
async function get(setting) {
  try {
    const settings = JSON.parse(await githubGetFileContent('settings', 'settings.json'));
    return settings[setting];
  } catch (e) {
    console.error(`Error fetching setting ${setting}:`, e);
    return null;
  }
}

// Sync settings to config object
async function updb() {
  try {
    const settings = JSON.parse(await githubGetFileContent('settings', 'settings.json'));
    Object.assign(config, {
      LANG: settings.LANG,
      MAX_SIZE: Number(settings.MAX_SIZE),
      ALIVE: settings.ALIVE,
      FOOTER: settings.FOOTER,
      LOGO: settings.LOGO,
      ANTI_BAD: settings.ANTI_BAD,
      ONLY_GROUP: settings.ONLY_GROUP,
      ANTI_LINK: settings.ANTI_LINK,
      ANTI_BOT: settings.ANTI_BOT,
    });
    console.log('Database loaded into config.');
  } catch (e) {
    console.error('Error loading database into config:', e);
  }
}

// Reset settings file to defaults
async function updfb() {
  const defaults = {
    LANG: 'EN',
    ANTI_BAD: [],
    MAX_SIZE: 100,
    ONLY_GROUP: false,
    ANTI_LINK: [],
    ANTI_BOT: [],
    ALIVE: 'default',
    FOOTER: '©ＱＵＥＥＮ -ＩＺＵＭＩ - ＭＤ',
    LOGO: 'https://telegra.ph/file/ba8ea739e63bf28c30b37.jpg',
  };

  try {
    await githubClearAndWriteFile('settings', 'settings.json', JSON.stringify(defaults, null, 2));
    Object.assign(config, defaults);
    console.log('Database reset to default values.');
  } catch (e) {
    console.error('Error resetting database:', e);
  }
}

module.exports = {
  updateCMDStore,
  isbtnID,
  getCMDStore,
  getCmdForCmdId,
  connectdb,
  input,
  get,
  updb,
  updfb,
};
