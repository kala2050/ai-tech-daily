// app/agent-tech/page.tsx

import { readCategoryData } from '@/lib/storage';
import ContentList from '@/components/ContentList';

export const revalidate = 3600;

export default async function AgentTechPage() {
  const data = await readCategoryData('agent-tech');

  return (
    <ContentList
      items={data.items}
      title="智能体技术 - 最新进展"
    />
  );
}
