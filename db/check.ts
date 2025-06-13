import { prepareConnection } from './index';
import { Article, User, Tag, Comment, UserAuth } from './entity';

async function checkDatabase() {
  try {
    const connection = await prepareConnection();
    console.log('Database connection established');

    // 检查表是否存在
    const queryRunner = connection.createQueryRunner();
    const tables = await queryRunner.query('SHOW TABLES');
    console.log('Existing tables:', tables);

    // 检查实体对应的表结构
    const entities = [Article, User, Tag, Comment, UserAuth];
    for (const entity of entities) {
      const tableName = connection.getMetadata(entity).tableName;
      const columns = await queryRunner.query(`DESCRIBE ${tableName}`);
      console.log(`\nTable structure for ${tableName}:`, columns);
    }

    await queryRunner.release();
    await connection.close();
  } catch (error) {
    console.error('Database check failed:', error);
  }
}

// 运行检查
checkDatabase();
