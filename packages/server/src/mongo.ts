import { MongoClient } from 'mongodb';
import { DiscordGuild, DiscordIdentity } from './types';

export const getMongoClient = async (): Promise<MongoClient> => {
  return MongoClient.connect(process.env.MONGO_CONNSTR as string);
};

export const saveRefreshToken = async (
  client: MongoClient,
  data: { _id: string; refreshToken: string }
): Promise<any> => {
  try {
    return client
      .db()
      .collection('refresh_token')
      .updateOne(
        { _id: data._id },
        { $set: { refreshToken: data.refreshToken } },
        { upsert: true }
      );
  } catch (error: any) {
    throw new Error(`saving refreshToken to db ${JSON.stringify(error)}`);
  }
};

export const saveIdentity = async (
  client: MongoClient,
  identity: DiscordIdentity
): Promise<any> => {
  try {
    return client
      .db()
      .collection('discordData')
      .updateOne(
        { _id: identity.id },
        { $set: { identity } },
        { upsert: true }
      );
  } catch (error: any) {
    throw new Error(`saving identity to discordData ${JSON.stringify(error)}`);
  }
};

export const saveGuilds = async (
  client: MongoClient,
  discordUserId: string,
  guilds: DiscordGuild[]
): Promise<any> => {
  try {
    return client
      .db()
      .collection('discordData')
      .updateOne(
        { _id: discordUserId },
        { $set: { guilds } },
        { upsert: true }
      );
  } catch (error: any) {
    throw new Error(`saving guilds to discordData ${JSON.stringify(error)}`);
  }
};
