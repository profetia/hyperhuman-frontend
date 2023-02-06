import { Sentence } from '@/models/dialog'
import {
  Container,
  Box,
  VStack,
  HStack,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Textarea,
  Code,
  Heading,
  Button,
} from '@chakra-ui/react'
import ChatBubble from './chat-bubble'
export interface Props {
  conversation: Sentence[]
}

const DialogArea = (props: Props) => {
  return (
    <VStack alignItems="stretch">
      <Box>
        <Heading size="md" as="h5" mb={1}>
          Dialog:
        </Heading>
        <Card variant="outline" width={400}>
          <CardBody px={0}>
            {props.conversation.map((sentence, index) => {
              return (
                <ChatBubble
                  key={index}
                  message={sentence.content}
                  type={sentence.speaker}
                />
              )
            })}
            <p></p>
          </CardBody>
        </Card>
      </Box>
      <HStack>
        <Textarea placeholder="Please describe the model you want to generate."></Textarea>
        <Button colorScheme="blue">Send</Button>
      </HStack>
    </VStack>
  )
}

export default DialogArea
