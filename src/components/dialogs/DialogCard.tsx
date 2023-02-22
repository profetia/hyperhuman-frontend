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
  LightMode,
} from '@chakra-ui/react'
import ChatArea from '@/components/dialogs/ChatArea'
import ModelView from '@/components/dialogs/ModelView'
import { ChatDetail } from '@/models/user/chat'
import styles from '@/styles/dialogs.module.css'

interface Props extends ChatDetail {
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
}

export default function DialogCard(props: Props) {
  return (
    <>
      <LightMode>
        <Modal isOpen={props.isOpen} onClose={props.onClose}>
          <ModalOverlay />
          <ModalContent height={560} maxWidth={850}>
            <ModalBody p={6} className={styles['dialog-card']}>
              <Flex justify="center" height="100%">
                <Grid
                  templateRows="repeat(1, 1fr)"
                  templateColumns="repeat(2, 1fr)"
                  gap={4}
                >
                  <GridItem colSpan={1} rowSpan={1}>
                    <ModelView
                      resource={props.resource_uuid}
                      prompt={props.prompt}
                    ></ModelView>
                  </GridItem>
                  <GridItem colSpan={1} rowSpan={1}>
                    <ChatArea history={props.chat_history}></ChatArea>
                  </GridItem>
                </Grid>
              </Flex>
            </ModalBody>
          </ModalContent>
        </Modal>
      </LightMode>
    </>
  )
}
