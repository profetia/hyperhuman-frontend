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

const DialogArea = () => {
  return (
    <VStack alignItems="stretch">
      <Box>
        <Heading size="md" as="h5" mb={1}>
          Dialog:
        </Heading>
        <Card variant="outline">
          <CardBody>
            <p>AI: Hello, how can I help you?</p>
            <p>Human: I want fried chips.</p>
            <p>AI: sorry, please describe the model you want to generate.</p>
            <p>Human: Well, a normal man, please.</p>
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
