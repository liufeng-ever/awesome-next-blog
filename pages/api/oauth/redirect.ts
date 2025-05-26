import { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from 'iron-session/next';
import { Cookie } from 'next-cookie';
import { ironOptions } from 'config/index';
import { ISession } from 'pages/api/index';
import { setCookie } from 'utils/index';
import { prepareConnection } from 'db/index';
import { User, UserAuth } from 'db/entity/index';
import axios from 'axios';

export default withIronSessionApiRoute(redirect, ironOptions);

// client-id：Ov23liQ6HEYsuAZFNpPm
// client-secret：633af7a7a000f879daa26c8d8cba19206a3e7934

async function redirect(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req?.query || {};
  const session: ISession = req.session;

  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  try {
    // 1. 获取 access token
    const tokenResponse = await axios({
      method: 'post',
      url: 'https://github.com/login/oauth/access_token',
      data: {
        client_id: 'Ov23liQ6HEYsuAZFNpPm',
        client_secret: '633af7a7a000f879daa26c8d8cba19206a3e7934',
        code,
      },
      headers: {
        Accept: 'application/json',
      },
    });

    const { access_token } = tokenResponse.data;

    // 2. 获取用户信息
    const userResponse = await axios({
      method: 'get',
      url: 'https://api.github.com/user',
      headers: {
        Authorization: `token ${access_token}`,
        Accept: 'application/json',
      },
    });

    const { id, login, avatar_url } = userResponse.data;

    // 3. 处理用户登录/注册
    const db = await prepareConnection();
    const userAuthRepo = db.getRepository(UserAuth);

    let userAuth = await userAuthRepo.findOne({
      where: {
        identity_type: 'github',
        identifier: id.toString(),
      },
      relations: ['user'],
    });

    if (userAuth) {
      // 更新已存在用户
      userAuth.credential = access_token;
      await userAuthRepo.save(userAuth);

      const user = userAuth.user;
      session.userId = user.id;
      session.nickname = user.nickname;
      session.avatar = user.avatar;
    } else {
      // 创建新用户
      const user = new User();
      user.nickname = login;
      user.avatar = avatar_url;
      user.job = '';
      user.introduce = '';

      // 先保存用户
      const userRepo = db.getRepository(User);
      const savedUser = await userRepo.save(user);

      // 再创建用户认证
      const newUserAuth = new UserAuth();
      newUserAuth.identity_type = 'github';
      newUserAuth.identifier = id.toString();
      newUserAuth.credential = access_token;
      newUserAuth.user = savedUser;

      const savedUserAuth = await userAuthRepo.save(newUserAuth);

      session.userId = savedUser.id;
      session.nickname = savedUser.nickname;
      session.avatar = savedUser.avatar;
    }

    await session.save();
    setCookie(Cookie.fromApiRoute(req, res), {
      id: session.userId,
      nickname: session.nickname,
      avatar: session.avatar,
    });

    res.writeHead(302, { Location: '/' });
    res.end();
  } catch (error) {
    console.error('GitHub OAuth Error:', error);
    res.status(500).json({ error: 'Failed to process GitHub login' });
  }
}
