import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Box,
  Icon,
  Image,
  VStack,
  Heading,
  Text,
  Divider,
  ButtonGroup,
  Button,
  useDisclosure,
  Wrap,
  HStack,
  Center,
} from '@chakra-ui/react'
import DialogCard from './dialog-card'
import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai'
import { useState } from 'react'

type Props = {
  img_url: string
  prompt: string
}

const ThumbnailCard = (props: Props) => {
  let { isOpen, onOpen, onClose } = useDisclosure()
  const [isLiked, setIsLiked] = useState(false)
  const getIcon = () => {
    return (
      <Icon
        as={isLiked ? AiFillHeart : AiOutlineHeart}
        m={0}
        boxSize={6}
      ></Icon>
    )
  }
  return (
    <Card maxW="sm" variant="outline">
      <Box onClick={onOpen}>
        <Image
          src={props.img_url}
          alt="A laughing man"
          borderRadius="lg"
          objectFit="cover"
          boxSize={200}
          borderBottomRadius="0"
        />
        <CardBody px={1} py={2}>
          <Center>
            <Text color="" fontSize="md" maxWidth={180} noOfLines={2}>
              {props.prompt}
            </Text>
          </Center>
        </CardBody>
      </Box>
      <Divider />
      <CardFooter justifyContent="space-around" p={2} alignItems="center">
        <DialogCard
          isOpen={isOpen}
          onClose={onClose}
          onOpen={onOpen}
        ></DialogCard>
        <Text color="gray.400">@Clarive</Text>
        <Text color="gray.400">300 view</Text>
        <Button
          rightIcon={getIcon()}
          variant="ghost"
          iconSpacing={0}
          color={isLiked ? 'pink.400' : ''}
          onClick={() => {
            setIsLiked(!isLiked)
            console.log(isLiked)
          }}
          size="xs"
        ></Button>
      </CardFooter>
    </Card>
  )
}

export default ThumbnailCard
