import { useParams } from 'react-router';

import { ChatDocument } from '@/features/ai-chat/components/chat-document';

export default function ConversationRoute() {
  const { conversationId } = useParams();
  const parsed = Number(conversationId);
  const id = Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  return <ChatDocument conversationId={id} />;
}
