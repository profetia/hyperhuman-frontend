import { Button, useDisclosure } from '@chakra-ui/react'
import { useAppDispatch, useAppSelector } from '@/hooks'
import { startAChat } from '@/api/chat'
import { initChat } from '@/stores/user/chat'
import ChatDialog from './ChatDialog'

interface Props {
  prelude: string
}

export default function GenerateBtn({ prelude }: Props) {
  const dispatch = useAppDispatch()
  const chat = useAppSelector((state) => state.chat)

  const { isOpen, onClose, onOpen } = useDisclosure({
    onOpen: () => {
      if (chat.task_uuid === '') {
        const { subscription, task_uuid } = startAChat()
        dispatch(initChat({ subscription, task_uuid, prelude }))
      }
    },
  })

  return (
    <>
      <ChatDialog
        {...chat}
        isOpen={isOpen}
        onClose={onClose}
        onOpen={onOpen}
      ></ChatDialog>
      <Button
        colorScheme="blue"
        width={20}
        onClick={() => {
          if (prelude !== '') {
            onOpen()
          }
        }}
      >
        Generate
      </Button>
    </>
  )
}
