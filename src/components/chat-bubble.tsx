import { Stack, Tag, Avatar, Container } from '@chakra-ui/react'

type Props = {
  message: string
  type: 'human' | 'ai'
}

const ChatBubble = (props: Props) => {
  const getAvatar = () => {
    if (props.type === 'human') {
      return <Avatar name="Kent Dodds" src="https://bit.ly/kent-c-dodds" />
    } else {
      return <Avatar name="Dan Abrahmov" src="https://bit.ly/dan-abramov" />
    }
  }

  return (
    <Container my={2}>
      <Stack direction={props.type === 'human' ? 'row-reverse' : 'row'}>
        {getAvatar()}
        <Tag
          size="lg"
          colorScheme={props.type === 'human' ? 'blue' : 'green'}
          py={1}
        >
          {props.message}
        </Tag>
      </Stack>
    </Container>
  )
}

export default ChatBubble
