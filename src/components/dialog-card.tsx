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
                  <ModelView></ModelView>
                </GridItem>
                <GridItem colSpan={1} rowSpan={1}>
                  <DialogArea></DialogArea>
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
