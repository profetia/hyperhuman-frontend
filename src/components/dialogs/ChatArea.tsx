import { Box, Card, CardBody, Heading } from '@chakra-ui/react'
import ChatBubble from '@/components/dialogs/ChatBubble'
import { Sentence } from '@/models/task/detail'

interface Props {
  history: Sentence[]
}

export default function ChatArea({ history }: Props) {
  return (
    <Box>
      <Heading size="md" as="h5" mb={1}>
        Dialog:
      </Heading>
      <Card variant="outline" width={400}>
        <CardBody px={0}>
          {history.map((sentence, index) => {
            return (
              <ChatBubble
                key={index}
                message={sentence.content}
                type={sentence.provider}
              />
            )
          })}
        </CardBody>
      </Card>
    </Box>
  )
}
