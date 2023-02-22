import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Box,
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
  Editable,
  EditableTextarea,
  EditablePreview,
  LightMode,
  Tag,
} from '@chakra-ui/react'
import ChatArea from '@/components/dialogs/ChatArea'
import ModelView from '@/components/dialogs/ModelView'
import { ChatDetail } from '@/models/user/chat'
import { ChangeEvent, useMemo, useState, useEffect } from 'react'
import styles from '@/styles/dialogs.module.css'

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

function ChatInputArea(props: Props) {
  const recommendItems = useMemo(() => {
    if (props.recommend === '') return []
    return props.recommend.split(/\n[0-9]\. /)
  }, [props.recommend])

  return (
    <Box mx={3}>
      <Box
        overflowX={'scroll'}
        whiteSpace="nowrap"
        className={styles['scrollbar-thin']}
        maxWidth="340px"
        position="absolute"
        bottom="90px"
      >
        {recommendItems.map((item, index) => {
          return (
            <Tag
              key={index}
              m={1}
              p={2}
              onClick={() => {
                props.onSend(item)
              }}
              maxWidth="200px"
              display="inline-block"
              whiteSpace={'normal'}
              colorScheme={'twitter'}
            >
              {item}
            </Tag>
          )
        })}
      </Box>
      <HStack>
        <Textarea
          rows={1}
          placeholder="Please describe the model you want..."
          variant={'outlined'}
          value={props.input}
          onChange={props.onInput}
          resize="none"
          className={`${styles['chat-area-input']} ${styles['scrollbar-thin']}`}
          px={3}
          fontSize={14}
          borderRadius="24px"
          height={10}
        ></Textarea>
        <Button
          onClick={props.onSubmit}
          borderRadius="20px"
          background="#4A00E0"
          colorScheme={'purple'}
        >
          Send
        </Button>
      </HStack>
    </Box>
  )
}

export default function ChatDialog(props: Props) {
  const [localPrompt, setLocalPrompt] = useState<string>('')

  useEffect(() => {
    setLocalPrompt(props.prompt)
  }, [props.prompt])

  return (
    <LightMode>
      <Modal isOpen={props.isOpen} onClose={props.onClose}>
        <ModalOverlay />
        <ModalContent height={560} maxWidth={850}>
          <ModalBody p={6} className={styles['dialog-card']}>
            <Flex justify="center" height="100%">
              <Grid
                templateRows="repeat(1, 1fr)"
                templateColumns="repeat(2, 1fr)"
              >
                <GridItem
                  colSpan={1}
                  rowSpan={1}
                  className={styles['model-view-environment-box']}
                >
                  <Editable
                    value={localPrompt}
                    onChange={(nextValue: string) => {
                      setLocalPrompt(nextValue)
                    }}
                    className={styles['dialog-card-editable-text']}
                  >
                    <EditablePreview />
                    <EditableTextarea />
                  </Editable>
                </GridItem>
                <GridItem colSpan={1} rowSpan={1}>
                  <Flex
                    direction="column"
                    justifyContent="space-between"
                    h={'100%'}
                  >
                    <ChatArea history={props.chat_history} hasInput>
                      <ChatInputArea {...props}></ChatInputArea>
                    </ChatArea>
                  </Flex>
                </GridItem>
              </Grid>
            </Flex>
          </ModalBody>
          <ModalFooter></ModalFooter>
        </ModalContent>
      </Modal>
    </LightMode>
  )
}
