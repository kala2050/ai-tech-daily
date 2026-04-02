// app/graphics-tech/page.tsx

import { readCategoryData } from '@/lib/storage';
import ContentList from '@/components/ContentList';

// 禁用静态生成，使用动态渲染
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function GraphicsTechPage() {
  const data = await readCategoryData('graphics-tech');

  return (
    <ContentList
      items={data.items}
      title="图形技术 - 最新进展"
    />
  );
}
