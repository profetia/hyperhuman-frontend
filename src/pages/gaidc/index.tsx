import Head from 'next/head'
import Image from 'next/image'
import { Inter } from '@next/font/google'
import styles from '@/styles/Home.module.css'
import SearchBar from '@/components/searches/SearchBar'
import Session from '@/components/cards/Section'
import {
  Center,
  HStack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useDisclosure,
  VStack,
} from '@chakra-ui/react'
import NavBar from '@/components/navigators/NavBar'
import { useEffect, useRef, useState } from 'react'
import { initTaskSessions } from '@/stores/task/section'
import { useAppDispatch, useAppSelector } from '@/hooks'
import { doGetTaskCards } from '@/api/task'
import ChatDialog from '@/components/searches/ChatDialog'
import {
  extendChatHistory,
  initChat,
  setChatHistory,
  setPrompt,
  setRecommend,
} from '@/stores/user/chat'
import { io, Socket } from 'socket.io-client'
import { doStartAChat } from '@/api/chat'
import { useRouter } from 'next/router'

const inter = Inter({ subsets: ['latin'] })

export default function Share() {
  const dispatch = useAppDispatch()
  const chat = useAppSelector((state) => state.chat)
  const router = useRouter()

  const isCanceled = useRef(false)

  const [socket, setSocket] = useState<Socket | undefined>(undefined)

  const onSend = (
    msg: string,
    ws: Socket | undefined = socket,
    task_uuid = chat.task_uuid
  ) => {
    if (ws) {
      if (!isCanceled.current) {
        isCanceled.current = true
      }
      ws.emit('message', {
        content: msg,
        task_uuid: task_uuid,
        provider: 'User',
      })
      dispatch((dispatch, getState) => {
        dispatch(extendChatHistory({ content: msg, provider: 'Human' }))
        dispatch(setPrompt(''))
        dispatch(setRecommend(''))
      })
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

      newSocket.on('AI Assistant', (event) => {
        if (event.content === '[START]') {
          dispatch((dispatch, getState) => {
            dispatch(extendChatHistory({ content: '', provider: 'AI' }))
          })
        } else if (event.content === '[END]') {
          isCanceled.current = false
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
                  provider: 'AI',
                },
              ])
            )
          })
        }
      })

      newSocket.on('summary', (event) => {
        if (event.content === '[START]') {
          dispatch((dispatch, getState) => {
            dispatch(setPrompt(''))
          })
        } else if (event.content === '[END]') {
          isCanceled.current = false
        } else if (!isCanceled.current) {
          dispatch((dispatch, getState) => {
            const chat = getState().chat
            dispatch(setPrompt(chat.prompt + event.content))
          })
        }
      })

      newSocket.on('guess', (event) => {
        if (event.content === '[START]') {
          dispatch((dispatch, getState) => {
            dispatch(setRecommend(''))
          })
        } else if (event.content === '[END]') {
          isCanceled.current = false
        } else if (!isCanceled.current) {
          dispatch((dispatch, getState) => {
            const chat = getState().chat
            dispatch(setRecommend(chat.recommend + event.content))
          })
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
    },
    onClose: () => {
      router.push('/')
    },
  })

  useEffect(() => {
    onOpen()
  }, [onOpen])

  return (
    <>
      <Head>
        <title>DreamFace</title>
        <meta name="description" content="Hyperhuman" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <NavBar></NavBar>
      <ChatDialog
        onSend={onSend}
        isOpen={isOpen}
        onClose={onClose}
        onOpen={onOpen}
      ></ChatDialog>
    </>
  )
}