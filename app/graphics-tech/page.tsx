// app/graphics-tech/page.tsx

import { readCategoryData } from '@/lib/storage';
import ContentList from '@/components/ContentList';

export const revalidate = 3600;

export default async function GraphicsTechPage() {
  const data = await readCategoryData('graphics-tech');

  return (
    <ContentList
      items={data.items}
      title="图形技术 - 最新进展"
    />
  );
}
