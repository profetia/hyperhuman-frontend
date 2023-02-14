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
import { useState } from 'react'

interface Props extends ChatDetail {
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  onSend: (msg: string) => void
}

export default function ChatDialog(props: Props) {
  const [input, setInput] = useState<string>('')

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
                    <ChatArea history={props.chat_history}></ChatArea>
                    <HStack>
                      <Textarea
                        placeholder="Please describe the model you want to generate."
                        value={input}
                        onChange={(e) => {
                          setInput(e.target.value)
                        }}
                      ></Textarea>
                      <Button
                        colorScheme="blue"
                        onClick={() => {
                          if (input) {
                            props.onSend(input)
                            setInput('')
                          }
                        }}
                      >
                        Send
                      </Button>
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
