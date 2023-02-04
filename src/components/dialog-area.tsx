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
import ChatHistory from './chat-history'

const DialogArea = () => {
  return (
    <VStack alignItems="stretch">
      <Box>
        <Heading size="md" as="h5" mb={1}>
          Dialog:
        </Heading>
        <ChatHistory></ChatHistory>
      </Box>
      <HStack>
        <Textarea placeholder="Please describe the model you want to generate."></Textarea>
        <Button colorScheme="blue">Send</Button>
      </HStack>
    </VStack>
  )
}

export default DialogArea
