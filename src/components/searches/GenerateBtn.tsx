import { Button, useDisclosure } from '@chakra-ui/react'
import DialogCard from '@/components/dialogs/DialogCard'
import { useAppDispatch, useAppSelector } from '@/hooks'
import { startAChat } from '@/api/chat'
import { initChat } from '@/stores/user/chat'

interface Props {
  prelude: string
}

export default function GenerateBtn() {
  const dispatch = useAppDispatch()

  const { isOpen, onClose, onOpen } = useDisclosure({
    onOpen: () => {
      const { subscription, task_uuid } = startAChat()
      dispatch(initChat({ subscription, task_uuid }))
    },
  })

  const chat = useAppSelector((state) => state.chat)

  return (
    <>
      <DialogCard
        {...chat}
        isOpen={isOpen}
        onClose={onClose}
        onOpen={onOpen}
      ></DialogCard>
      <Button colorScheme="blue" width={20} onClick={onOpen}>
        Generate
      </Button>
    </>
  )
}
