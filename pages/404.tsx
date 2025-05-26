import Image from 'next/image';
import SEO from 'components/SEO';

export default function Custom404() {
  return (
    <>
      <SEO
        title="404 - 页面未找到 - 我的博客"
        description="抱歉，您访问的页面不存在"
      />
      <Image src="/images/404.jpg" alt="404" layout="fill" />
    </>
  );
}
