import axios, { AxiosResponse } from 'axios';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import { join } from 'path';
import {
  getMongoClient,
  saveGuilds,
  saveIdentity,
  saveRefreshToken,
} from './mongo';
import {
  DiscordGuildsResult,
  DiscordIdentityResult,
  DiscordTokenResult,
} from './types';

if (!process.env.DISCORD_CLIENT_ID) {
  throw new Error('DISCORD_CLIENT_ID missing');
}
if (!process.env.DISCORD_CLIENT_SECRET) {
  throw new Error('DISCORD_CLIENT_SECRET missing');
}
if (!process.env.MONGO_CONNSTR) {
  throw new Error('MONGO_CONNSTR missing');
}

const mongoClientPromise = getMongoClient();
const DISCORD_BASE_URI = 'https://discord.com/api/';

const clientPath = '../../client/build';
const app = express();

app.use(cors());
app.use(express.json());

const port = 8080; // default port to listen

// Serve static resources from the "public" folder (ex: when there are images to display)
app.use(express.static(join(__dirname, clientPath)));

app.post('/queryDiscord', async (req, res) => {
  const { discordCode } = req.body;
  if (!discordCode) {
    return res.status(403).send('discordCode missing');
  }
  const mongoClient = await mongoClientPromise;
  const queryString = new URLSearchParams();
  queryString.append('client_id', process.env.DISCORD_CLIENT_ID as string);
  queryString.append(
    'client_secret',
    process.env.DISCORD_CLIENT_SECRET as string
  );
  queryString.append('grant_type', 'authorization_code');
  queryString.append('code', discordCode);
  queryString.append('redirect_uri', 'http://localhost:3010');

  let authResult: AxiosResponse<DiscordTokenResult>;
  try {
    authResult = await axios.post<
      URLSearchParams,
      AxiosResponse<DiscordTokenResult>
    >(`${DISCORD_BASE_URI}/oauth2/token`, queryString, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    if (!authResult) {
      throw new Error();
    }
  } catch (error: any) {
    return res
      .status(500)
      .send(
        `converting code to token ${JSON.stringify(
          error.response.data.error_description
        )}`
      );
  }

  let identityResult: AxiosResponse<DiscordIdentityResult>;
  try {
    identityResult = await axios.get<
      undefined,
      AxiosResponse<DiscordIdentityResult>
    >(`${DISCORD_BASE_URI}/users/@me`, {
      headers: { Authorization: `Bearer ${authResult.data.access_token}` },
    });
    if (!identityResult) {
      throw new Error();
    }
  } catch (error: any) {
    return res
      .status(500)
      .send(
        `getting identity ${JSON.stringify(
          error.response.data.error_description
        )}`
      );
  }

  await saveRefreshToken(mongoClient, {
    _id: identityResult.data.id,
    refreshToken: authResult.data.refresh_token,
  });

  await saveIdentity(mongoClient, identityResult.data);

  let guildsResult: AxiosResponse<DiscordGuildsResult[]>;
  try {
    guildsResult = await axios.get<
      undefined,
      AxiosResponse<DiscordGuildsResult[]>
    >(`${DISCORD_BASE_URI}/users/@me/guilds`, {
      headers: { Authorization: `Bearer ${authResult.data.access_token}` },
    });
    if (!guildsResult) {
      throw new Error();
    }
  } catch (error: any) {
    return res
      .status(500)
      .send(
        `getting guilds ${JSON.stringify(
          error.response.data.error_description
        )}`
      );
  }
  await saveGuilds(
    mongoClient,
    identityResult.data.id,
    guildsResult.data.map(({ features, icon, ...rest }) => rest)
  );
  res.sendStatus(200);
});

// Serve the HTML page
app.get('*', (req: any, res: any) => {
  res.sendFile(join(__dirname, clientPath, 'index.html'));
});

// start the Express server
app.listen(port, () => {
  console.log(`app started at http://localhost:${port}`);
});
