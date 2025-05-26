import { withIronSessionApiRoute } from 'iron-session/next';
import { Cookie } from 'next-cookie';
import { ironOptions } from 'config/index';
import { ISession } from 'pages/api/index';
import { setCookie } from 'utils/index';
import { prepareConnection } from 'db/index';
import { User, UserAuth } from 'db/entity/index';
import { NextApiRequest, NextApiResponse } from 'next';
export default withIronSessionApiRoute(login, ironOptions);

async function login(req: NextApiRequest, res: NextApiResponse) {
  // 从请求中获取会话对象
  const session: ISession = req.session;
  // 从请求和响应中创建 cookie 处理对象
  const cookies = Cookie.fromApiRoute(req, res);
  // 从请求体中解构出手机号、验证码和身份类型，默认身份类型为 'phone'
  const { phone = '', verify = '', identity_type = 'phone' } = req.body;
  // 准备数据库连接
  const db = await prepareConnection();
  // 获取 UserAuth 实体的存储库
  const userAuthRepo = db.getRepository(UserAuth);

  // 检查会话中的验证码和用户输入的验证码是否一致
  if (String(session.verifyCode) === String(verify)) {
    // 验证码正确，在 user_auths 表中查找 identity_type 是否有记录
    const userAuth = await userAuthRepo.findOne(
      {
        identity_type,
        identifier: phone,
      },
      {
        // 关联查询 user 表
        relations: ['user'],
      }
    );

    if (userAuth) {
      // 已存在的用户
      const user = userAuth.user;
      // 解构出用户的 ID、昵称和头像
      const { id, nickname, avatar } = user;

      // 将用户信息存储到会话中
      session.userId = id;
      session.nickname = nickname;
      session.avatar = avatar;

      // 保存会话
      await session.save();

      // 设置 cookie
      setCookie(cookies, { id, nickname, avatar });

      // 发送登录成功的响应
      res?.status(200).json({
        code: 0,
        msg: '登录成功',
        data: {
          userId: id,
          nickname,
          avatar,
        },
      });
    } else {
      // 新用户，自动注册
      const user = new User();
      // 生成随机昵称
      user.nickname = `用户_${Math.floor(Math.random() * 10000)}`;
      // 设置默认头像
      user.avatar = '/images/avatar.jpg';
      // 设置默认职业
      user.job = '暂无';
      // 设置默认介绍
      user.introduce = '暂无';

      const userAuth = new UserAuth();
      // 设置用户认证的标识符为手机号
      userAuth.identifier = phone;
      // 设置身份类型
      userAuth.identity_type = identity_type;
      // 设置凭证为验证码
      userAuth.credential = session.verifyCode;
      // 关联用户实体
      userAuth.user = user;

      // 保存用户认证信息到数据库
      const resUserAuth = await userAuthRepo.save(userAuth);
      // 解构出用户的 ID、昵称和头像
      const {
        user: { id, nickname, avatar },
      } = resUserAuth;

      // 将用户信息存储到会话中
      session.userId = id;
      session.nickname = nickname;
      session.avatar = avatar;

      // 保存会话
      await session.save();

      // 设置 cookie
      setCookie(cookies, { id, nickname, avatar });

      // 发送登录成功的响应
      res?.status(200).json({
        code: 0,
        msg: '登录成功',
        data: {
          userId: id,
          nickname,
          avatar,
        },
      });
    }
  } else {
    // 验证码错误，发送错误响应
    res?.status(200).json({ code: -1, msg: '验证码错误' });
  }
}
