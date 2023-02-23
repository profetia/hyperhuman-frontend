import {
  Box,
  Card,
  CardBody,
  Heading,
  propNames,
  Text,
  VStack,
} from '@chakra-ui/react'
import ChatBubble from '@/components/dialogs/ChatBubble'
import { Sentence } from '@/models/task/detail'
import styles from '@/styles/dialogs.module.css'
import React, { useEffect } from 'react'

interface Props {
  history: Sentence[]
  hasInput?: boolean
  children?: React.ReactNode
  triggerScroll?: number
}

export default function ChatArea(props: Props) {
  const messageEnd = React.createRef<HTMLDivElement>()
  const scrollToBottom = () => {
    messageEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }
  useEffect(() => {
    if (props.triggerScroll) {
      scrollToBottom()
    }
  }, [props.triggerScroll])
  return (
    <Box>
      <Text mt={5} className={styles['chat-area-card-heading']}>
        Dialog:
      </Text>
      <Box className={styles['chat-area-card']}>
        <Box
          className={`${styles['chat-bubble-wrapper']} ${styles['scrollbar-thick']}`}
        >
          {props.history.map((sentence, index) => {
            return (
              <ChatBubble
                key={index}
                message={sentence.content}
                type={sentence.provider}
              />
            )
          })}
          <Box
            className={styles['chat-bubble-placeholder']}
            ref={messageEnd}
          ></Box>
        </Box>
        {props.hasInput ? <Box width="100%">{props.children}</Box> : null}
      </Box>
    </Box>
  )
}
