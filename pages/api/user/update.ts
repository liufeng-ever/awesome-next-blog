import { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from 'iron-session/next';
import { ironOptions } from 'config/index';
import { ISession } from 'pages/api/index';
import { prepareConnection } from 'db/index';
import { User } from 'db/entity/index';
import { EXCEPTION_USER } from 'pages/api/config/codes';

export default withIronSessionApiRoute(update, ironOptions);

async function update(req: NextApiRequest, res: NextApiResponse) {
  // 从请求中获取会话对象
  const session: ISession = req.session;
  // 从会话中获取用户 ID
  const { userId } = session;
  // 从请求体中解构出用户昵称、工作和个人介绍，若未提供则使用空字符串
  const { nickname = '', job = '', introduce = '' } = req.body;
  // 准备数据库连接
  const db = await prepareConnection();
  // 获取 User 实体的存储库
  const userRepo = db.getRepository(User);

  // 根据用户 ID 查找用户
  const user = await userRepo.findOne({
    where: {
      id: Number(userId),
    },
  });

  // 如果找到用户
  if (user) {
    // 更新用户的昵称
    user.nickname = nickname;
    // 更新用户的工作信息
    user.job = job;
    // 更新用户的个人介绍
    user.introduce = introduce;

    // 保存更新后的用户信息
    const resUser = await userRepo.save(user);

    // 发送成功响应，包含更新后的用户信息
    res?.status(200)?.json({
      code: 0,
      msg: '',
      data: resUser,
    });
  } else {
    // 如果未找到用户，发送用户未找到的异常响应
    res?.status(200)?.json({
      ...EXCEPTION_USER.NOT_FOUND,
    });
  }
}
