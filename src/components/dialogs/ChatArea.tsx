import { Box, Card, CardBody, Heading, Text } from '@chakra-ui/react'
import ChatBubble from '@/components/dialogs/ChatBubble'
import { Sentence } from '@/models/task/detail'
import styles from '@/styles/dialogs.module.css'

interface Props {
  history: Sentence[]
}

export default function ChatArea({ history }: Props) {
  return (
    <Box>
      <Text mt={5} className={styles['chat-area-card-heading']}>
        Dialog:
      </Text>
      <Box className={styles['chat-area-card']}>
        {history.map((sentence, index) => {
          return (
            <ChatBubble
              key={index}
              message={sentence.content}
              type={sentence.provider}
            />
          )
        })}
      </Box>
    </Box>
  )
}
