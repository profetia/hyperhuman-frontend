import { useAppSelector } from '@/hooks'
import { ChatProvider } from '@/models/task/detail'
import { Stack, Tag, Avatar, Container } from '@chakra-ui/react'

type Props = {
  message: string
  type: ChatProvider
}

const aiAvatarUrl =
  'https://cdn0.iconfinder.com/data/icons/famous-character-vol-1-colored/48/JD-39-512.png'

export default function ChatBubble(props: Props) {
  const { profile } = useAppSelector((state) => state.user)

  const getAvatar = () => {
    if (props.type === 'human') {
      return <Avatar name="Kent Dodds" src={profile.avatar_url} size="md" />
    } else {
      return <Avatar name="Dan Abrahmov" src={aiAvatarUrl} size="md" />
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
