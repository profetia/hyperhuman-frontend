import { Dialog, exampleDialog } from '@/models/dialog'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  useDisclosure,
  Box,
  Flex,
  HStack,
  Image,
  Divider,
  Center,
  Grid,
  GridItem,
} from '@chakra-ui/react'
import DialogArea from './dialog-area'
import ModelView from './model-view'

type Props = {
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
}

const DialogCard = (props: Props) => {
  const dialog: Dialog = exampleDialog

  return (
    <>
      <Modal isOpen={props.isOpen} onClose={props.onClose}>
        <ModalOverlay />
        <ModalContent maxWidth={800}>
          <ModalHeader>View Model</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex justify="center">
              <Grid
                templateRows="repeat(1, 1fr)"
                templateColumns="repeat(2, 1fr)"
              >
                <GridItem colSpan={1} rowSpan={1}>
                  <ModelView
                    modelSource={dialog.modelSource}
                    prompt={dialog.prompt}
                  ></ModelView>
                </GridItem>
                <GridItem colSpan={1} rowSpan={1}>
                  <DialogArea conversation={dialog.conversation}></DialogArea>
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

export default DialogCard
