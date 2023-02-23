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
  Text,
  Editable,
  EditableTextarea,
  EditablePreview,
  LightMode,
  Tag,
  Center,
  VStack,
} from '@chakra-ui/react'
import ChatArea from '@/components/dialogs/ChatArea'
import ModelView from '@/components/dialogs/ModelView'
import { ChatDetail } from '@/models/user/chat'
import { useScrollTrigger } from '@/models/task/detail'
import { ChangeEvent, useMemo, useState, useEffect } from 'react'
import styles from '@/styles/dialogs.module.css'

interface Props extends ChatDetail {
  recommend: string
  onSend: (msg: string) => void
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
}

function ChatInputArea(props: Props) {
  const recommendItems = useMemo(() => {
    if (props.recommend === '') return []
    return props.recommend.split(/\n[0-9]\. /)
  }, [props.recommend])

  const [input, setInput] = useState<string>('')

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
                setInput(item)
              }}
              maxWidth="200px"
              display="inline-block"
              whiteSpace={'normal'}
              colorScheme={'twitter'}
              className={styles['chat-area-recommend']}
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
          value={input}
          onChange={(event) => {
            setInput(event.target.value)
          }}
          resize="none"
          className={`${styles['chat-area-input']} ${styles['scrollbar-thin']}`}
          px={3}
          fontSize={14}
          borderRadius="24px"
          height={10}
        ></Textarea>
        <Button
          onClick={() => {
            if (input !== '') {
              props.onSend(input)
              setInput('')
            }
          }}
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
  const [localPrompt, setLocalPrompt] = useState<string>(
    'He has a great smile He has a face only a mother could love. He has got dimples. One of his eyes is bigger than the other.'
  )
  const { triggerScroll, scrollToBottom } = useScrollTrigger()

  useEffect(() => {
    setLocalPrompt(props.prompt)
  }, [props.prompt])

  const onGenerate = () => {}

  return (
    <LightMode>
      <Modal isOpen={props.isOpen} onClose={props.onClose}>
        <ModalOverlay />
        <ModalContent height={560} maxWidth={850}>
          <ModalBody pt={6} px={0} className={styles['dialog-card']}>
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
                  <VStack>
                    <Box width="100%">
                      <Text
                        className={styles['dialog-card-editable-heading']}
                        mt={4}
                        ml={7}
                        mb={2}
                      >
                        Prompt
                      </Text>
                    </Box>
                    <Editable
                      value={localPrompt}
                      onChange={(nextValue: string) => {
                        setLocalPrompt(nextValue)
                      }}
                      className={styles['dialog-card-editable-text']}
                    >
                      <EditablePreview
                        p={3}
                        className={styles['dialog-card-editable-text']}
                      />
                      <EditableTextarea
                        p={3}
                        className={styles['dialog-card-editable-text']}
                      />
                    </Editable>
                    <Button
                      mt={3}
                      onClick={onGenerate}
                      borderRadius="20px"
                      width="374px"
                      background="#4A00E0"
                      colorScheme={'purple'}
                    >
                      Generate
                    </Button>
                  </VStack>
                </GridItem>
                <GridItem colSpan={1} rowSpan={1}>
                  <Flex
                    direction="column"
                    justifyContent="space-between"
                    h={'100%'}
                  >
                    <ChatArea
                      history={props.chat_history}
                      hasInput
                      triggerScroll={triggerScroll}
                    >
                      <ChatInputArea
                        {...props}
                        onSend={(msg: string) => {
                          scrollToBottom()
                          props.onSend(msg)
                        }}
                      ></ChatInputArea>
                    </ChatArea>
                  </Flex>
                </GridItem>
              </Grid>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </LightMode>
  )
}
