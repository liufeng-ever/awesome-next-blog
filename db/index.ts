import 'reflect-metadata';
import {
  Connection,
  getConnection,
  createConnection,
  ConnectionOptions,
} from 'typeorm';
import { User, UserAuth, Article, Comment, Tag } from './entity/index';

/**
 * 从环境变量获取数据库配置信息
 */
const host = process.env.DATABASE_HOST;
const port = Number(process.env.DATABASE_PORT);
const username = process.env.DATABASE_USERNAME;
const password = process.env.DATABASE_PASSWORD;
const database = process.env.DATABASE_NAME;

// 验证数据库配置
if (!host || !port || !username || !password || !database) {
  throw new Error(
    'Missing database configuration. Please check your environment variables.'
  );
}

// 数据库连接配置
const connectionOptions: ConnectionOptions = {
  name: 'default',
  type: 'mysql',
  host,
  port,
  username,
  password,
  database,
  entities: [User, UserAuth, Article, Comment, Tag],
  synchronize: false,
  logging: true,
  extra: {
    connectionLimit: 5,
    waitForConnections: true,
    queueLimit: 0,
  },
};

/**
 * 验证连接中的实体注册
 * @param connection 数据库连接
 */
const validateEntities = async (connection: Connection) => {
  const entities = [Article, Tag, User, Comment, UserAuth];
  for (const entity of entities) {
    try {
      const repository = connection.getRepository(entity);
      if (!repository) {
        throw new Error(`Repository for ${entity.name} not found`);
      }
    } catch (error) {
      console.error(`Entity validation failed for ${entity.name}:`, error);
      throw error;
    }
  }
  console.log('All entities validated successfully');
};

/**
 * 准备数据库连接
 * @returns {Promise<Connection>} 数据库连接
 */
export const prepareConnection = async (): Promise<Connection> => {
  try {
    let connection: Connection;

    // 尝试获取现有连接
    try {
      connection = getConnection('default');
      if (connection.isConnected) {
        console.log('Found existing connection, validating entities...');
        await validateEntities(connection);
        console.log('Using existing database connection');
        return connection;
      }
    } catch (error) {
      console.log('No valid connection found, creating new one...');
    }

    // 如果连接不存在或已断开，先尝试关闭
    try {
      const existingConnection = getConnection('default');
      if (existingConnection.isConnected) {
        await existingConnection.close();
        console.log('Closed existing connection');
      }
    } catch (error) {
      // 忽略错误，继续创建新连接
    }

    // 创建新连接
    console.log('Creating new database connection...');
    connection = await createConnection(connectionOptions);

    // 验证连接和实体
    if (!connection.isConnected) {
      throw new Error('Database connection failed to establish');
    }

    await validateEntities(connection);
    console.log('Database connection established successfully');

    return connection;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
};

// 导出关闭连接的函数
export const closeConnection = async () => {
  try {
    const connection = getConnection('default');
    if (connection.isConnected) {
      await connection.close();
      console.log('Database connection closed');
    }
  } catch (error) {
    console.log('No active connection to close');
  }
};
