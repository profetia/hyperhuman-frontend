import { useHomeContext } from '@/contexts/home-provider'
import { Session } from '@/models/session'
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Box,
  Heading,
  Flex,
  Wrap,
  WrapItem,
} from '@chakra-ui/react'
import ThumbnailCard from './thumbnail-card'

type Props = {
  title: 'Featured' | 'Latest'
}

const CardSession = (props: Props) => {
  const { latestSessions, featuredSessions } = useHomeContext()

  return (
    <Box>
      <Wrap spacing="24px" maxW="900px">
        {(props.title === 'Featured' ? featuredSessions : latestSessions).map(
          (session, index) => (
            <WrapItem key={index}>
              <ThumbnailCard
                prompt={session.description}
                mediaSource={session.mediaSource}
              ></ThumbnailCard>
            </WrapItem>
          )
        )}
      </Wrap>
    </Box>
  )
}

export default CardSession
