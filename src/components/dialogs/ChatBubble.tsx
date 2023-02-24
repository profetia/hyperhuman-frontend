import { useAppSelector } from '@/hooks'
import { ChatProvider } from '@/models/task/detail'
import { Stack, Text, Box, Avatar, Container } from '@chakra-ui/react'
import styles from '@/styles/dialogs.module.css'

type Props = {
  message: string
  type: ChatProvider
}

const aiAvatarUrl =
  'https://cdn0.iconfinder.com/data/icons/famous-character-vol-1-colored/48/JD-39-512.png'

export default function ChatBubble(props: Props) {
  const { profile } = useAppSelector((state) => state.user)

  const getAvatar = () => {
    if (props.type === 'Human') {
      return <Avatar name="Kent Dodds" src={profile.avatar} size="sm" />
    } else {
      return <Avatar name="Dan Abrahmov" src={aiAvatarUrl} size="sm" />
    }
  }

  return (
    <Container my={2}>
      <Stack direction={props.type === 'Human' ? 'row-reverse' : 'row'}>
        {getAvatar()}
        <Box
          py={2}
          px={4}
          className={
            styles[
              props.type === 'Human'
                ? 'chat-bubble-box-human'
                : 'chat-bubble-box-ai'
            ]
          }
        >
          <Text className={styles['chat-bubble-text']}>{props.message}</Text>
        </Box>
      </Stack>
    </Container>
  )
}
