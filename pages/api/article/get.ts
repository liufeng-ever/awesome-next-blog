import { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from 'iron-session/next';
import { ironOptions } from 'config/index';
import { prepareConnection } from 'db/index';
import { Article } from 'db/entity/index';

export default withIronSessionApiRoute(get, ironOptions);

async function get(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('Starting article get request...');
    const { tag_id = 0 } = req?.query || {};

    console.log('Preparing database connection...');
    const db = await prepareConnection();
    console.log('Database connection established');

    console.log('Getting Article repository...');
    const articleRepo = db.getRepository(Article);
    console.log('Article repository obtained');

    let articles = [];
    console.log('Fetching articles with tag_id:', tag_id);

    if (tag_id) {
      articles = await articleRepo.find({
        relations: ['user', 'tags'],
        where: (qb: any) => {
          qb.where('tag_id = :id', {
            id: Number(tag_id),
          });
        },
      });
    } else {
      articles = await articleRepo.find({
        relations: ['user', 'tags'],
      });
    }

    console.log(`Found ${articles.length} articles`);
    res?.status(200).json({
      code: 0,
      msg: '',
      data: articles || [],
    });
  } catch (error) {
    console.error('Error in article get request:', error);
    res?.status(500).json({
      code: 500,
      msg: 'Internal server error',
      data: null,
    });
  }
}
