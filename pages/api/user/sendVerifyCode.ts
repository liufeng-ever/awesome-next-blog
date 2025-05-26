import { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from 'iron-session/next';
import { format } from 'date-fns';
import md5 from 'md5';
import { encode } from 'js-base64';
import request from 'service/fetch';
import { ISession } from 'pages/api/index';
import { ironOptions } from 'config/index';


export default withIronSessionApiRoute(sendVerifyCode, ironOptions);
//  TODO短信服务换掉
async function sendVerifyCode(req: NextApiRequest, res: NextApiResponse) {
  // 从请求中获取会话对象
  const session: ISession = req.session;
  // 从请求体中解构出接收验证码的目标和模板 ID，默认模板 ID 为 '1'
  const { to = '', templateId = '1' } = req.body;
  // 云通讯平台的 App ID
  const AppId = '8aaf07087d7fb5f6017d950ce83f04e1';
  // 云通讯平台的账户 ID
  const AccountId = '8aaf07087d7fb5f6017d950ce72c04da';
  // 云通讯平台的认证令牌
  const AuthToken = '91725ff244364cda9f1e1ea7d471e124';
  // 格式化当前日期为 'yyyyMMddHHmmss' 格式
  const NowDate = format(new Date(), 'yyyyMMddHHmmss');
  // 根据账户 ID、认证令牌和当前日期生成签名参数的 MD5 哈希值
  const SigParameter = md5(`${AccountId}${AuthToken}${NowDate}`);
  // 对账户 ID 和当前日期进行 Base64 编码，用于请求头的授权信息
  const Authorization = encode(`${AccountId}:${NowDate}`);
  // 生成 1000 到 9999 之间的随机验证码
  const verifyCode = Math.floor(Math.random() * (9999 - 1000)) + 1000;
  // 验证码的过期时间（分钟）
  const expireMinute = '5';
  // 构建发送验证码请求的 URL
  const url = `https://app.cloopen.com:8883/2013-12-26/Accounts/${AccountId}/SMS/TemplateSMS?sig=${SigParameter}`;

  // 发送 POST 请求到云通讯平台以发送验证码
  const response = await request.post(
    url,
    {
      to,
      templateId,
      appId: AppId,
      datas: [verifyCode, expireMinute],
    },
    {
      headers: {
        Authorization,
      },
    }
  );


  console.log(verifyCode);
  
  console.log(response);

  const { statusCode, templateSMS, statusMsg } = response as any;

  // 如果状态码为 '000000'，表示验证码发送成功
  if (statusCode === '000000') {
    // 将验证码存储到会话中
    session.verifyCode = verifyCode;
    // 保存会话
    await session.save();
    // 发送成功响应
    res.status(200).json({
      code: 0,
      msg: statusMsg,
      data: {
        templateSMS
      }
    });
  } else {
    // 发送失败响应
    res.status(200).json({
      code: statusCode,
      msg: statusMsg
    });
  }
}
