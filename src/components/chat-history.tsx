import { VStack, Card, CardBody } from '@chakra-ui/react'
import ChatBubble from './chat-bubble'

const ChatHistory = () => {
  return (
    <Card variant="outline" width={400}>
      <CardBody px={0}>
        <ChatBubble message="Hello, how can I help you?" type="ai" />
        <ChatBubble message="I want fried chips." type="human" />
        <ChatBubble
          message="sorry, please describe the model you want to generate."
          type="ai"
        />
        <ChatBubble message="Well, a normal man, please." type="human" />
        <p></p>
      </CardBody>
    </Card>
  )
}

export default ChatHistory
