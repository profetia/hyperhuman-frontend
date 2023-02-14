import { Button, useDisclosure } from '@chakra-ui/react'
import { useAppDispatch, useAppSelector } from '@/hooks'
import { doStartAChat } from '@/api/chat'
import { extendChatHistory, initChat, setChatHistory } from '@/stores/user/chat'
import ChatDialog from './ChatDialog'
import { useEffect, useMemo, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface Props {
  prelude: string
}

export default function GenerateBtn({ prelude }: Props) {
  const dispatch = useAppDispatch()
  const chat = useAppSelector((state) => state.chat)
  const [socket, setSocket] = useState<Socket | undefined>(undefined)
  let [allowInput, setAllowInput] = useState<boolean>(true)
  let [latestMessage, setLatestMessage] = useState<string>('')

  const onSend = (msg: string) => {
    if (socket && allowInput) {
      socket.emit('send', {
        content: msg,
        task_uuid: chat.task_uuid,
        provider: 'User',
      })
      dispatch(extendChatHistory({ content: msg, provider: 'human' }))
    }
  }

  const initWebSocket = async (subscription: string, task_uuid: string) => {
    if (!socket) {
      const newSocket = await new Promise<Socket>((resolve) => {
        const newSocket = io(
          `http://${process.env.NEXT_PUBLIC_API_BASE as string}/chat_socket`,
          {
            query: {
              subscription: subscription,
            },
            path: '',
            transports: ['websocket', 'polling'],
          }
        )
        newSocket.on('connect', () => {
          console.log('connect')
          resolve(newSocket)
        })
        newSocket.on('connect_error', (event) => {
          console.log('connect_error', event)
        })
      })

      newSocket.on('message', (event) => {
        if (event.content === '[START]') {
          setAllowInput(() => false)
          dispatch((dispatch, getState) => {
            dispatch(extendChatHistory({ content: '', provider: 'ai' }))
          })
        } else if (event.content === '[END]') {
          setAllowInput(() => true)
        } else {
          dispatch((dispatch, getState) => {
            const chat = getState().chat
            dispatch(
              setChatHistory([
                ...chat.chat_history.slice(0, -1),
                {
                  content:
                    chat.chat_history[chat.chat_history.length - 1].content +
                    event.content,
                  provider: 'ai',
                },
              ])
            )
          })
        }
      })

      newSocket.emit('send', {
        content: prelude,
        task_uuid: task_uuid,
        provider: 'User',
      })
      dispatch(extendChatHistory({ content: prelude, provider: 'human' }))

      setSocket(newSocket)
    }
  }

  const { isOpen, onClose, onOpen } = useDisclosure({
    onOpen: () => {
      if (chat.task_uuid === '') {
        const fetchInitChat = async () => {
          const { subscription, task_uuid } = await doStartAChat()
          await initWebSocket(subscription, task_uuid)
          dispatch(initChat({ subscription, task_uuid }))
        }
        fetchInitChat()
      }
    },
  })

  return (
    <>
      <ChatDialog
        {...chat}
        isOpen={isOpen}
        onClose={onClose}
        onOpen={onOpen}
        onSend={onSend}
      ></ChatDialog>
      <Button
        colorScheme="blue"
        width={20}
        onClick={() => {
          if (prelude !== '') {
            onOpen()
          }
        }}
      >
        Generate
      </Button>
    </>
  )
}
