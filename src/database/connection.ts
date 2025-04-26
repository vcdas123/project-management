import { DataSource } from 'typeorm';
import { config } from '../config';
import { logger } from '../utils/logger';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.name,
  synchronize: false,
  logging: config.environment === 'development',
  entities: [__dirname + '/../entities/**/*.{js,ts}'],
  migrations: [__dirname + '/migrations/**/*.{js,ts}'],
  subscribers: [__dirname + '/../subscribers/**/*.{js,ts}'],
});

export const createConnection = async (): Promise<DataSource> => {
  try {
    const connection = await AppDataSource.initialize();
    logger.info('Database connection established');
    return connection;
  } catch (error) {
    logger.error('Error during database connection:', error);
    throw error;
  }
};