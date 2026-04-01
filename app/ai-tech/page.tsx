// app/ai-tech/page.tsx

import { readCategoryData } from '@/lib/storage';
import ContentList from '@/components/ContentList';

export const revalidate = 3600;

export default async function AITechPage() {
  const data = await readCategoryData('ai-tech');

  return (
    <ContentList
      items={data.items}
      title="AI 技术 - 最新进展"
    />
  );
}
