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
  const {
    latestSessions,
    featuredSessions,
    updateLatestSession,
    updateFeaturedSession,
  } = useHomeContext()

  const targetSessions =
    props.title === 'Featured'
      ? {
          value: featuredSessions,
          update: updateFeaturedSession,
        }
      : {
          value: latestSessions,
          update: updateLatestSession,
        }

  return (
    <Box>
      <Wrap spacing="24px" maxW="900px">
        {targetSessions.value.map((session, index) => (
          <WrapItem key={index}>
            <ThumbnailCard
              {...{
                ...session,
                onLike: () => {
                  targetSessions.update(index, {
                    ...session,
                    liked: !session.liked,
                  })
                  console.log('liked')
                },
              }}
            ></ThumbnailCard>
          </WrapItem>
        ))}
      </Wrap>
    </Box>
  )
}

export default CardSession
