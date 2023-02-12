import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Flex,
  Grid,
  GridItem,
} from '@chakra-ui/react'
import DialogArea from '@/components/dialogs/DialogArea'
import ModelView from '@/components/dialogs/ModelView'
import { ChatDetail } from '@/models/user/chat'

interface Props extends ChatDetail {
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
}

export default function DialogCard(props: Props) {
  return (
    <>
      <Modal isOpen={props.isOpen} onClose={props.onClose}>
        <ModalOverlay />
        <ModalContent maxWidth={800} minHeight={496}>
          <ModalHeader>View Model</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex justify="center" height="100%">
              <Grid
                templateRows="repeat(1, 1fr)"
                templateColumns="repeat(2, 1fr)"
              >
                <GridItem colSpan={1} rowSpan={1}>
                  <ModelView
                    resource_url={props.resource_url}
                    prompt={props.prompt}
                  ></ModelView>
                </GridItem>
                <GridItem colSpan={1} rowSpan={1}>
                  <DialogArea history={props.chat_history}></DialogArea>
                </GridItem>
              </Grid>
            </Flex>
          </ModalBody>
          <ModalFooter></ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
