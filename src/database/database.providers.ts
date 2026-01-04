import { MongoClient } from 'mongodb';

export const databaseProviders = [
  {
    provide: 'DATABASE_CONNECTION',
    useFactory: async () => {
      const client = new MongoClient(process.env.PLAY_MONGODB_URI || 'mongodb://localhost:27017/play');
      await client.connect();
      return client.db();
    },
  },
];
