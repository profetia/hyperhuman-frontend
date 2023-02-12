import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Flex,
  Grid,
  GridItem,
  Textarea,
  HStack,
  Button,
} from '@chakra-ui/react'
import ChatArea from '@/components/dialogs/ChatArea'
import ModelView from '@/components/dialogs/ModelView'
import { ChatDetail } from '@/models/user/chat'
import { useAppSelector } from '@/hooks'
import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface Props extends ChatDetail {
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
}

export default function ChatDialog(props: Props) {
  const chat = useAppSelector((state) => state.chat)

  const [socket, setSocket] = useState<Socket | undefined>(undefined)

  useEffect(() => {
    console.log('hi')
    if (!socket && chat.subscription) {
      const newSocket = io(chat.subscription)
      newSocket.on('connect', () => {
        console.log(newSocket.id)
      })
      newSocket.on('disconnect', () => {
        console.log(newSocket.id)
      })
      newSocket.on('connect_error', () => {
        console.log('Connection failed')
      })

      newSocket.on('data', (event) => {
        console.log(event)
      })
      console.log(newSocket)
      setSocket(socket)
      return () => {
        newSocket.close()
      }
    }
  }, [chat.subscription, socket])

  return (
    <>
      <Modal isOpen={props.isOpen} onClose={props.onClose}>
        <ModalOverlay />
        <ModalContent maxWidth={800} minHeight={496}>
          <ModalHeader>View Model</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex justify="center" height="100%">
              <Grid
                templateRows="repeat(1, 1fr)"
                templateColumns="repeat(2, 1fr)"
              >
                <GridItem colSpan={1} rowSpan={1}>
                  <ModelView
                    resource_url={props.resource_url}
                    prompt={props.prompt}
                  ></ModelView>
                </GridItem>
                <GridItem colSpan={1} rowSpan={1}>
                  <Flex
                    direction="column"
                    justifyContent="space-between"
                    h={'100%'}
                  >
                    <ChatArea history={chat.chat_history}></ChatArea>
                    <HStack>
                      <Textarea placeholder="Please describe the model you want to generate."></Textarea>
                      <Button colorScheme="blue">Send</Button>
                    </HStack>
                  </Flex>
                </GridItem>
              </Grid>
            </Flex>
          </ModalBody>
          <ModalFooter></ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
