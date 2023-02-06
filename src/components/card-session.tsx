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
    featuredSessions,
    latestSessions,
    setFeaturedSessions,
    setLatestSessions,
  } = useHomeContext()

  const targetSessions =
    props.title === 'Featured'
      ? {
          value: featuredSessions,
          setter: setFeaturedSessions,
        }
      : {
          value: latestSessions,
          setter: setLatestSessions,
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
                  const newSessions = [...targetSessions.value]
                  newSessions[index].liked = !newSessions[index].liked
                  targetSessions.setter(newSessions)
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
