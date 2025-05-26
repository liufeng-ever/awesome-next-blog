import 'reflect-metadata';
import { Connection, getConnection, createConnection } from 'typeorm';
import { User, UserAuth, Article, Comment, Tag } from './entity/index';

/**
 * 从环境变量获取数据库配置信息
 */
// 数据库主机地址
const host = process.env.DATABASE_HOST;
// 数据库端口
const port = Number(process.env.DATABASE_PORT);
// 数据库用户名
const username = process.env.DATABASE_USERNAME;
// 数据库密码
const password = process.env.DATABASE_PASSWORD;
// 数据库名称
const database = process.env.DATABASE_NAME;

/**
 * 存储数据库连接的 Promise 对象，用于避免重复创建连接
 */
let connectionReadyPromise: Promise<Connection> | null = null;

/**
 * 准备数据库连接，若已有连接则先关闭旧连接再创建新连接
 * @returns {Promise<Connection>} 解析为数据库连接的 Promise
 */
export const prepareConnection = (): Promise<Connection> => {
  if (!connectionReadyPromise) {
    connectionReadyPromise = (async () => {
      try {
        // 尝试获取现有连接并关闭
        const staleConnection = getConnection();
        await staleConnection.close();
      } catch (error) {
        console.log(error);
      }

      // 创建新的数据库连接
      const connection = await createConnection({
        type: 'mysql',
        host,
        port,
        username,
        password,
        database,
        // 定义使用的实体
        entities: [User, UserAuth, Article, Comment, Tag],
        // 不自动同步数据库结构
        synchronize: false,
        // 开启日志记录
        logging: true,
      });

      return connection;
    })();
  }

  return connectionReadyPromise;
};
