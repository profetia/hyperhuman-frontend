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
  Code,
} from '@chakra-ui/react'
import ChatArea from '@/components/dialogs/ChatArea'
import ModelView from '@/components/dialogs/ModelView'
import { ChatDetail } from '@/models/user/chat'
import { ChangeEvent } from 'react'

interface Props extends ChatDetail {
  recommend: string
  input: string
  onInput: (event: ChangeEvent<HTMLTextAreaElement>) => void
  onSubmit: () => void
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  onSend: (msg: string) => void
}

export default function ChatDialog(props: Props) {
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
                    <Code>{props.prompt}</Code>
                    <Code mt={1}>{props.recommend}</Code>
                    <HStack>
                      <Textarea
                        placeholder="Please describe the model you want to generate."
                        value={props.input}
                        onChange={props.onInput}
                      ></Textarea>
                      <Button colorScheme="blue" onClick={props.onSubmit}>
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
