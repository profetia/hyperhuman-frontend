import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Card,
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
import { ChatDetail, GenerateProgress, GenerateStep } from '@/models/user/chat'
import { useScrollTrigger } from '@/models/task/detail'
import {
  ChangeEvent,
  useMemo,
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react'
import autosize from 'autosize'
import styles from '@/styles/dialogs.module.css'
import { useAppDispatch, useAppSelector } from '@/hooks'
import { doGenerateModel, doGetGenerateProgress } from '@/api/chat'
import { setPrompt } from '@/stores/user/chat'
import { TaskDetail } from '@/models/task/detail'
import { doGetTaskDetail } from '@/api/task'

interface InputProps {
  onSend: (msg: string) => void
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  setMessages: (messages: string) => void
  messages: string
}

function ChatInputArea(props: InputProps) {
  const chat = useAppSelector((state) => state.chat)

  const recommendItems = useMemo(() => {
    if (chat.recommend === '') return []
    return chat.recommend.split(/\n[0-9]\./).map((item) => item.trim())
  }, [chat.recommend])

  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    // console.log('TextArea height changed')
    if (textAreaRef.current) {
      autosize(textAreaRef.current)
      return () => {
        if (textAreaRef.current) {
          autosize.destroy(textAreaRef.current)
        }
      }
    }
  }, [props.messages])

  return (
    <Box mx={3}>
      <Box
        overflowX={'scroll'}
        whiteSpace="nowrap"
        className={styles['scrollbar-thin']}
        maxWidth="340px"
        // position="absolute"
        // bottom="90px"
      >
        {recommendItems.map((item, index) => {
          return (
            <Card
              key={index}
              m={1}
              p={2}
              onClick={() => {
                props.setMessages(item)
              }}
              maxWidth="200px"
              height={'100%'}
              display="inline-block"
              whiteSpace={'normal'}
              className={styles['chat-area-recommend']}
            >
              {item}
            </Card>
          )
        })}
      </Box>
      <HStack>
        <Textarea
          ref={textAreaRef}
          placeholder="A face of..."
          variant={'outlined'}
          value={props.messages}
          onChange={(event) => {
            props.setMessages(event.target.value)
          }}
          transition="height none"
          minHeight={'40px'}
          maxHeight={'100px'}
          resize="none"
          className={`${styles['chat-area-input']} ${styles['scrollbar-thin']}`}
          px={3}
          fontSize={14}
          borderRadius="24px"
        ></Textarea>
        <Button
          onClick={() => {
            if (props.messages !== '') {
              props.onSend(props.messages)
              props.setMessages('')
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

interface Props {
  onSend: (msg: string) => void
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
}

export default function ChatDialog(props: Props) {
  const chat = useAppSelector((state) => state.chat)
  const dispatch = useAppDispatch()

  const generateInterval = useRef<number | undefined>(undefined)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateStage, setGenerateStage] = useState<
    GenerateProgress | undefined
  >(undefined)
  const [taskDetail, setTaskDetail] = useState<TaskDetail | undefined>(
    undefined
  )
  const { triggerScroll, scrollToBottom } = useScrollTrigger()
  const [messages, setMessages] = useState<string>('')

  const onGenerate = async () => {
    setIsGenerating(true)
    setGenerateStage(undefined)
    await doGenerateModel(chat.task_uuid, chat.prompt)
    generateInterval.current = window.setInterval(async () => {
      const progress = await doGetGenerateProgress(chat.task_uuid)
      if (progress.stage === GenerateStep.DONE) {
        setIsGenerating(false)
        clearInterval(generateInterval.current)
        const newTaskDetail = await doGetTaskDetail(chat.task_uuid)
        setTaskDetail(newTaskDetail)
      }
      setGenerateStage(progress)
    }, 1000)
  }

  const getModelView = () => {
    if (isGenerating) {
      return (
        <Center>
          <Text>Generating...</Text>
          {generateStage && (
            <Text>
              {generateStage.stage} {generateStage.waiting_num}
              {generateStage.estimate_time}
            </Text>
          )}
        </Center>
      )
    } else if (taskDetail) {
      return <ModelView {...taskDetail}></ModelView>
    } else {
      return (
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
      )
    }
  }

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
                    {taskDetail ? null : (
                      <>
                        <Box width="100%">
                          <Text
                            className={styles['dialog-card-editable-heading']}
                            mt={5}
                          >
                            Prompt
                          </Text>
                        </Box>
                        <Editable
                          value={chat.prompt}
                          isDisabled={isGenerating}
                          onChange={(nextValue: string) => {
                            dispatch(setPrompt(nextValue))
                          }}
                          className={styles['dialog-card-editable-text']}
                          resize="none"
                        >
                          <EditablePreview
                            p={3}
                            resize="none"
                            className={`${styles['dialog-card-editable-text']} ${styles['scrollbar-thick']}`}
                          />
                          <EditableTextarea
                            p={3}
                            resize="none"
                            className={`${styles['dialog-card-editable-text']} ${styles['scrollbar-thick']}`}
                          />
                        </Editable>
                      </>
                    )}
                    {getModelView()}
                  </VStack>
                </GridItem>
                <GridItem colSpan={1} rowSpan={1}>
                  <Flex
                    direction="column"
                    justifyContent="space-between"
                    height={'100%'}
                  >
                    <ChatArea
                      history={chat.chat_history}
                      recommend={chat.recommend}
                      messages={messages}
                      hasInput
                      triggerScroll={triggerScroll}
                      disable={isGenerating || taskDetail}
                    >
                      {taskDetail || isGenerating ? null : (
                        <ChatInputArea
                          {...props}
                          messages={messages}
                          setMessages={setMessages}
                          onSend={(msg: string) => {
                            if (msg === '') return
                            scrollToBottom()
                            props.onSend(msg)
                          }}
                        ></ChatInputArea>
                      )}
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
