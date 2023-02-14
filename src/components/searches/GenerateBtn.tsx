import { Button, useDisclosure } from '@chakra-ui/react'
import { useAppDispatch, useAppSelector } from '@/hooks'
import { doStartAChat } from '@/api/chat'
import {
  extendChatHistory,
  initChat,
  setChatHistory,
  setPrompt,
  setRecommend,
} from '@/stores/user/chat'
import ChatDialog from './ChatDialog'
import { useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface Props {
  prelude: string
}

enum SocketStage {
  INITIAL,
  PENDING,
  PROMPT,
  CHAT,
  RECOMMEND,
}

export default function GenerateBtn({ prelude }: Props) {
  const dispatch = useAppDispatch()
  const chat = useAppSelector((state) => state.chat)

  const allowInput = useRef(true)
  const [input, setInput] = useState<string>('')

  const [socket, setSocket] = useState<Socket | undefined>(undefined)
  const socketStep = useRef<SocketStage>(SocketStage.INITIAL)

  const onSend = (
    msg: string,
    ws: Socket | undefined = socket,
    task_uuid = chat.task_uuid
  ) => {
    if (ws && allowInput) {
      ws.emit('message', {
        content: msg,
        task_uuid: task_uuid,
        provider: 'User',
      })
      socketStep.current = SocketStage.PROMPT
      dispatch(extendChatHistory({ content: msg, provider: 'human' }))
    }
  }

  const initWebSocket = async (subscription: string, task_uuid: string) => {
    if (!socket) {
      const newSocket = await new Promise<Socket>((resolve) => {
        const newSocket = io(
          `${process.env.NEXT_PUBLIC_API_BASE as string}/chat_socket`,
          {
            query: {
              subscription: subscription,
            },
            path: '',
            transports: ['websocket', 'polling'],
          }
        )
        newSocket.on('connect', () => {
          resolve(newSocket)
        })
      })

      newSocket.on('message', (event) => {
        if (event.content === '[START]') {
          allowInput.current = false

          if (socketStep.current === SocketStage.PROMPT) {
            dispatch((dispatch, getState) => {
              dispatch(setPrompt(''))
            })
          } else if (
            socketStep.current === SocketStage.CHAT ||
            socketStep.current === SocketStage.INITIAL
          ) {
            dispatch((dispatch, getState) => {
              dispatch(extendChatHistory({ content: '', provider: 'ai' }))
            })
          } else if (socketStep.current === SocketStage.RECOMMEND) {
            dispatch((dispatch, getState) => {
              dispatch(setRecommend(''))
            })
          }
        } else if (event.content === '[END]') {
          if (socketStep.current === SocketStage.PROMPT) {
            socketStep.current = SocketStage.CHAT
          } else if (socketStep.current === SocketStage.CHAT) {
            socketStep.current = SocketStage.RECOMMEND
          } else if (
            socketStep.current === SocketStage.RECOMMEND ||
            socketStep.current === SocketStage.INITIAL
          ) {
            socketStep.current = SocketStage.PENDING
            allowInput.current = true
          }
        } else {
          if (
            typeof event === 'string' &&
            (event as string).startsWith('You said: ')
          ) {
            return
          }
          if (socketStep.current === SocketStage.PROMPT) {
            dispatch((dispatch, getState) => {
              const chat = getState().chat
              dispatch(setPrompt(chat.prompt + event.content))
            })
          } else if (
            socketStep.current === SocketStage.CHAT ||
            socketStep.current === SocketStage.INITIAL
          ) {
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
          } else if (socketStep.current === SocketStage.RECOMMEND) {
            dispatch((dispatch, getState) => {
              const chat = getState().chat
              dispatch(setRecommend(chat.recommend + event.content))
            })
          }
        }
      })

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
      setInput(prelude)
    },
  })

  return (
    <>
      <ChatDialog
        {...chat}
        input={input}
        onInput={(event) => {
          setInput(event.target.value)
        }}
        onSubmit={() => {
          if (input !== '' && allowInput.current) {
            onSend(input)
            setInput('')
          }
        }}
        isOpen={isOpen}
        onClose={onClose}
        onOpen={onOpen}
        onSend={onSend}
      ></ChatDialog>
      <Button colorScheme="blue" width={20} onClick={onOpen}>
        Generate
      </Button>
    </>
  )
}
