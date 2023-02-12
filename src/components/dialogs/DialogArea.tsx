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
  Flex,
} from '@chakra-ui/react'
import ChatBubble from '@/components/dialogs/ChatBubble'
import { Sentence } from '@/models/task/detail'

interface Props {
  history: Sentence[]
}

export default function DialogArea(props: Props) {
  return (
    <Flex direction="column" justifyContent="space-between" h={'100%'}>
      <Box>
        <Heading size="md" as="h5" mb={1}>
          Dialog:
        </Heading>
        <Card variant="outline" width={400}>
          <CardBody px={0}>
            {props.history.map((sentence, index) => {
              return (
                <ChatBubble
                  key={index}
                  message={sentence.content}
                  type={sentence.provider}
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
    </Flex>
  )
}
