import {
  Card,
  CardBody,
  CardFooter,
  Box,
  Icon,
  Image,
  Text,
  Divider,
  useDisclosure,
  Center,
  IconButton,
  Tooltip,
} from '@chakra-ui/react'

import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai'
import { TaskSession } from '@/models/task/cards'
import DialogCard from '@/components/dialogs/DialogCard'
import { TaskDetail } from '@/models/task/detail'
import { useState } from 'react'
import { doGetTaskDetail } from '@/api/task'

interface Props extends TaskSession {
  onLike: () => void
}

function getIcon(is_liked: boolean) {
  return (
    <Icon as={is_liked ? AiFillHeart : AiOutlineHeart} m={0} boxSize={6}></Icon>
  )
}

export default function ThumbnailCard(props: Props) {
  let { isOpen, onOpen, onClose } = useDisclosure({
    onOpen: () => {
      const fetchInitTaskDetail = async () => {
        setTaskDetail(await doGetTaskDetail(props.task_uuid))
      }
      fetchInitTaskDetail()
    },
  })

  const [taskDetail, setTaskDetail] = useState<TaskDetail>({
    ...props,
    chat_history: [],
    resource_url: '',
  })

  return (
    <Card maxW="sm" variant="outline">
      <Box onClick={onOpen}>
        <Image
          src={props.image_url}
          alt="media source"
          borderRadius="lg"
          objectFit="cover"
          boxSize={200}
          borderBottomRadius="0"
        />
        <CardBody px={1} py={2}>
          <Center>
            <Tooltip
              label={props.prompt}
              hasArrow
              bgColor="gray.700"
              color="gray.300"
            >
              <Text color="" fontSize="md" maxWidth={180} noOfLines={2}>
                {props.prompt}
              </Text>
            </Tooltip>
          </Center>
        </CardBody>
      </Box>
      <Divider />
      <CardFooter justifyContent="space-between" p={2} alignItems="center">
        <DialogCard
          {...taskDetail}
          isOpen={isOpen}
          onClose={onClose}
          onOpen={onOpen}
        ></DialogCard>
        <Text color="gray.400">{props.author.name}</Text>
        {/* <Text color="gray.400">{props.views} view</Text> */}
        <IconButton
          aria-label="Like"
          icon={getIcon(props.is_liked)}
          variant="ghost"
          color={props.is_liked ? 'pink.400' : ''}
          onClick={props.onLike}
          size="xs"
        ></IconButton>
      </CardFooter>
    </Card>
  )
}
